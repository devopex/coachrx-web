import { SUMMARY_CACHE_SECONDS, proxyJson } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return proxyJson("/api/public/v1/live_activity/summary", SUMMARY_CACHE_SECONDS, {
    past_hour: 0,
    past_day: 0,
  });
}
