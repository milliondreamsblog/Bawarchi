/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import { requireSuperAdmin } from "@/lib/utils/apiAuth";
import { embedBatch, buildSearchDocument } from "@/lib/embeddings";

const BATCH_SIZE = 10;

/**
 * POST /api/admin/embed-items
 * Embeds every item that is missing `embeddedAt`. Idempotent — safe to re-run.
 * Use after creating the Atlas Vector Search index, or after switching embedding model.
 */
export async function POST() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    await connectDB();

    const missing = await Item.find({
      $or: [{ embeddedAt: { $exists: false } }, { embeddedAt: null }],
    })
      .select("+embedding +embeddedAt name description category isVeg isVegan isGlutenFree spiceLevel")
      .lean();

    let embedded = 0;
    let failed = 0;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const docs = batch.map((it: any) =>
        buildSearchDocument({
          name: it.name,
          description: it.description,
          category: it.category,
          isVeg: it.isVeg,
          isVegan: it.isVegan,
          isGlutenFree: it.isGlutenFree,
          spiceLevel: it.spiceLevel,
        })
      );

      try {
        const vectors = await embedBatch(docs);
        await Promise.all(
          batch.map((it: any, idx: number) =>
            Item.findByIdAndUpdate(it._id, {
              embedding: vectors[idx],
              embeddedAt: new Date(),
            })
          )
        );
        embedded += batch.length;
      } catch (e: any) {
        console.error(`[embed-items] batch ${i / BATCH_SIZE} failed:`, e?.message);
        failed += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      total: missing.length,
      embedded,
      failed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Backfill failed" },
      { status: 500 }
    );
  }
}
