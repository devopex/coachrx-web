import data from "@/data/changelog.json";

export type Release = {
  title: string; slug: string; date: string; description: string; draft: boolean; body: string;
};

/** Generated at build time by scripts/generate-posts.mjs. No filesystem reads. */
const RELEASES = data as unknown as Release[];

export const getReleases = () => RELEASES;
export const getRelease = (slug: string) => RELEASES.find((r) => r.slug === slug);
