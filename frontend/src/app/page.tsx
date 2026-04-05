import { LandingNav } from "@/components/marketing/LandingNav";
import { LandingHero } from "@/components/marketing/LandingHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { LandingCTA } from "@/components/marketing/LandingCTA";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <HowItWorks />
        <FeatureGrid />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
