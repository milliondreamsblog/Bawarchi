/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import { chat, isLLMConfigured } from "@/lib/llm";
import { retrieveRelevantItems, RetrievedItem } from "@/lib/rag";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const retrieved = await retrieveRelevantItems(lastUser, restaurantId, 8);

    const menuContext = retrieved
      .map((i) => {
        const tags = [
          i.isVeg ? "🟢 Veg" : null,
          i.isVegan ? "🌱 Vegan" : null,
          i.isGlutenFree ? "🌾 GF" : null,
          i.spiceLevel && i.spiceLevel !== "medium" ? `🌶 ${i.spiceLevel}` : null,
        ]
          .filter(Boolean)
          .join(", ");
        return `- ${i.name} (₹${i.price}${i.calories ? `, ${i.calories} kcal` : ""}${
          i.category ? `, ${i.category}` : ""
        }${tags ? `, ${tags}` : ""}${i.description ? `: ${i.description}` : ""})`;
      })
      .join("\n");

    const itemsJson = retrieved.map((i) => ({
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

RELEVANT MENU ITEMS (semantically retrieved for this query):
${menuContext || "(no items currently available)"}

ITEMS WITH IDS (use these IDs in suggestedItemIds and cartActions):
${JSON.stringify(itemsJson, null, 2)}

RULES:
- Only recommend or add items from the list above. If the customer asks about something not listed, say it's not currently relevant or available.
- Keep responses concise and conversational (2-3 sentences max).
- When suggesting specific dishes, include their IDs in suggestedItemIds.
- Consider dietary preferences (veg/vegan/gluten-free), calorie goals, and budget.
- Be warm, helpful, and enthusiastic about the food.
- Dietary tag legend: 🟢 Veg, 🌱 Vegan, 🌾 Gluten-Free, 🌶 spice level.

CART ACTIONS:
- If the customer says "add [item] to my cart", "order [item]", "I'll have [item]", "get me [item]", or "I want [item]", populate cartActions.
- Each cartAction: { "itemId": "<exact id from the list above>", "name": "<item name>", "qty": <number, default 1>, "action": "add" }.
- Extract quantity from phrases like "2 paneer tikka" → qty: 2; "a lassi" → qty: 1.
- If quantity is ambiguous, default to 1.

Always respond with valid JSON in this exact format:
{
  "message": "Your conversational response here",
  "suggestedItemIds": ["id1", "id2"],
  "cartActions": [
    { "itemId": "id1", "name": "Item Name", "qty": 2, "action": "add" }
  ]
}

Leave cartActions as [] if the customer is just asking a question.
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

    const suggestedItems = retrieved.filter((i) =>
      suggestedItemIds.includes(i._id.toString())
    );

    // Cart actions might reference items the customer mentioned earlier in the
    // conversation — those won't always be in the current retrieval. Look up
    // anything missing directly so "add the paneer tikka you mentioned" still works.
    const enrichedCartActions = await Promise.all(
      cartActions
        .filter((a) => a.action === "add" && a.itemId)
        .map(async (a) => {
          let item: RetrievedItem | null =
            retrieved.find((i) => i._id.toString() === a.itemId) || null;
          if (!item) {
            const found = await Item.findOne({
              _id: a.itemId,
              restaurantId,
              available: true,
            }).lean();
            item = found ? (found as unknown as RetrievedItem) : null;
          }
          if (!item) return null;
          return { ...a, item };
        })
    );

    return NextResponse.json({
      success: true,
      message,
      suggestedItems,
      cartActions: enrichedCartActions.filter(Boolean),
    });
  } catch (error: any) {
    console.error("[ai/chat] failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
