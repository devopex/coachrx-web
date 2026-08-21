/**
 * Turns content/posts/*.mdx into src/data/posts.json at build time.
 *
 * Why this exists: the site deploys to a Cloudflare Worker, which has no
 * filesystem. Reading MDX with fs.readFileSync works locally and during
 * `next build`, then fails at request time with
 *   ENOENT: no such file or directory, readdir '/bundle/content/posts'
 * Generating a JSON module means the content is part of the bundle and no
 * runtime filesystem access is needed anywhere.
 *
 * Runs automatically via the `prebuild` npm script.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SRC = path.join(process.cwd(), "content", "posts");
const OUT = path.join(process.cwd(), "src", "data", "posts.json");

const posts = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(SRC, f), "utf8"));
    // body deliberately excluded: see src/lib/body.ts
    return { ...data, wordCount: data.wordCount ?? content.split(/\s+/).length };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(posts));

const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`generate-posts: ${posts.length} posts -> src/data/posts.json (${kb} KB, frontmatter only)`);

const missing = posts.filter((p) => !p.title || !p.slug || !p.primaryTag);
if (missing.length) {
  console.error(`generate-posts: ${missing.length} posts missing title/slug/primaryTag`);
  process.exit(1);
}
