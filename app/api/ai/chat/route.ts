/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import Menu from "@/lib/models/Menu.js";
import { chat, isLLMConfigured } from "@/lib/llm";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface IItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category: string;
  calories?: number;
  image?: string;
  isVeg?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, restaurantId } = body as {
      messages: ChatMessage[];
      restaurantId: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "messages array is required" },
        { status: 400 }
      );
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    if (!isLLMConfigured()) {
      return NextResponse.json(
        { success: false, error: "LLM provider not configured" },
        { status: 500 }
      );
    }

    await connectDB();

    // Fetch items for this restaurant
    const items = await Item.find({
      restaurantId,
      available: true,
    }).lean() as unknown as IItem[];

    // Fetch structured menu for better context
    let menuContext = "";
    try {
      const menu = await Menu.findOne({ restaurantId }).populate({
        path: "sections.items",
        options: { strictPopulate: false },
      }).lean() as any;

      if (menu?.sections) {
        menuContext = menu.sections
          .map((section: any) => {
            const sectionItems = (section.items as IItem[])
              .filter((i) => i?.available !== false)
              .map((i) => {
                const tags = [
                  i.isVeg ? "🟢 Veg" : null,
                  i.isVegan ? "🌱 Vegan" : null,
                  i.isGlutenFree ? "🌾 GF" : null,
                  i.spiceLevel && i.spiceLevel !== "medium" ? `🌶 ${i.spiceLevel}` : null,
                ].filter(Boolean).join(", ");
                return `  - ${i.name} (₹${i.price}${i.calories ? `, ${i.calories} kcal` : ""}${tags ? `, ${tags}` : ""}${i.description ? `: ${i.description}` : ""})`;
              })
              .join("\n");
            return `${section.name}:\n${sectionItems}`;
          })
          .join("\n\n");
      }
    } catch {
      // fallback to flat item list
    }

    if (!menuContext) {
      menuContext = items
        .map(
          (i) =>
            `- ${i.name} (₹${i.price}${i.calories ? `, ${i.calories} kcal` : ""}${i.category ? `, ${i.category}` : ""}${i.description ? `: ${i.description}` : ""})`
        )
        .join("\n");
    }

    const itemsJson = items.map((i) => ({
      id: i._id.toString(),
      name: i.name,
      price: i.price,
      category: i.category,
      calories: i.calories,
      description: i.description,
      isVeg: i.isVeg,
      isVegan: i.isVegan,
      isGlutenFree: i.isGlutenFree,
      spiceLevel: i.spiceLevel,
    }));

    const systemPrompt = `You are a friendly and helpful restaurant waiter AI assistant. You help customers navigate the menu, answer questions about dishes, make personalized recommendations, and can add items directly to the customer's cart.

MENU:
${menuContext}

AVAILABLE ITEMS (with IDs for your reference):
${JSON.stringify(itemsJson, null, 2)}

RULES:
- Only recommend or add items that exist in the menu above
- Keep responses concise and conversational (2-3 sentences max)
- When suggesting specific dishes, include their IDs in suggestedItemIds
- If asked about something not on the menu, politely say it's not available
- Consider dietary preferences (veg/vegan/gluten-free), calorie goals, and budget
- Be warm, helpful, and enthusiastic about the food
- Dietary tag legend: 🟢 Veg, 🌱 Vegan, 🌾 Gluten-Free, 🌶 spice level

CART ACTIONS — IMPORTANT:
- If the customer says anything like "add [item] to my cart", "order [item]", "I'll have [item]", "get me [item]", or "I want [item]", populate the cartActions array
- Each cartAction: { "itemId": "<exact id from menu>", "name": "<item name>", "qty": <number, default 1>, "action": "add" }
- Extract quantity from phrases like "2 paneer tikka" → qty: 2, "a lassi" → qty: 1
- If quantity is ambiguous, default to 1
- Only add items that exist in the menu

Always respond with valid JSON in this exact format:
{
  "message": "Your conversational response here",
  "suggestedItemIds": ["id1", "id2"],
  "cartActions": [
    { "itemId": "id1", "name": "Item Name", "qty": 2, "action": "add" }
  ]
}

Leave cartActions as [] if the customer is just asking a question (not ordering).
Leave suggestedItemIds as [] if you are not recommending specific items.`;

    const completion = await chat({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const raw = JSON.parse(completion.choices[0].message.content || "{}");
    const message: string = raw.message || "How can I help you?";
    const suggestedItemIds: string[] = raw.suggestedItemIds || [];
    const cartActions: { itemId: string; name: string; qty: number; action: string }[] =
      Array.isArray(raw.cartActions) ? raw.cartActions : [];

    const suggestedItems = items.filter((i) =>
      suggestedItemIds.includes(i._id.toString())
    );

    // Enrich cartActions with full item data so the client can add to cart
    const enrichedCartActions = cartActions
      .filter((a) => a.action === "add" && a.itemId)
      .map((a) => {
        const item = items.find((i) => i._id.toString() === a.itemId);
        if (!item) return null;
        return { ...a, item };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      message,
      suggestedItems,
      cartActions: enrichedCartActions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
