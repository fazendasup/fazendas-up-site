/**
 * Design: "Editorial Sofisticado — Cinematic Scroll"
 * Home — narrative as a magazine: chapters integrate with each other
 * through pin/parallax/clip transitions and editorial bridges.
 */
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Bridge } from "@/components/Bridge";
import { TechnologySection } from "@/components/TechnologySection";
import { ImpactSection } from "@/components/ImpactSection";
import { CultivosSection } from "@/components/CultivosSection";
import { ForChefsSection } from "@/components/ForChefsSection";
import { ManifestoSection } from "@/components/ManifestoSection";
import { ContactFooter } from "@/components/ContactFooter";
import { ScrollProgress } from "@/components/ScrollProgress";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full max-w-full min-w-0 overflow-x-hidden overflow-x-clip bg-paper text-ink">
      <SiteHeader />
      <div className="copy-flow min-w-0 w-full max-w-full overflow-x-hidden">
        <ScrollProgress />
        <main className="min-w-0 max-w-full touch-pan-y overflow-x-clip">
          <Hero />
          <div className="relative">
            <Bridge />
          </div>
          <TechnologySection />
          <ImpactSection />
          <CultivosSection />
          <ForChefsSection />
          <ManifestoSection />
        </main>
        <ContactFooter />
      </div>
    </div>
  );
}
