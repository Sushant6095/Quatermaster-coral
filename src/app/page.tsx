import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingAudits } from "@/components/landing/LandingAudits";
import { LandingFederation } from "@/components/landing/LandingFederation";
import { LandingDifferentiators } from "@/components/landing/LandingDifferentiators";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

/** SoftwareApplication structured data for rich search results. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <script
        type="application/ld+json"
        // Static, app-authored object — no user input to sanitize.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingHero />
      <LandingStats />
      <LandingAudits />
      <LandingFederation />
      <LandingDifferentiators />
      <LandingCTA />
    </main>
  );
}
