import type { ApiResponse } from "@bawarchie/types";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

const DEFAULT_TIMEOUT_MS = 10_000;

type FetchOptions = {
  token?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
};

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  opts: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  // Wire a timeout. Native fetch has no built-in deadline, so a dropped
  // packet would otherwise spin forever. Caller's signal still wins if
  // provided — we just chain ours onto a fresh controller when they didn't.
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        error: `Request timed out after ${(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s. Check that ${API_URL} is reachable from this device.`,
      };
    }
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T = Record<string, unknown>>(path: string, opts?: FetchOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T = Record<string, unknown>>(
    path: string,
    body: unknown,
    opts?: FetchOptions
  ) => request<T>("POST", path, body, opts),
  patch: <T = Record<string, unknown>>(
    path: string,
    body: unknown,
    opts?: FetchOptions
  ) => request<T>("PATCH", path, body, opts),
  del: <T = Record<string, unknown>>(path: string, opts?: FetchOptions) =>
    request<T>("DELETE", path, undefined, opts),
};

export { API_URL };
