import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.coachrx.app"),
  title: { default: "CoachRx", template: "%s | CoachRx" },
  description: "Coaching software for coaches who design for one person at a time.",
  openGraph: { siteName: "CoachRx", type: "website" },
  robots: { index: true, follow: true },
};

/**
 * Deliberately bare. Site chrome lives in the `(chrome)` route group, because the
 * exact-ported design pages bring their own nav and footer.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
         * The design-system stylesheet. This carries the 9 Geist @font-face rules and the
         * --font-sans / --font-mono tokens.
         *
         * The .dc.html files link it themselves inside <helmet>, but the compiler lifts only
         * <helmet style> and then drops the rest of the helmet, so the <link> never survived.
         * Result: Geist was never loaded and every one of the ~400 `var(--font-sans)` and
         * `var(--font-mono)` references across the ported pages resolved to nothing, so every
         * page fell back to the browser default face. Wrong typeface means wrong metrics,
         * which means wrong wrapping and shifted layout everywhere — the reason the live
         * pages did not match Claude Design.
         *
         * Loaded here rather than re-added to each compiled page so the browser fetches and
         * caches it once for the whole site.
         */}
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="stylesheet" href="/design/_ds/colors_and_type.css" />
      </head>
      <body className="bg-base font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
