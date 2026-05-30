import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingAudits } from "@/components/landing/LandingAudits";
import { LandingFederation } from "@/components/landing/LandingFederation";
import { LandingDifferentiators } from "@/components/landing/LandingDifferentiators";
import { LandingCTA } from "@/components/landing/LandingCTA";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <LandingHero />
      <LandingStats />
      <LandingAudits />
      <LandingFederation />
      <LandingDifferentiators />
      <LandingCTA />
    </main>
  );
}
