/**
 * Features page copy, transcribed from the CoachRx Features Claude Design file.
 *
 * This is the product's marketing claims, so treat it as reviewed copy: change it
 * with Carl, not on a whim. Where the design showed an invented product mockup, the
 * page uses a real screenshot from the migration archive instead — see PILLARS[].shot.
 */

export type FeatureBlock = { title: string; body: string };

export type Pillar = {
  n: string;
  id: string;
  label: string;
  navLine: string;
  headline: [string, string];
  lede: string;
  blocks: FeatureBlock[];
  quote?: { text: string; who: string };
  shot?: { src: string; alt: string };
};

export const HERO = {
  overline: "Features",
  headline: ["One system", "for the way you actually coach."] as [string, string],
  lede:
    "Assess, consult, design, operate, and deliver. Every part of your practice in one place, so nothing gets missed and nothing slows you down.",
  fine:
    "Full access, free for 14 days. No credit card required. Free onboarding and transition support included.",
  proof:
    "10,000+ coaching practices · Every feature included from day one · Free transition support",
};

export const SYSTEM = {
  overline: "04 · The system",
  headline: ["Coaching isn't five jobs.", "It shouldn't be five tools."] as [string, string],
  body: [
    "Most coaches run a practice across a programming app, a spreadsheet, a messaging thread, a payment processor, and a notes doc. The work still gets done. The context is what gets lost.",
    "In CoachRx, what you learn in an assessment is there when you design. What a client logs is there before your next conversation. One system, so every decision has the full picture behind it.",
  ],
};

export const PILLARS: Pillar[] = [
  {
    n: "05",
    id: "assess",
    label: "Assess",
    navLine: "Know where every client actually stands.",
    headline: ["Stop guessing.", "Start knowing."],
    lede:
      "Good coaching decisions need good information. Movement capacity, performance markers, wearable data, and lifestyle behavior in one profile means you are never making the call on a hunch.",
    blocks: [
      {
        title: "Track the markers your method depends on.",
        body:
          "Body, Move, Work and structural balance analysis are built in and ready to run. On top of them you build your own metric sets: choose the markers you track, group them the way you think about a client, and score every result against the targets you set. Everything is plotted over time, so progress is a trend and not a memory.",
      },
      {
        title: "The 23 hours you were never in the room for.",
        body:
          "Sleep, HRV, recovery, daily activity, and nutrition sync in from seven wearable platforms and five nutrition apps, including Apple Health, WHOOP, Oura, Garmin, Cronometer, and MyFitnessPal. You see how recovery is actually tracking before you write the next block.",
      },
      {
        title: "See the drift before it becomes a drop-off.",
        body:
          "Completion rates, check-in consistency, and habit adherence roll up per client and across the roster, so a quiet month shows up as a number instead of a feeling. Client priorities and goals stay pinned to the profile, so an old injury or a hard season never gets lost between programs.",
      },
    ],
    quote: {
      text:
        "My in-person and remote clients love the app and the communication we have both in and out of the gym. CoachRx streamlines my coaching workflow, helping me make data driven program design decisions, and consistently communicate with all of my clients.",
      who: "Coach Austin Kapetanakis · Director, Hudson River Athletics",
    },
    shot: { src: "/images/product/assess-wearables.webp", alt: "Wearable and health data in a client profile" },
  },
  {
    n: "06",
    id: "consult",
    label: "Consult",
    navLine: "Stay close between every session.",
    headline: ["Be there", "before they ask."],
    lede:
      "Great coaches don't wait for a client to flag a problem. When check-ins, messages, and consultation notes live in the same place as the program, you catch the small things while they are still small.",
    blocks: [
      {
        title: "Text is the least of what you can send.",
        body:
          "Loom video, voice notes, and threaded messages all sit inside the client's file, with several conversations open at once when you are working through the roster. Show a correction instead of describing it. Let a client hear your tone on a hard week. Every conversation stays connected to the work it is about.",
      },
      {
        title: "Check in before they check out.",
        body:
          "Set the cadence and the questions once, and every client is prompted to report how the week actually went. Answers land next to their compliance and trend data, so you read the response with the context already in front of you.",
      },
      {
        title: "The habit that protects retention.",
        body:
          "Set a communication goal for your organization, for a coach, or for a single client, and CoachRx counts every comment, message, and consultation against it. Each client carries a simple weekly status: reached, or not yet. It resets Monday, so the clients you have not spoken to surface while there is still week left to fix it.",
      },
    ],
    quote: {
      text:
        "Just the perfect tool. It can hold all the information a coach needs, and I'm not only talking about the programming, time management and consultations. I'm talking about personal client data, nutrition and actual lifestyle coaching. The virtual coach-client relationship has never been so easy and efficient as with CoachRx.",
      who: "CoachRx coach",
    },
    shot: { src: "/images/product/consult-messages.webp", alt: "Scheduled messages inside a client file" },
  },
  {
    n: "07",
    id: "design",
    label: "Design",
    navLine: "Build programs worth a client's trust.",
    headline: ["Design better.", "Deliver better."],
    lede:
      "Your clients don't all need the same thing, and efficiency shouldn't cost you personalization. Full control over every variable, with the structures you have already built ready to reuse.",
    blocks: [
      {
        title: "Program the whole person on one screen.",
        body:
          "Sets, reps, tempo, and rest sit alongside daily nutrition targets and lifestyle prescriptions in a single calendar. Drag, copy, and adjust across weeks without switching tools. The client sees one plan, not three.",
      },
      {
        title: "Coach the next six months, not just next week.",
        body:
          "Plan macro, meso, and micro cycles in one view, with phases, deloads, testing, and re-assessment placed before you write a single session. The long arc stays visible while you work in the detail, so week eleven still makes sense alongside week one.",
      },
      {
        title: "3,000+ movements. 70+ OPEX programs. Plus everything you build.",
        body:
          "Every movement in the CoachRx Index carries a demo video, so clients always know exactly what they're doing. Add your own to your Coach Exercise Library, save your warm-ups, cool-downs, and conditioning pieces as reusable templates, and adapt them to each person, so every program still feels like it was built for them. Because it was.",
      },
    ],
    quote: {
      text:
        "We are able to offer not only world-class individual design through CoachRx, but also world-class programs. CoachRx gave us the ability to develop a way of designing our programs and distributing them to our users while retaining all of the functions we wanted from the offset.",
      who: "CoachRx coach",
    },
    shot: { src: "/images/product/design-calendar.webp", alt: "Training and lifestyle prescriptions in one calendar" },
  },
  {
    n: "08",
    id: "operate",
    label: "Operate",
    navLine: "Run the practice without the drag.",
    headline: ["Admin", "shouldn't get in the way."],
    lede:
      "The smoother the practice runs, the more of you is left for coaching. Billing, roster, team, and reporting in one place, so the business side stops taking the hours the coaching side needs.",
    blocks: [
      {
        title: "Get paid without chasing it.",
        body:
          "Recurring subscriptions, packages, payment plans, and one-off invoices all run through Stripe, in your currency. Failed payments are recovered and receipts go out without you touching it. Qualified clients can even pay with HSA or FSA funds through TrueMed, which makes the yes easier to get.",
      },
      {
        title: "Clear roles. No confusion.",
        body:
          "Give every coach the access their role needs and nothing more. Client assignments, coach-level reporting, and payroll and commission tracking keep a growing team working to one standard instead of five interpretations of it.",
      },
      {
        title: "Know which client needs you today.",
        body:
          "Revenue, client counts, and the indicators that tell you how the practice is actually running, all in one place. A Needs Attention list surfaces missed sessions, dropping compliance, overdue consultations, and declined payments, so retention work stops being reactive.",
      },
    ],
    quote: {
      text:
        "CoachRx has improved my business drastically by streamlining operations. Not to mention, it's cut down on my expenses as the subscription is more affordable than TrueCoach. The app has made both front and back of house more robust without added complexity.",
      who: "CoachRx coach",
    },
    shot: { src: "/images/product/operate-dashboard.webp", alt: "Practice dashboard with revenue and client counts" },
  },
  {
    n: "09",
    id: "client-experience",
    label: "Client Experience",
    navLine: "The app your clients open every day.",
    headline: ["One app. Both sides.", "Every day."],
    lede:
      "What happens between sessions decides whether a client stays. Coaches and clients use the same CoachRx app, each seeing the interface built for them, so there is no second download to explain and no client app lagging a version behind the coach tool. Your client opens it, sees exactly what today asks of them, and knows you are on the other side of it.",
    blocks: [
      {
        title: "Everything today asks of them, with nothing to hunt for.",
        body:
          "Training, lifestyle tasks, and your notes for the day, with a demo video on every movement. Clients log results and rate their effort as they go, so you know how the session went without having to ask.",
      },
      {
        title: "Coaching that doesn't stop at the gym door.",
        body:
          "Clients see the same care applied to sleep, nutrition, and daily behavior as they do to training. Wearables, Apple Health, Google Health Connect, and nutrition apps connect once and log quietly in the background, so the data arrives without the nagging.",
      },
      {
        title: "Proof is the best retention tool there is.",
        body:
          "Completed sessions, active streaks, performance metrics, progress photos, and the goals you set together, visible every time they open the app. They see how far they've come. So do you.",
      },
    ],
    quote: {
      text:
        "CoachRx allows me to deliver my group program design efficiently from the back end, and on the front end my clients get an amazing app experience. It allows for better results and retention due to the ability to have conversations with each client and tweak their program design.",
      who: "Coach Brandon Wilton · Owner, CrossFit South Bend",
    },
    shot: { src: "/images/product/clientx-app.webp", alt: "The CoachRx client app showing the day's work" },
  },
];

export const LOOP = {
  overline: "10 · One system",
  headline: ["One system.", "No gaps."] as [string, string],
  lede: "Any platform can list features. The difference is what happens between them.",
  steps: [
    "An assessment flags a limitation. It follows the client into program design.",
    "The program lands in their app as today's work, with your notes attached.",
    "What they log, and what their wearable reports, becomes the trend you read next week.",
    "Their check-in answer sits beside that trend, so the conversation starts with context.",
    "Payments, renewals, and flags run underneath all of it without asking for your attention.",
  ],
  kicker: "That's the difference between a platform and a system.",
};

export const INCLUDED = {
  overline: "11 · Included",
  headline: "Every Feature, Day One.",
  lede:
    "Every feature on this page is included on every plan. Pricing scales with the size of your roster, not with what you're allowed to use.",
  groups: [
    {
      head: "Wearables and health",
      items: ["Apple Health", "Google Health Connect", "WHOOP", "Oura", "Garmin", "Polar", "Fitbit"],
      note: "Smart scales sync through Apple Health, Health Connect, or Fitbit",
    },
    {
      head: "Nutrition",
      items: ["Cronometer", "MyFitnessPal", "FatSecret", "MacrosFirst", "MyMacros+"],
    },
    {
      head: "Business and platform",
      items: [
        "Stripe, with multi-currency support",
        "TrueMed, HSA and FSA payments",
        "Fullscript dispensary",
        "Loom",
        "Consult booking links",
        "iOS · Android · Web",
        "Real-time sync across devices",
      ],
    },
  ],
};

export const COMPARISON = {
  overline: "12 · The difference",
  headline: ["Built for coaching,", "not for workout delivery."] as [string, string],
  lede:
    "Most coaching platforms were built to send workouts and take payments. That's a fine job. It just isn't the whole job.",
  colThem: "Most coaching software",
  colUs: "CoachRx",
  rows: [
    ["Assessment", "Basic metrics", "Custom metric sets, structural balance, Body, Move, Work"],
    ["Nutrition and lifestyle", "A separate app", "Prescribed and tracked in the same calendar as training"],
    ["Connected data", "Limited or none", "Seven wearable platforms and five nutrition apps"],
    ["Long-term planning", "Templates", "Macro, meso, and micro cycle planning"],
    ["Group delivery", "One template, sent out", "Standard programs on each client's timeline, or live programs the whole group follows together"],
    ["Relationship measurement", "Not measured", "Communication goals tracked per client, every week"],
    ["The app", "A client app, plus a separate coach tool", "One app, one login, coach and client"],
    ["Client autonomy", "All or nothing", "Set per client, per permission"],
    ["Paying for coaching", "Card only", "Card, or HSA and FSA funds through TrueMed"],
    ["Feature access", "Gated by plan tier", "Everything included, day one"],
    ["Support", "A ticket queue", "Practicing coaches who use the platform daily"],
    ["Built on", "A software roadmap", "A coaching philosophy in practice since 1999"],
  ] as [string, string, string][],
};

export const SWITCH = {
  overline: "13 · Make the switch",
  headline: ["The easiest move", "you'll ever make."] as [string, string],
  cards: [
    "Switching from another platform? We handle the transition for you, so your data, clients, and programs move over intact.",
    "Work directly with a Coach Success specialist to get your setup right from the start.",
    "Our support team is made up of real coaches who understand your workflow and your goals.",
  ],
};

export const FAQ = {
  overline: "14 · FAQ",
  headline: "Questions coaches ask before they start.",
  items: [
    {
      q: "Do I have to use all of it?",
      a: "No. Most coaches start with program design and the client app, then bring in assessments, lifestyle, and the business tools as they need them. Everything is available from day one, but nothing is mandatory.",
    },
    {
      q: "Can I bring my own programs and movements?",
      a: "Yes. Upload your own movement videos into your Coach Exercise Library, save your program structures for reuse, and keep your warm-ups, cool-downs, and conditioning pieces as templates. The OPEX libraries are there when you want a starting point, not a requirement.",
    },
    {
      q: "What does it cost?",
      a: "Pricing scales with the number of clients you manage, and every plan includes every feature. See plans and pricing for the current bands.",
    },
    {
      q: "Will this make my coaching feel systematic?",
      a: "The opposite. CoachRx handles the mechanics, billing, tracking, and surfacing what needs your attention, so that more of your week goes into the conversations only you can have.",
    },
    {
      q: "Do my clients need a separate app?",
      a: "No. Coaches and clients use the same app, with the experience each of them needs. One download, one login.",
    },
    {
      q: "Can I import from another platform?",
      a: "Yes. Bring your whole roster over with one upload, or let our transition team handle the migration for you. There's no charge for it.",
    },
    {
      q: "What if it doesn't work out?",
      a: "Your data is yours. You can export your clients, workouts, and reporting at any time, and if you need a break rather than an exit you can pause your subscription instead of cancelling it.",
    },
  ],
};

export const FINALE = {
  headline: ["Deliver the coaching", "you're capable of."] as [string, string],
  lede: "Try CoachRx free and see what changes when every part of your practice is in the same place.",
};
