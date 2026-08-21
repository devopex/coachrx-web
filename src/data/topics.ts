/**
 * Topic archives. The `intro` copy is the reason these pages earn anything:
 * a bare filtered grid is invisible to crawlers and to models deciding who to
 * cite. Every topic that gets a page must have real editorial copy here.
 *
 * MIN_POSTS: a tag with fewer than this many posts gets no archive page. A
 * one-post "topic" is a weaker authority claim than no claim at all.
 */
export const MIN_POSTS = 3;

export type Topic = { tag: string; slug: string; title: string; intro: string };

export const TOPICS: Topic[] = [
  {
    tag: "Program Design",
    slug: "program-design",
    title: "Program Design",
    intro:
      "Individual program design is the core skill of professional coaching, and it is the thing most software quietly discourages. These articles cover how experienced coaches structure training for one person at a time: choosing an aim, sequencing energy systems and strength work, progressing a lift over months rather than weeks, and knowing when a plan should change. Most are drawn from real client programs written by OPEX coaches.",
  },
  {
    tag: "Program Design Pro Tip",
    slug: "program-design-pro-tip",
    title: "Program Design Pro Tips",
    intro:
      "Short, practical tips for designing and delivering programs faster inside CoachRx. Each one solves a specific friction a coach hits in a normal working week, from building reusable templates to writing program notes a client will actually read. Read one in two minutes and use it the same day.",
  },
  {
    tag: "Frameworks",
    slug: "frameworks",
    title: "Coaching Frameworks",
    intro:
      "The models OPEX coaches use to make decisions: assessment, consultation, lifestyle prescription, and the Body / Move / Work view of a client. Frameworks are what let a coach act consistently across very different people without falling back on a template. These articles explain each one and show it applied to a real client.",
  },
  {
    tag: "Marketing For Fitness Coaches",
    slug: "marketing-for-fitness-coaches",
    title: "Marketing for Fitness Coaches",
    intro:
      "Getting clients is the part of coaching nobody certified you for. These articles cover the business side of a coaching practice: finding your first clients, moving from in-person to remote, pricing and packaging, positioning against cheap templated programming, and building a practice that holds together financially. Written for coaches who would rather coach than sell.",
  },
  {
    tag: "Feature Highlight",
    slug: "feature-highlight",
    title: "CoachRx Feature Highlights",
    intro:
      "What is new in CoachRx and, more usefully, why it exists and how coaches are using it. Each highlight walks through a real workflow rather than listing settings, so you can tell in a minute whether a feature changes anything about how you work.",
  },
  {
    tag: "Coach Spotlight",
    slug: "coach-spotlight",
    title: "Coach Spotlights",
    intro:
      "Long-form interviews with working coaches about how they actually built their practice. Career changes, first clients, pricing mistakes, what they would do differently. These are the least polished and most useful articles on the site, because the coaches involved were unusually honest about the parts that did not go well.",
  },
  {
    tag: "Case Study",
    slug: "case-study",
    title: "Case Studies",
    intro:
      "Specific coaching problems, what the coach changed, and what happened. Client plateaus, retention slides, program overhauls and business turnarounds, documented closely enough that you can judge whether the approach would transfer to your own clients.",
  },
  {
    tag: "Community Call",
    slug: "community-call",
    title: "Community Calls",
    intro:
      "Recaps of the quarterly CoachRx community call: what shipped, what coaches asked for, and what is coming next. If you missed the live call, this is the short version.",
  },
  {
    tag: "AMA Challenge",
    slug: "ama-challenge",
    title: "Weekly Coaching Challenges",
    intro:
      "A recurring coaching challenge with a real answer worked through in full. Each one takes a decision coaches make constantly, such as setting tempo by training age or judging food quality against macros, and shows the reasoning rather than just the conclusion.",
  },
];

export const topicByTag = (tag: string) => TOPICS.find((t) => t.tag === tag);
export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug);
