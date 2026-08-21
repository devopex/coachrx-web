import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.coachrx.app"),
  title: { default: "CoachRx", template: "%s | CoachRx" },
  description: "Coaching software for coaches who design for one person at a time.",
  openGraph: { siteName: "CoachRx", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
