import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Every page on this site is prerendered at build time, so the incremental cache
 * can just be the Workers static assets bundle. No R2, no KV, no extra binding.
 *
 * Without an incremental cache configured, OpenNext falls back to rendering on
 * demand in the Worker, which fails: `src/lib/posts.ts` reads MDX off the
 * filesystem with `fs.readFileSync`, and a Worker has no filesystem. That was
 * the cause of the blanket 500s on the first deploy.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
