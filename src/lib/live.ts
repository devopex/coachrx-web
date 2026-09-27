import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PLAYBACK_WINDOW_SECONDS = 60;
export const EVENTS_CACHE_SECONDS = 10;
export const SUMMARY_CACHE_SECONDS = 60;
export const FAILURE_CACHE_SECONDS = 5;
const DEFAULT_ORIGIN = "https://dashboard.coachrx.app";

type Env = { COACHRX_API_ORIGIN?: string };

export function apiOrigin(): string {
  let fromWorker: string | undefined;
  try {
    fromWorker = (getCloudflareContext().env as Env).COACHRX_API_ORIGIN;
  } catch {
    fromWorker = undefined;
  }
  return (fromWorker || process.env.COACHRX_API_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
}

function jsonResponse(body: string, maxAge: number): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    },
  });
}

export function emptyPayload(base: Record<string, unknown>): string {
  return JSON.stringify({ ...base, server_time: new Date().toISOString() });
}

export async function proxyJson(path: string, ttl: number, empty: Record<string, unknown>): Promise<Response> {
  const url = `${apiOrigin()}${path}`;
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const key = new Request(url, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) return new Response(hit.body, hit);
    } catch {}
  }
  try {
    const upstream = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(3000),
      cf: { cacheTtl: ttl, cacheEverything: true },
    } as RequestInit);
    if (!upstream.ok) return jsonResponse(emptyPayload(empty), FAILURE_CACHE_SECONDS);
    const text = await upstream.text();
    JSON.parse(text);
    const response = jsonResponse(text, ttl);
    if (cache) {
      try {
        await cache.put(key, response.clone());
      } catch {}
    }
    return response;
  } catch {
    return jsonResponse(emptyPayload(empty), FAILURE_CACHE_SECONDS);
  }
}
