import type { Config } from "tailwindcss";

// Tokens are the CoachRx Home v7 design system. Do not invent new values here —
// if a design needs a colour that is not in this list, the design is off-system.
export default {
  content: ["./src/**/*.{ts,tsx,mdx}", "./content/**/*.mdx"],
  theme: {
    extend: {
      colors: {
        base: "#0A0B0F",        // page background
        band: "#0C0E14",        // lifted band / alternating section
        deep: "#0B0E19",        // deep blue band
        card: "#101118",        // card surface (low)
        "card-hi": "#14151A",   // card surface (high / hover)
        hairline: "rgba(255,255,255,0.08)",
        ink: "#F8FCFF",         // text primary
        accent: "#58FF7A",      // CTAs and active states ONLY. Never headlines.
      },
      textColor: {
        secondary: "rgba(255,255,255,0.65)",
        tertiary: "rgba(255,255,255,0.50)",
        body: "rgba(255,255,255,0.82)",
      },
      // Must match --font-sans / --font-mono in public/design/_ds/colors_and_type.css.
      // Tailwind's preflight sets `html, :host { font-family: <sans> }` and body carries
      // .font-sans, so a stale value here leaves every element the design CSS does not reach
      // rendering in a font that no longer exists on the server. That is what happened on
      // 2026-09-06: the design system moved to Mona Sans, this file still said Geist, the Geist
      // files were deleted, and body fell through to the OS default. Enforced by check-fonts.mjs.
      fontFamily: {
        sans: ["Mona Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: { prose: "680px", shell: "1200px" },
      transitionTimingFunction: { crx: "cubic-bezier(.22,1,.36,1)" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" },
                "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { rise: "rise .7s cubic-bezier(.22,1,.36,1) both" },
    },
  },
  plugins: [],
} satisfies Config;
