/**
 * Home page copy, transcribed from the CoachRx Home v7 Claude Design file.
 * v7 is the visual source of truth for the whole site — if this and a design file
 * disagree, the design file wins.
 *
 * NOTE FOR CARL: Home says "8,000+ coaching practices", the Features page says
 * "10,000+". One of them is stale. Both are left exactly as designed rather than
 * silently reconciled.
 */

export const HERO = {
  badge: { label: "What's new", text: "Google & Apple sign-in, new billing experience, and more" },
  headline: ["Deliver the coaching", "you're capable of."] as [string, string],
  lede:
    "Individualized programs, real visibility into every client, and a relationship that doesn't drop off between sessions, all in one system.",
  fine: "Full access, free for 14 days. Onboarding + transition assistance.",
};

export const WORKS_WITH = ["Strava", "Cronometer", "MyFitnessPal", "Loom", "FullScript"];

export const PROOF_BAR = "Powering 8,000+ coaching practices";

export const PROBLEM = {
  overline: "01 · The problem",
  headline: ["Great coaching has always been about", "the person in front of you."] as [string, string],
  body: [
    "Since 1999, we've built our coaching philosophy on that idea. We know long-term results come from genuine relationships, individual design, and truly serving the people you coach.",
    "But scattered tools, missed touchpoints, and limited visibility make it harder than it should be.",
  ],
  /** The scattered-tools fragments from the design, which resolve into "One system". */
  fragments: [
    { kind: "Spreadsheet", line: "programs_v7_FINAL.xlsx" },
    { kind: "Texts · 3 unread", line: "Can we reschedule?" },
    { kind: "Invoice #241 · Outstanding", line: "$2,500.00" },
    { kind: "Task · Due Friday · Sasha Barkley", line: "Rebuild next cycle - focusing on motor control" },
  ],
  resolve: "One system",
};

export type Tab = { num: string; title: string; desc: string; chips: string[]; shot?: string };

export const PLATFORM = {
  overline: "02 · The platform",
  headline: "One system for the way you actually coach.",
  lede: "Five connected categories cover everything a professional coaching practice needs.",
  tabs: [
    {
      num: "01",
      title: "Assess",
      desc:
        "Stop guessing. Start knowing. Movement, performance, lifestyle, and nutrition assessments build a complete picture of every client before you write a single session.",
      chips: ["Assessment builder", "Client metrics", "Intake forms", "Historical trends"],
      shot: "/images/product/assess-wearables.webp",
      href: "/features#assess",
    },
    {
      num: "02",
      title: "Consult",
      desc:
        "Be there before they ask. Structured check-ins, progress reviews, and built-in messaging keep you close to every client between sessions.",
      chips: ["Direct messaging", "Loom video", "Structured check-ins", "Progress reviews"],
      shot: "/images/product/consult-messages.webp",
      href: "/features#consult",
    },
    {
      num: "03",
      title: "Design",
      desc:
        "Great progress starts here. Build individualized programs across exercise, lifestyle, and nutrition in one calendar, from a library of 3,000+ movements.",
      chips: ["Program calendar", "Exercise library", "Reusable templates", "Progression planning"],
      shot: "/images/product/design-calendar.webp",
      href: "/features#design",
    },
    {
      num: "04",
      title: "Operate",
      desc:
        "Keep your business moving. Payments, invoicing, client management, and team roles in the same system you coach from.",
      chips: ["Payments and invoicing", "Client management", "Team roles", "Business reporting"],
      shot: "/images/product/operate-dashboard.webp",
      href: "/features#operate",
    },
    {
      num: "05",
      title: "Client Experience",
      desc:
        "The app your clients open every day. A clean, branded mobile experience for workouts, lifestyle, check-ins, and messages that keeps them connected to you.",
      chips: ["Client mobile app", "Workout tracking", "Lifestyle logging", "Client education"],
      shot: "/images/product/clientx-app.webp",
      href: "/features#client-experience",
    },
  ],
};

export const PANELS = [
  {
    overline: "03 · Complete Coaching",
    headline: "Coach the whole person, not just the workout.",
    body:
      "Exercise, lifestyle, and nutrition prescriptions live in the same design calendar. Program sleep habits next to squats. This is coaching beyond the gym, in one place.",
    shot: "/images/product/design-calendar.webp",
    alt: "Training, lifestyle and nutrition in one calendar",
  },
  {
    overline: "04 · Coaching Intelligence",
    headline: "Your coaching intelligence tool.",
    body:
      "Wearable data, trends, and insights across your whole client base. See what is actually driving results and act before problems become plateaus.",
    shot: "/images/product/assess-wearables.webp",
    alt: "Wearable trends across a client roster",
  },
  {
    overline: "05 · Custom Theming",
    headline: "Your brand in your clients' pocket.",
    body:
      "Custom Theming comes with every CoachRx account. Set your brand color, typography, logo, splash screen, and even the quotes your clients see. Your clients open an app that feels like yours, not third-party software.",
    shot: "/images/product/clientx-app.webp",
    alt: "The branded CoachRx client app",
  },
];

export const WHO = {
  overline: "06 · Who it's for",
  cards: [
    { head: "Solo coaches", body: "Run a premium one-person practice without the admin weight." },
    { head: "Coaching teams", body: "Keep every coach aligned to one standard as you grow." },
    { head: "Large organizations", body: "Scale delivery without diluting it. Oversight without micromanaging." },
  ],
  footer:
    "Personal trainers, gym owners, physical therapists, nutrition and lifestyle coaches, remote and hybrid practices. If you coach people seriously, CoachRx is built for you.",
};

export const TESTIMONIALS = [
  {
    text:
      "CoachRx allows me to deliver my group program design efficiently from the back end, and on the front end my clients get an amazing app experience. It allows for better results and retention due to the ability to have conversations with each client and tweak their program design.",
    name: "Brandon Wilton",
    role: "Owner, CrossFit South Bend",
    init: "BW",
  },
  {
    text:
      "Whether it's custom rehab plans or their performance programs, the use of CoachRx has allowed me to get more out of my athletes and coach athletes all over the world.",
    name: "Dr. Austin Schoen",
    role: "Owner, Warrior Sports Wellness",
    init: "AS",
  },
  {
    text:
      "CoachRx has improved my business drastically by streamlining operations. Not to mention, it's cut down on my expenses. The app has made both front and back of house more robust without added complexity.",
    name: "Kyle Krancher",
    role: "Owner, Train & Able",
    init: "KK",
  },
  {
    text:
      "We are able to offer not only world-class individual design through CoachRx, but also world-class programs. CoachRx gave us the ability to develop a seamless way of designing our programs and distributing them to our users.",
    name: "Sam Smith",
    role: "Owner, Proof3 Coaching",
    init: "SS",
  },
];

export const PROOF = { overline: "07 · Proof", headline: "Trusted by coaches who don't cut corners." };

export const SHIPPING = {
  body:
    "We ship every week. New features, refinements, and fixes, driven by the coaches who use CoachRx every day.",
  latest: "Google and Apple sign-in, new billing experience",
};

export const MIGRATION = {
  overline: "08 · Migration",
  headline: "Switch without stress.",
  lede:
    "Moving from another platform? We offer complimentary transition assistance, so nothing gets left behind.",
  steps: [
    "Tell us where you're coming from, and we'll connect you with a specialist.",
    "We handle the migration: programs, client data, and workflows move over without disrupting your coaching.",
    "Pick up where you left off: everything is waiting for you, you just log in.",
  ],
};

export const PRICING = {
  overline: "09 · Pricing",
  headline: "Simple pricing that scales with you.",
  lede: "You only pay more when your practice genuinely grows. Every plan includes the complete platform.",
  blurbs: [
    "Everything you need to start a premium practice.",
    "The full platform for a growing client roster.",
    "Built for teams and high-volume practices.",
  ],
  fine: "Full access, free for 14 days. Onboarding + transition assistance.",
  enterprise: "More than 150 clients? Contact us for Enterprise pricing.",
};

export const FINALE = {
  headline: "Take the next step for your practice.",
  lede:
    "Try CoachRx free and see how every part of your coaching practice works better when it's all connected.",
  fine: "Full access, free for 14 days. Onboarding + transition assistance.",
};
