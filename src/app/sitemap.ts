import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { TOPICS } from "@/data/topics";

const BASE = "https://www.coachrx.app";
const MARKETING = ["", "/features", "/pricing", "/why-coachrx", "/about", "/articles"];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    ...MARKETING.map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...TOPICS.map((t) => ({ url: `${BASE}/topics/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...posts.map((p) => ({
      url: `${BASE}/articles/${p.slug}`,
      lastModified: new Date(p.updated || p.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
