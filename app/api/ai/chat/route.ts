/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import Menu from "@/lib/models/Menu.js";

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key not configured" },
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
              .map((i) => `  - ${i.name} (₹${i.price}${i.calories ? `, ${i.calories} kcal` : ""}${i.description ? `: ${i.description}` : ""})`)
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
    }));

    const systemPrompt = `You are a friendly and helpful restaurant waiter AI assistant. You help customers navigate the menu, answer questions about dishes, and make personalized recommendations.

MENU:
${menuContext}

RULES:
- Only recommend items that exist in the menu above
- Keep responses concise and conversational (2-3 sentences max)
- When suggesting specific dishes, always include their item IDs in the suggestedItemIds array
- If asked about something not on the menu, politely say it's not available
- Consider dietary preferences, calorie goals, and budget when recommending
- Be warm, helpful, and enthusiastic about the food

AVAILABLE ITEMS (with IDs for your reference):
${JSON.stringify(itemsJson, null, 2)}

Always respond with valid JSON in this exact format:
{
  "message": "Your conversational response here",
  "suggestedItemIds": ["id1", "id2"]
}

The suggestedItemIds array should contain IDs of items you specifically mention or recommend. Leave it as an empty array if you are not recommending specific items.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    const suggestedItems = items.filter((i) =>
      suggestedItemIds.includes(i._id.toString())
    );

    return NextResponse.json({
      success: true,
      message,
      suggestedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
