/**
 * The Blog Post design has an author card with a name, an avatar and a real bio.
 * Only two bylines exist across the 340 migrated posts, so this list is short.
 *
 * Deliberately NOT fabricating per-post bylines. A generic byline is a weak
 * authority signal, but a wrong one is worse. If Carl assigns real authors to the
 * top posts later, add them here and set `author` in that post's frontmatter.
 */
export type Author = { name: string; role: string; bio: string; avatar?: string };

export const AUTHORS: Record<string, Author> = {
  "CoachRx Team": {
    name: "CoachRx Team",
    role: "CoachRx",
    bio: "Written by the coaches and educators behind CoachRx and the OPEX Method, drawing on client programs we design and review every week.",
  },
  "Ashley Brownell": {
    name: "Ashley Brownell",
    role: "OPEX Fitness",
    bio: "Coach and educator at OPEX Fitness, working with coaches on assessment, program design and building a practice that lasts.",
  },
};

export const getAuthor = (name: string): Author =>
  AUTHORS[name] ?? { name, role: "CoachRx", bio: "" };
