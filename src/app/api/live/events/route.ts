import { EVENTS_CACHE_SECONDS, PLAYBACK_WINDOW_SECONDS, proxyJson } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return proxyJson(
    `/api/public/v1/live_activity/events?window=${PLAYBACK_WINDOW_SECONDS}`,
    EVENTS_CACHE_SECONDS,
    { events: [] },
  );
}
