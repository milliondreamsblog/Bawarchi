/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Feedback from "@/lib/models/Feedback.js";
import { requireAuth } from "@/lib/utils/apiAuth";

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
      .lean();

    const headers = [
      "Date",
      "Table",
      "Rating",
      "Review Text",
      "Sentiment",
      "Sentiment Score",
      "Tags",
      "AI Summary",
    ];

    const escapeCSV = (val: string) =>
      `"${String(val || "").replace(/"/g, '""')}"`;

    const rows = reviews.map((r: any) => [
      new Date(r.createdAt).toLocaleString("en-IN"),
      r.tableSlug,
      r.rating,
      escapeCSV(r.text),
      r.sentiment?.label || "",
      r.sentiment?.score ?? "",
      escapeCSV((r.sentiment?.tags || []).join(", ")),
      escapeCSV(r.sentiment?.summary || ""),
    ]);

    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join(
      "\n"
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
