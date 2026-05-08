/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Feedback from "@/lib/models/Feedback.js";
import { requireAuth } from "@/lib/utils/apiAuth";
import { chat, isLLMConfigured } from "@/lib/llm";

/* ── POST /api/feedback — submit a review (public, from customer) ── */
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { restaurantId, orderId, tableSlug, rating, text } = body;

    if (!restaurantId || !tableSlug || !rating) {
      return NextResponse.json(
        { success: false, error: "restaurantId, tableSlug, and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Run AI sentiment analysis if text is provided
    let sentiment: {
      score: number;
      label: string;
      tags: string[];
      summary: string;
    } | undefined;

    if (text?.trim() && isLLMConfigured()) {
      try {
        const completion = await chat({
          messages: [
            {
              role: "system",
              content: `You are a sentiment analysis engine for restaurant reviews.
Analyse the review and return ONLY valid JSON with this exact shape:
{
  "score": <float from -1.0 (very negative) to 1.0 (very positive)>,
  "label": <"positive" | "neutral" | "negative">,
  "tags": <array of 1-4 short aspect tags, e.g. ["food quality", "wait time", "value", "staff"]>,
  "summary": <one concise sentence summarising the review>
}`,
            },
            {
              role: "user",
              content: `Rating: ${rating}/5\nReview: "${text.trim()}"`,
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 200,
        });

        const parsed = JSON.parse(
          completion.choices[0].message.content || "{}"
        );

        sentiment = {
          score:   typeof parsed.score === "number" ? parsed.score : rating / 5 - 0.5,
          label:   ["positive", "neutral", "negative"].includes(parsed.label)
            ? parsed.label
            : rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
          tags:    Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [],
          summary: typeof parsed.summary === "string" ? parsed.summary : "",
        };
      } catch {
        // AI unavailable — fall back to a rule-based sentiment from rating
        sentiment = {
          score:   (rating - 3) / 2,
          label:   rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
          tags:    [],
          summary: "",
        };
      }
    }

    const feedback = await Feedback.create({
      restaurantId,
      ...(orderId && { orderId }),
      tableSlug,
      rating,
      text: text?.trim() || "",
      ...(sentiment && { sentiment }),
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ── GET /api/feedback?restaurantId= — admin view (auth-guarded) ── */
export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const reviews = await Feedback.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Aggregate summary stats
    const total = reviews.length;
    const avgRating =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    const sentimentCounts = {
      positive: reviews.filter((r) => r.sentiment?.label === "positive").length,
      neutral:  reviews.filter((r) => r.sentiment?.label === "neutral").length,
      negative: reviews.filter((r) => r.sentiment?.label === "negative").length,
    };

    return NextResponse.json({
      success: true,
      reviews,
      summary: {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingDist,
        sentimentCounts,
        positivePercent:
          total > 0
            ? Math.round((sentimentCounts.positive / total) * 100)
            : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
