/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import { chat, isLLMConfigured } from "@/lib/llm";
import { retrieveRelevantItems } from "@/lib/rag";

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
    const retrieved = await retrieveRelevantItems(userQuery, restaurantId, 8);

    if (retrieved.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: "No items available at the moment.",
      });
    }

    const itemsContext = retrieved.map((it) => ({
      id: it._id.toString(),
      name: it.name,
      description: it.description,
      price: it.price,
      category: it.category,
      calories: it.calories,
    }));

    const systemPrompt = `You are a helpful restaurant assistant. Based on the user's query, pick the best fit from the candidate items below.

CANDIDATE ITEMS (already pre-filtered by relevance):
${JSON.stringify(itemsContext, null, 2)}

Consider:
- Calorie requirements
- Price constraints
- Dietary preferences (vegetarian, etc.)
- Meal combinations

Respond with valid JSON in this shape:
{
  "recommended_ids": ["<id from list above>", ...],
  "reasoning": "<brief explanation>",
  "message": "<friendly summary for the customer>"
}`;

    const completion = await chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    const recommendedIds: string[] = response.recommended_ids || [];
    const recommendations = retrieved.filter((it) =>
      recommendedIds.includes(it._id.toString())
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
