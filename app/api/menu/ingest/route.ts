/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/apiAuth";
import { chat, isLLMConfigured } from "@/lib/llm";

const SYSTEM_PROMPT = `You are a precise menu OCR engine. Extract every item from the provided restaurant menu photograph into structured JSON.

Return ONLY valid JSON in this exact shape:
{
  "restaurantName": <string or null>,
  "sections": [
    {
      "name": <string>,
      "items": [
        {
          "name": <string>,
          "description": <string or null>,
          "price": <number — INR, numeric only, no currency symbol>,
          "isVeg": <boolean>,
          "spiceLevel": <"mild" | "medium" | "hot" or null>,
          "confidence": <number 0-1>
        }
      ]
    }
  ],
  "warnings": [<string>]
}

Rules:
- Group items under their visible section heading. If none visible, use a single "Menu" section.
- Prices: numeric value only. If illegible, use 0 and add a warning.
- isVeg: green dot or "VEG" label = true; red dot or "NON-VEG" = false. If ambiguous, infer from name (paneer, dal, sabzi, veg = true; chicken, mutton, fish, prawn = false). Default false when truly unclear.
- spiceLevel: only set when explicitly indicated by chili icons or wording.
- Skip non-item content (offers, contact info, addresses, restaurant tagline).
- confidence: 1.0 = perfectly legible; 0.5 = uncertain on name or price; <0.5 = highly uncertain.`;

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isLLMConfigured()) {
    return NextResponse.json(
      { success: false, error: "LLM provider not configured" },
      { status: 500 }
    );
  }

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const completion = await chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all menu items from this photo." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 6000,
    });

    const raw = JSON.parse(completion.choices[0].message.content || "{}");

    const sections = (Array.isArray(raw?.sections) ? raw.sections : [])
      .map((s: any) => ({
        name: typeof s?.name === "string" && s.name.trim() ? s.name.trim() : "Menu",
        items: (Array.isArray(s?.items) ? s.items : [])
          .filter((it: any) => it && typeof it.name === "string" && it.name.trim())
          .map((it: any) => ({
            name: it.name.trim(),
            description: typeof it.description === "string" ? it.description.trim() : "",
            price: typeof it.price === "number" && it.price >= 0 ? it.price : 0,
            isVeg: it.isVeg === true,
            spiceLevel: ["mild", "medium", "hot"].includes(it.spiceLevel) ? it.spiceLevel : null,
            confidence:
              typeof it.confidence === "number"
                ? Math.max(0, Math.min(1, it.confidence))
                : 0.5,
          })),
      }))
      .filter((s: any) => s.items.length > 0);

    return NextResponse.json({
      success: true,
      restaurantName: typeof raw?.restaurantName === "string" ? raw.restaurantName : null,
      sections,
      warnings: Array.isArray(raw?.warnings)
        ? raw.warnings.filter((w: any) => typeof w === "string")
        : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to extract menu" },
      { status: 500 }
    );
  }
}
