/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";

interface IItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category: string;
  image?: string;
  calories?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userQuery, restaurantId } = body;

    if (!userQuery) {
      return NextResponse.json(
        { success: false, error: "User query is required" },
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
    const itemFilter: Record<string, unknown> = { available: true };
    if (restaurantId) itemFilter.restaurantId = restaurantId;
    const items = await Item.find(itemFilter).lean() as unknown as IItem[];

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: "No items available at the moment.",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const itemsContext = items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      calories: item.calories,
    }));

    const systemPrompt = `You are a helpful restaurant assistant. You have access to the following menu items:

${JSON.stringify(itemsContext, null, 2)}

Based on the user's query, recommend suitable items from this menu. Consider:
- Calorie requirements
- Price constraints
- Dietary preferences (vegetarian, etc.)
- Meal combinations

Provide your recommendations as a JSON array of item IDs and explain your reasoning.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");

    // Match recommended IDs to actual items
    const recommendedIds = response.recommended_ids || [];
    const recommendations = items.filter((item) =>
      recommendedIds.includes(item._id.toString())
    );

    return NextResponse.json({
      success: true,
      recommendations,
      message: response.message || "Here are my recommendations",
      reasoning: response.reasoning,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
