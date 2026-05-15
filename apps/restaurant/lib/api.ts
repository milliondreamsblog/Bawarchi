import type { ApiResponse } from "@bawarchie/types";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

type FetchOptions = {
  token?: string | null;
  signal?: AbortSignal;
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

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: opts.signal,
    });
    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message };
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
