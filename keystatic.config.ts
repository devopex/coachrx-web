import { config, fields, collection } from "@keystatic/core";

/**
 * Visual editor at /keystatic. Commits straight to GitHub, so there is no CMS
 * to pay for and no database to keep alive. Kandace never has to see markdown.
 *
 * Local mode writes to the working tree (npm run dev). Switch storage to
 * { kind: "github", repo: "devopex/coachrx-web" } once the GitHub app is installed.
 */
export default config({
  storage: { kind: "local" },
  collections: {
    posts: collection({
      label: "Articles",
      slugField: "title",
      path: "content/posts/*",
      format: { contentField: "body" },
      entryLayout: "content",
      columns: ["title", "primaryTag", "date"],
      schema: {
        title: fields.slug({ name: { label: "Title", validation: { isRequired: true } } }),
        description: fields.text({
          label: "Lede",
          description: "One or two sentences. Shows on cards, in search results and under the headline.",
          multiline: true,
          validation: { isRequired: true, length: { min: 40, max: 200 } },
        }),
        date: fields.date({ label: "Published", validation: { isRequired: true } }),
        updated: fields.date({ label: "Last updated" }),
        author: fields.text({ label: "Author", defaultValue: "CoachRx Team" }),
        primaryTag: fields.select({
          label: "Topic",
          description: "Drives the topic page this article appears on and its related posts.",
          options: [
            { label: "Program Design", value: "Program Design" },
            { label: "Program Design Pro Tip", value: "Program Design Pro Tip" },
            { label: "Frameworks", value: "Frameworks" },
            { label: "Marketing For Fitness Coaches", value: "Marketing For Fitness Coaches" },
            { label: "Feature Highlight", value: "Feature Highlight" },
            { label: "Coach Spotlight", value: "Coach Spotlight" },
            { label: "Case Study", value: "Case Study" },
            { label: "Community Call", value: "Community Call" },
            { label: "AMA Challenge", value: "AMA Challenge" },
            { label: "Press", value: "Press" },
          ],
          defaultValue: "Program Design",
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Additional tags", itemLabel: (p) => p.value ?? "",
        }),
        featuredImage: fields.text({ label: "Featured image path", description: "e.g. /images/featured/name.webp" }),
        featuredImageAlt: fields.text({ label: "Featured image alt text" }),
        readingTime: fields.integer({ label: "Reading time (min)" }),
        wordCount: fields.integer({ label: "Word count" }),
        draft: fields.checkbox({ label: "Draft", defaultValue: false }),
        legacyUrl: fields.text({ label: "Legacy URL", description: "Original Squarespace path. Do not edit." }),
        body: fields.mdx({ label: "Body" }),
      },
    }),
  },
});
