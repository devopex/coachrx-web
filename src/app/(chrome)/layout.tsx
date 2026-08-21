import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Chrome for pages that are not yet exact ports of a Claude Design file.
 * The design pages (`/`, `/features`) carry their own nav and footer, so they live
 * outside this group to avoid rendering two of each.
 */
export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  );
}
