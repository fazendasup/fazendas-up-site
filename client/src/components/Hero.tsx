/**
 * Hero — Pin/parallax cinematic intro.
 * Background zooms and darkens with scroll; headline stays put for stable reading.
 */
import { ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { getSiteImage } from "@/content/siteImages";
import { useMinLg } from "@/hooks/useMinLg";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const desktopLg = useMinLg();
  /** Parallax só viewport estreito (hook); trilhos só montam em lg+ (fora do DOM no telefone). */
  const narrow = useNarrowViewport();
  const [imageFailed, setImageFailed] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const yImg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlay = useTransform(scrollYProgress, [0, 1], [0.35, 0.85]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative z-20 isolate w-full max-w-full min-w-0 overflow-x-hidden overflow-x-clip overflow-y-hidden bg-gradient-to-b from-forest-dark via-ink to-ink text-paper"
      style={{ height: "100svh" }}
    >
      {/* Sticky stage — same height as section so no ink gradient shows between image and wave */}
      <div className="sticky top-0 z-0 h-[100svh] overflow-x-hidden overflow-y-hidden">
        {imageFailed && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,31,147,0.12),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(75,0,79,0.35),transparent_42%),linear-gradient(180deg,#1a0a1c_0%,#110d11_100%)]" />
        )}
        {/* Background image with parallax */}
        {!imageFailed && (
          <motion.div
            style={{
              scale: narrow ? 1 : scale,
              y: narrow ? "0%" : yImg,
            }}
            className="absolute inset-0 min-h-0 min-w-0 overflow-hidden will-change-transform"
          >
            <img
              src={getSiteImage("hero")}
              alt="Operação e cultivo vertical da Fazendas Up em Manaus, Amazonas"
              className="h-full w-full max-w-none object-cover object-center"
              decoding="async"
              fetchPriority="high"
              onError={() => setImageFailed(true)}
            />
          </motion.div>
        )}

        {/* Animated overlay */}
        <motion.div
          style={{ opacity: overlay }}
          className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/40 to-ink/95 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent pointer-events-none" />

        {desktopLg && (
          <div className="absolute right-6 top-0 flex h-full items-center gap-6">
            <div className="vertical-text text-[0.65rem] text-on-plum-soft tracking-[0.3em] uppercase">
              Volume I, edição 2026
            </div>
            <div className="h-32 w-px bg-paper/30" />
          </div>
        )}

        <div className="relative container flex h-full min-w-0 flex-col justify-end pt-24 pb-[max(10.5rem,15svh)] md:pb-[max(12rem,16svh)] lg:pb-52">
          <div className="grid min-w-0 grid-cols-12 items-end gap-8 [&>*]:min-w-0">
            <div className="col-span-12 min-w-0 lg:col-span-9 reveal">
              <p className="eyebrow text-on-plum-strong mb-7 inline-flex max-w-full flex-wrap items-center gap-3">
                <span className="h-px w-10 shrink-0 bg-on-plum-strong/55" />
                <span className="min-w-0">Fazendas Up · Manaus, Amazonas</span>
              </p>

              <h1 className="display-head hyphens-none text-paper max-w-full text-[clamp(1.65rem,5.5vw+0.35rem,6rem)] leading-[1.06] sm:leading-[1.04] md:leading-none md:text-[clamp(2.6rem,7.2vw,6rem)] lg:max-w-5xl">
                Cultivar alimento na cidade <br className="hidden md:block" />
                para que a <em className="text-brand-rose">floresta</em> siga sendo floresta.
              </h1>
            </div>

            {desktopLg && (
              <div className="col-span-3 flex justify-end items-end gap-2 text-on-plum-soft text-[0.78rem] leading-snug max-w-[18rem] pb-1">
                <ArrowDown className="size-3.5 mt-0.5 shrink-0 animate-bounce" />
                <span>
                  Continue rolando: a fazenda se revela à medida que você desce.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Curved seam at section end (outside sticky) so it stays aligned with Prólogo below */}
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[30] w-full h-[44px] md:h-[64px] drop-shadow-[0_-1px_0_oklch(0.18_0.015_85_/_0.06)]"
      >
        <path
          d="M0,80 L0,40 Q360,-10 720,40 T1440,40 L1440,80 Z"
          fill="var(--paper)"
        />
      </svg>
    </section>
  );
}
