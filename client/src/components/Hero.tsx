/**
 * Hero — Pin/parallax cinematic intro.
 * Background zooms and darkens with scroll; headline stays put for stable reading.
 */
import { ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { getSiteImage } from "@/content/siteImages";
import { useMinLg } from "@/hooks/useMinLg";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const desktopLg = useMinLg();
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
      className="relative z-20 isolate w-full max-w-full min-w-0 overflow-x-visible bg-gradient-to-b from-forest-dark via-ink to-ink text-paper min-h-[100svh] max-lg:overflow-y-visible lg:h-[100svh] lg:overflow-y-hidden"
    >
      {/**
       * Mobile: foto com foco na fazenda (object-position), overlays mais claros em baixo; texto maior e junto à base.
       * Desktop: palco 100svh + parallax.
       */}
      <div className="sticky top-0 z-0 min-h-[100svh] overflow-x-visible max-lg:h-auto max-lg:overflow-y-visible lg:h-[100svh] lg:overflow-y-hidden">
        {imageFailed && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,31,147,0.12),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(75,0,79,0.35),transparent_42%),linear-gradient(180deg,#1a0a1c_0%,#110d11_100%)]" />
        )}
        {/* Background image with parallax */}
        {!imageFailed &&
          (desktopLg ? (
            <motion.div
              style={{ scale, y: yImg }}
              className="absolute inset-0 min-h-0 min-w-0 overflow-hidden will-change-transform"
            >
              <img
                src={getSiteImage("hero")}
                alt="Operação e cultivo vertical da Fazendas Up em Manaus, Amazonas"
                className="h-full w-full max-w-full object-cover object-center"
                decoding="async"
                fetchPriority="high"
                onError={() => setImageFailed(true)}
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 min-h-0 min-w-0 overflow-hidden">
              <img
                src={getSiteImage("hero")}
                alt="Operação e cultivo vertical da Fazendas Up em Manaus, Amazonas"
                className="h-full w-full max-w-full object-cover object-center max-lg:object-[52%_72%]"
                decoding="async"
                fetchPriority="high"
                onError={() => setImageFailed(true)}
              />
            </div>
          ))}

        {/* Overlay: só desktop anima com scroll; mobile usa opacidade fixa (sem inline transform no Safari). */}
        {desktopLg ? (
          <motion.div
            style={{ opacity: overlay }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/40 to-ink/95"
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/25 to-ink/55 opacity-100"
            aria-hidden
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent max-lg:from-ink/50 max-lg:via-ink/18 max-lg:to-transparent" />

        {desktopLg && (
          <div className="absolute right-6 top-0 flex h-full items-center gap-6">
            <div className="vertical-text text-[0.65rem] text-on-plum-soft tracking-[0.3em] uppercase">
              Volume I, edição 2026
            </div>
            <div className="h-32 w-px bg-paper/30" />
          </div>
        )}

        <div className="relative container flex h-full min-w-0 flex-col justify-end pt-[calc(4.5rem+env(safe-area-inset-top,0px))] pb-[max(9rem,14svh)] max-lg:pb-[max(10rem,max(env(safe-area-inset-bottom),2rem)+11svh)] lg:pt-24 lg:pb-52">
          <div className="grid min-w-0 grid-cols-1 items-end gap-6 max-lg:gap-7 lg:gap-8 lg:grid-cols-12 [&>*]:min-w-0">
            <div className="col-span-full min-w-0 lg:col-span-9 reveal">
              <p className="eyebrow text-on-plum-strong mb-5 inline-flex max-w-full flex-wrap items-center gap-3 max-lg:mb-6 max-lg:text-[0.82rem] max-lg:tracking-[0.14em] lg:mb-7">
                <span className="h-px w-10 shrink-0 bg-on-plum-strong/55 max-lg:w-11" />
                <span className="min-w-0">Fazendas Up · Manaus, Amazonas</span>
              </p>

              <h1 className="display-head hyphens-none break-normal text-paper max-w-full leading-[1.05] [overflow-wrap:normal] max-lg:text-[clamp(1.92rem,7.4vw+0.5rem,3.45rem)] max-lg:leading-[1.07] lg:text-[clamp(2.6rem,7.2vw,6rem)] lg:leading-none">
                Cultivar alimento na cidade <br className="hidden md:block" />
                para que a{" "}
                <em className="whitespace-nowrap text-brand-rose [overflow-wrap:normal]">floresta</em> siga sendo{" "}
                <span className="whitespace-nowrap [overflow-wrap:normal]">floresta</span>.
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
