import redirects from "./src/data/redirects.json" with { type: "json" };

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  images: { unoptimized: true }, // images are pre-sized WebP in /public, no runtime work needed
  async redirects() {
    // 265 rules: every URL retired in the Squarespace migration. See
    // site-migration/redirect-map.csv for why each one points where it does.
    return redirects;
  },
};
