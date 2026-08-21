import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // No LLM crawler blocks. Being cited by models is a goal of this site,
    // not a risk to manage. If that ever changes, change it here.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/keystatic", "/api/"] }],
    sitemap: "https://www.coachrx.app/sitemap.xml",
  };
}
