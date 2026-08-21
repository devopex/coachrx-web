import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Reads one post's MDX body from disk.
 *
 * This is the ONLY filesystem read left, and it is only ever called while
 * prerendering `/articles/[slug]` during `next build`. Every article page is
 * statically generated with `dynamicParams = false`, so the deployed Worker
 * serves prerendered HTML and never reaches this code.
 *
 * Bodies are kept off the JSON index on purpose: inlining all 340 of them pushed
 * the Worker bundle to 3.03 MB gzipped, over the 3 MB limit, to carry text the
 * Worker never reads.
 */
export function getPostBody(slug: string): string {
  const file = path.join(process.cwd(), "content", "posts", `${slug}.mdx`);
  return matter(fs.readFileSync(file, "utf8")).content;
}
