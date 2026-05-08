import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

export type LLMProvider = "gemini" | "openai";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
};

function resolveProvider(): LLMProvider {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "gemini" || explicit === "openai") return explicit;
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "openai";
}

export interface LLMHandle {
  provider: LLMProvider;
  client: OpenAI;
  defaultModel: string;
}

function buildHandle(provider: LLMProvider): LLMHandle | null {
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return {
      provider: "gemini",
      client: new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL }),
      defaultModel: process.env.LLM_MODEL || DEFAULT_MODELS.gemini,
    };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    provider: "openai",
    client: new OpenAI({ apiKey }),
    defaultModel: process.env.LLM_MODEL || DEFAULT_MODELS.openai,
  };
}

export function getLLM(): LLMHandle {
  const provider = resolveProvider();
  const handle = buildHandle(provider);
  if (!handle) {
    throw new Error(
      provider === "gemini"
        ? "GEMINI_API_KEY is not configured"
        : "OPENAI_API_KEY is not configured"
    );
  }
  return handle;
}

function getFallback(primary: LLMProvider): LLMHandle | null {
  const other: LLMProvider = primary === "gemini" ? "openai" : "gemini";
  const handle = buildHandle(other);
  if (!handle) return null;
  // Fallback model can be overridden separately so the primary's LLM_MODEL
  // doesn't bleed across providers (e.g. "gpt-4o-mini" sent to Gemini).
  const override = process.env.LLM_FALLBACK_MODEL;
  return override ? { ...handle, defaultModel: override } : { ...handle, defaultModel: DEFAULT_MODELS[other] };
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

function isTransient(err: unknown): boolean {
  const e = err as { status?: number; code?: string; name?: string };
  if (e?.status === 429) return true;          // rate limit
  if (e?.status === 401 || e?.status === 403) return true; // auth — could be a key issue, try the other provider
  if (typeof e?.status === "number" && e.status >= 500) return true;
  if (e?.code === "ECONNRESET" || e?.code === "ETIMEDOUT" || e?.code === "ENOTFOUND") return true;
  if (e?.name === "APIConnectionError" || e?.name === "APIConnectionTimeoutError") return true;
  return false;
}

/**
 * Run a chat completion against the configured primary provider.
 * On transient errors (rate limit, 5xx, network, auth), automatically
 * retries against the other provider if it's configured.
 */
export async function chat(
  params: Omit<ChatCompletionCreateParamsNonStreaming, "model"> & { model?: string }
) {
  const primary = getLLM();
  try {
    return await primary.client.chat.completions.create({
      ...params,
      model: params.model || primary.defaultModel,
    });
  } catch (err) {
    if (!isTransient(err)) throw err;

    const fallback = getFallback(primary.provider);
    if (!fallback) throw err;

    const status = (err as { status?: number; code?: string }).status ??
                   (err as { code?: string }).code ?? "unknown";
    console.warn(
      `[llm] primary "${primary.provider}" failed (${status}); falling back to "${fallback.provider}"`
    );

    return await fallback.client.chat.completions.create({
      ...params,
      model: params.model || fallback.defaultModel,
    });
  }
}
