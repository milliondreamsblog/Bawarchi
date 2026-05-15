import "dotenv/config";
import OpenAI from "openai";
import Item from "../lib/models/Item.js";
import connectDB from "../lib/db.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 10;

function buildSearchDocument(item) {
  const parts = [item.name];
  if (item.description?.trim()) parts.push(item.description.trim());
  if (item.category && item.category !== "General") parts.push(`Category: ${item.category}`);
  parts.push(item.isVeg ? "Vegetarian" : "Non-vegetarian");
  if (item.isVegan) parts.push("Vegan");
  if (item.isGlutenFree) parts.push("Gluten-free");
  if (item.spiceLevel && item.spiceLevel !== "medium") parts.push(`Spice: ${item.spiceLevel}`);
  return parts.join(". ") + ".";
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in .env");
    process.exit(1);
  }

  const onlySlug = process.argv[2];

  await connectDB();

  const filter = {
    $or: [{ embeddedAt: { $exists: false } }, { embeddedAt: null }],
  };

  if (onlySlug) {
    const Restaurant = (await import("../lib/models/Restaurant.js")).default;
    const r = await Restaurant.findOne({ slug: onlySlug }).select("_id name").lean();
    if (!r) {
      console.error(`No restaurant with slug "${onlySlug}"`);
      process.exit(1);
    }
    filter.restaurantId = r._id;
    console.log(`Embedding items for "${r.name}" only.`);
  }

  const missing = await Item.find(filter)
    .select("+embedding +embeddedAt name description category isVeg isVegan isGlutenFree spiceLevel")
    .lean();

  if (missing.length === 0) {
    console.log("Nothing to embed — every item already has an embedding.");
    process.exit(0);
  }

  console.log(`Found ${missing.length} items needing embeddings.`);

  const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: GEMINI_BASE_URL,
  });

  let embedded = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const inputs = batch.map(buildSearchDocument);

    try {
      const res = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: inputs,
        dimensions: EMBEDDING_DIMENSIONS,
      });
      const vectors = res.data.map((d) => d.embedding);

      await Promise.all(
        batch.map((it, idx) =>
          Item.findByIdAndUpdate(it._id, {
            embedding: vectors[idx],
            embeddedAt: new Date(),
          })
        )
      );

      embedded += batch.length;
      process.stdout.write(`  ${embedded}/${missing.length}\r`);
    } catch (e) {
      console.error(`\nBatch ${i / BATCH_SIZE} failed:`, e?.message || e);
      failed += batch.length;
    }
  }

  console.log(`\n✓ Embedded ${embedded} items, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
