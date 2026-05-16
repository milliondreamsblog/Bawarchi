// LLM-as-judge. Builds the assembled prompt from rubric.md + few-shot.md +
// judge-prompt.md + per-call payload, calls Gemini via the OpenAI-compatible
// API, parses the JSON response, validates that total == sum of axis scores.
//
// CRITICAL — leakage hygiene: the payload is built from toJudgeView(persona),
// which intentionally excludes persona.expectedBehavior. If you change this
// to include answer-key fields, you've broken the methodology.
//
// Provider strategy: Gemini primary (matches the production system), OpenAI
// auto-fallback on transient errors (rate-limit, 5xx, network). This is the
// SAME pattern as lib/llm.ts — replicated inline because we can't import .ts
// from .mjs. When/if we upgrade to a true cross-family judge (OpenAI- or
// Claude-primary), only judgeCall() changes.

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { toJudgeView } from "./personaLoader.mjs";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const DEFAULT_JUDGE_MODEL = process.env.JUDGE_MODEL || "gemini-2.0-flash";

// ─── Prompt assembly ─────────────────────────────────────────────────
let _assembledPromptCache = null;
function assembleSystemPrompt({ rubricPath, fewShotPath, promptPath }) {
  if (_assembledPromptCache) return _assembledPromptCache;
  const rubric = fs.readFileSync(rubricPath, "utf8").trim();
  const fewShot = fs.readFileSync(fewShotPath, "utf8").trim();
  const template = fs.readFileSync(promptPath, "utf8");
  const assembled = template
    .replace("[[RUBRIC]]", rubric)
    .replace("[[FEW_SHOT]]", fewShot);
  _assembledPromptCache = assembled;
  return assembled;
}

// ─── Payload formatting ──────────────────────────────────────────────
function formatMenuLine(it) {
  const tags = [];
  if (it.isVeg) tags.push("veg");
  if (it.isVegan) tags.push("vegan");
  if (it.isGlutenFree) tags.push("GF");
  if (it.spiceLevel && it.spiceLevel !== "medium") tags.push(`spice:${it.spiceLevel}`);
  const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
  const cat = it.category && it.category !== "General" ? ` (${it.category})` : "";
  const desc = it.description ? ` — ${it.description}` : "";
  return `  - ${it.name}${cat}${tagStr}${desc}`;
}

export function buildJudgePayload({ persona, destinationName, menu, retrieved }) {
  const view = toJudgeView(persona); // expectedBehavior NOT included
  const lines = [];
  lines.push("PERSONA");
  lines.push(`  personaId: ${view.personaId}`);
  lines.push(`  description: ${view.description}`);
  lines.push("  tasteAxes:");
  lines.push(`    dietaryClass: ${view.tasteAxes.dietaryClass}`);
  lines.push(`    spicePreference: ${view.tasteAxes.spicePreference}`);
  lines.push(`    homeCuisine: ${view.tasteAxes.homeCuisine}`);
  lines.push(`    primaryTraits: ${view.tasteAxes.primaryTraits.join(", ")}`);
  lines.push(`    avoidance: ${view.tasteAxes.avoidance.join(", ")}`);
  lines.push("");
  lines.push(`TARGET RESTAURANT: ${destinationName}`);
  lines.push("AVAILABLE ITEMS:");
  for (const it of menu) lines.push(formatMenuLine(it));
  lines.push("");
  lines.push("RETRIEVED TOP-5 (in rank order):");
  retrieved.forEach((it, i) => {
    lines.push(`  ${i + 1}. ${it.name}`);
  });
  return lines.join("\n");
}

// ─── Provider clients (lazy) ─────────────────────────────────────────
let _geminiClient = null;
let _openaiClient = null;
function getGemini() {
  if (_geminiClient) return _geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  // maxRetries=5 with built-in exponential backoff handles the free-tier
  // rate ceiling (typically 15 req/min on gemini-2.0-flash) gracefully.
  _geminiClient = new OpenAI({ apiKey: key, baseURL: GEMINI_BASE_URL, maxRetries: 5 });
  return _geminiClient;
}
function getOpenAI() {
  if (_openaiClient) return _openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  _openaiClient = new OpenAI({ apiKey: key, maxRetries: 5 });
  return _openaiClient;
}

function isTransient(err) {
  const status = err?.status;
  const code = err?.code;
  if (status === 429 || status === 401 || status === 403) return true;
  if (typeof status === "number" && status >= 500) return true;
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") return true;
  return false;
}

// ─── Parsing + validation ────────────────────────────────────────────
function safeParse(text) {
  // Strip optional markdown fences just in case the judge ignored instructions.
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(trimmed);
}

function validateAxisScore(v, axis) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 3) {
    throw new Error(`judge: invalid ${axis} score: ${v}`);
  }
  return v;
}

function validateAndFix(parsed) {
  const dietary = validateAxisScore(parsed.dietary, "dietary");
  const flavor = validateAxisScore(parsed.flavor, "flavor");
  const bridge = validateAxisScore(parsed.bridge, "bridge");
  const ranking = validateAxisScore(parsed.ranking, "ranking");
  const sum = dietary + flavor + bridge + ranking;
  const total = typeof parsed.total === "number" ? parsed.total : sum;
  const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "";
  return {
    dietary,
    flavor,
    bridge,
    ranking,
    total: sum, // authoritative; if judge's total disagrees, ours wins
    judgeReportedTotal: total,
    totalMatchesSum: total === sum,
    reasoning,
  };
}

// ─── Single judge call (one provider) ────────────────────────────────
// Outer retry on top of OpenAI SDK's internal maxRetries — surfaces
// progress feedback to the user during long rate-limit waits. The SDK
// already retries with backoff; this loop catches the case where the SDK
// gave up but a longer wait would have succeeded.
async function callOne(client, model, systemPrompt, userPayload, temperature) {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_S = [15, 30, 60];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
      });
      const content = completion.choices?.[0]?.message?.content || "";
      const usage = completion.usage || {};
      return { content, usage };
    } catch (err) {
      const isRate = err?.status === 429;
      if (isRate && attempt < MAX_ATTEMPTS) {
        const wait = BACKOFF_S[attempt - 1];
        console.warn(`    [judge] 429 rate-limited; waiting ${wait}s (attempt ${attempt}/${MAX_ATTEMPTS - 1})...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("callOne: exhausted retry attempts");
}

// ─── Public entry point ──────────────────────────────────────────────
export async function judge({
  persona,
  destinationName,
  menu,
  retrieved,
  rubricPath,
  fewShotPath,
  promptPath,
  model = DEFAULT_JUDGE_MODEL,
  temperature = 0.0,
}) {
  const systemPrompt = assembleSystemPrompt({ rubricPath, fewShotPath, promptPath });
  const userPayload = buildJudgePayload({ persona, destinationName, menu, retrieved });

  const gemini = getGemini();
  const openai = getOpenAI();
  if (!gemini && !openai) {
    throw new Error(
      "judge: neither GEMINI_API_KEY nor OPENAI_API_KEY is set. Configure at least one."
    );
  }

  // Primary: Gemini. Fallback: OpenAI. (Matches lib/llm.ts pattern.)
  let primaryProvider = "gemini";
  let primaryClient = gemini;
  let primaryModel = model;
  let fallbackProvider = "openai";
  let fallbackClient = openai;
  let fallbackModel = process.env.JUDGE_FALLBACK_MODEL || "gpt-4o-mini";

  if (!primaryClient) {
    primaryProvider = fallbackProvider;
    primaryClient = fallbackClient;
    primaryModel = fallbackModel;
    fallbackClient = null;
  }

  let raw, usage, providerUsed;
  try {
    const r = await callOne(primaryClient, primaryModel, systemPrompt, userPayload, temperature);
    raw = r.content;
    usage = r.usage;
    providerUsed = primaryProvider;
  } catch (err) {
    if (!fallbackClient || !isTransient(err)) throw err;
    console.warn(
      `  [judge] ${primaryProvider} ${primaryModel} failed (${err.status || err.code}); falling back to ${fallbackProvider}`
    );
    const r = await callOne(fallbackClient, fallbackModel, systemPrompt, userPayload, temperature);
    raw = r.content;
    usage = r.usage;
    providerUsed = fallbackProvider;
  }

  let parsed;
  try {
    parsed = safeParse(raw);
  } catch (e) {
    throw new Error(`judge: failed to parse JSON response: ${e.message}\n--- raw ---\n${raw}`);
  }
  const validated = validateAndFix(parsed);
  return {
    ...validated,
    providerUsed,
    modelUsed: providerUsed === "gemini" ? primaryModel : fallbackModel,
    usage: {
      inputTokens: usage.prompt_tokens || usage.input_tokens || 0,
      outputTokens: usage.completion_tokens || usage.output_tokens || 0,
    },
  };
}
