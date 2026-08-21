/**
 * Pricing recovered from the archived Squarespace /pricing page — these are the
 * live published numbers, not estimates. Verified against the page's own markup:
 *   1–5 clients   $29/mo · $25/mo billed annually
 *   6–50 clients  $79/mo · $67/mo billed annually  (marked Most Popular)
 *   51–150        $199/mo · $169/mo billed annually
 *   150+          Enterprise, via support
 *
 * NOTE FOR CARL: that page's JSON-LD said "pricing starts at $24/month" while the
 * tier table said $25 annually. The table is used here. Worth reconciling.
 */
export const PLANS = [
  { band: "1–5 clients", monthly: 29, annual: 25, popular: false },
  { band: "6–50 clients", monthly: 79, annual: 67, popular: true },
  { band: "51–150 clients", monthly: 199, annual: 169, popular: false },
];

export const ENTERPRISE = {
  band: "150+ clients",
  copy: "Enterprise pricing, sorted with our team.",
};

export const TRANSITION = [
  {
    head: "Complete migration",
    body: "We handle the transition for you, so your data, clients, and programs move over intact.",
  },
  {
    head: "One-on-one guidance",
    body: "Work directly with a Coach Success specialist to get your setup right from the start.",
  },
  {
    head: "Support from actual coaches",
    body: "Our support team is made up of real coaches who understand your workflow and your goals.",
  },
];

/** Real testimonials with real attribution, from the archived pricing page. */
export const QUOTES = [
  {
    text: "Just the perfect tool. The virtual coach-client relationship has never been so easy and efficient as with CoachRx.",
    name: "Bruno Miguel Ferreira Rocha",
    role: "Owner, Get.The.Coach.",
  },
  {
    text: "The reminders and check-in automations mean I'm spending less time scheduling things and more time communicating with my clients.",
    name: "Brandon Wilton",
    role: "Owner, CrossFit South Bend",
  },
  {
    text: "I used to have Google docs spread out everywhere from my initial intakes, which was messy, confusing and time consuming. I now have a clean, crisp and systemized process for all clients.",
    name: "Chad Johnson",
    role: "Owner, Chamber Fitness",
  },
];
