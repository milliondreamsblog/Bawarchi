import OpenAI from "openai";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const EMBEDDING_MODEL = "gemini-embedding-001";

// gemini-embedding-001 is MRL-trained and supports 768/1536/3072 via the
// `dimensions` parameter. We use 768 to match the Atlas vector index.
export const EMBEDDING_DIMENSIONS = 768;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is required for embeddings. Embeddings are locked to a single provider; see lib/embeddings.ts."
    );
  }
  _client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL });
  return _client;
}

export async function embed(text: string): Promise<number[]> {
  const trimmed = (text || "").trim().slice(0, 8000);
  if (!trimmed) throw new Error("Cannot embed empty text");
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const cleaned = texts.map((t) => (t || "").trim().slice(0, 8000));
  if (cleaned.some((t) => !t)) throw new Error("embedBatch: all inputs must be non-empty");
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return res.data.map((d) => d.embedding);
}

export interface EmbeddableItem {
  name: string;
  description?: string | null;
  category?: string | null;
  isVeg?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: string | null;
}

export function buildSearchDocument(item: EmbeddableItem): string {
  const parts: string[] = [item.name];
  if (item.description?.trim()) parts.push(item.description.trim());
  if (item.category && item.category !== "General") parts.push(`Category: ${item.category}`);
  parts.push(item.isVeg ? "Vegetarian" : "Non-vegetarian");
  if (item.isVegan) parts.push("Vegan");
  if (item.isGlutenFree) parts.push("Gluten-free");
  if (item.spiceLevel && item.spiceLevel !== "medium") parts.push(`Spice: ${item.spiceLevel}`);
  return parts.join(". ") + ".";
}
