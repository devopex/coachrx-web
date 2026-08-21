import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Post = {
  title: string; slug: string; description: string;
  date: string; updated?: string; author: string;
  tags: string[]; primaryTag: string;
  featuredImage: string; featuredImageAlt: string;
  readingTime: number; wordCount: number;
  draft: boolean; legacyUrl: string;
  body: string;
};

const DIR = path.join(process.cwd(), "content", "posts");

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (cache) return cache;
  const posts = fs.readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(DIR, f), "utf8"));
      return { ...(data as Omit<Post, "body">), body: content };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  cache = posts;
  return posts;
}

export const getPost = (slug: string) => getAllPosts().find((p) => p.slug === slug);
export const getPostsByTag = (tag: string) =>
  getAllPosts().filter((p) => p.primaryTag === tag || p.tags.includes(tag));

/** Related = same primary tag, newest first, excluding self. */
export function getRelated(post: Post, n = 3): Post[] {
  const same = getAllPosts().filter((p) => p.slug !== post.slug && p.primaryTag === post.primaryTag);
  if (same.length >= n) return same.slice(0, n);
  const filler = getAllPosts().filter(
    (p) => p.slug !== post.slug && !same.includes(p) && p.tags.some((t) => post.tags.includes(t)),
  );
  return [...same, ...filler].slice(0, n);
}
