import data from "@/data/posts.json";

export type Post = {
  title: string; slug: string; description: string;
  date: string; updated?: string; author: string;
  tags: string[]; primaryTag: string;
  featuredImage: string; featuredImageAlt: string;
  readingTime: number; wordCount: number;
  draft: boolean; legacyUrl: string;
};

/**
 * Content comes from a generated JSON module, never the filesystem — see
 * scripts/generate-posts.mjs. Do not reintroduce `fs` here: it works locally and
 * throws ENOENT in the Worker at request time.
 */
const POSTS = data as unknown as Post[];

export const getAllPosts = (): Post[] => POSTS;
export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
export const getPostsByTag = (tag: string) =>
  POSTS.filter((p) => p.primaryTag === tag || p.tags.includes(tag));

/** Related = same primary tag, newest first, then any shared tag as filler. */
export function getRelated(post: Post, n = 3): Post[] {
  const same = POSTS.filter((p) => p.slug !== post.slug && p.primaryTag === post.primaryTag);
  if (same.length >= n) return same.slice(0, n);
  const filler = POSTS.filter(
    (p) => p.slug !== post.slug && !same.includes(p) && p.tags.some((t) => post.tags.includes(t)),
  );
  return [...same, ...filler].slice(0, n);
}
