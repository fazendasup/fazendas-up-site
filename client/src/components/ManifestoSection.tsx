/**
 * Manifesto / Sobre — Sticky parallax photograph with expanding clip-path,
 * institutional pillars revealed sequentially, and a vertical chapter mark.
 */
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { appendImageCacheBust, getSiteImage } from "@/content/siteImages";
import { cn } from "@/lib/utils";

function manifestoStickyKind(src: string): "aerial" | "farm" {
  const p = src.split("?")[0].toLowerCase();
  if (p.includes("amazonia_aerea") || p.includes("amazon-river")) return "aerial";
  if (p.includes("vertical_farm") || p.includes("manus-storage") || p.includes("img_6915")) {
    return "farm";
  }
  return "aerial";
}

const manifestoImageFallbacks = [
  "/uploads/amazonia_aerea_dark.png",
  "/uploads/amazonia_aerea_dark.webp",
  "/uploads/amazonia_aerea_8k.png",
  "/uploads/amazon-river-4k-jungle-wild-nature-bends-of-river.jpg",
];

const pillars = [
  {
    t: "Missão",
    b: "Garantir segurança alimentar com produtos sustentáveis, inovadores e de alto valor agregado, produzidos com tecnologia e respeito à floresta.",
  },
  {
    t: "Visão",
    b: "Ser referência nacional em agroindústria sustentável de cultivo vertical, articulando ciência, tecnologia e desenvolvimento regional.",
  },
  {
    t: "Valores",
    b: "Excelência operacional, ética e transparência, sustentabilidade, inovação contínua e valorização das pessoas.",
  },
];

export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  const manifestoChain = Array.from(
    new Set([getSiteImage("manifesto"), ...manifestoImageFallbacks.map(appendImageCacheBust)])
  );
  const [manifestoIdx, setManifestoIdx] = useState(0);
  const manifestoSrc = manifestoChain[Math.min(manifestoIdx, manifestoChain.length - 1)] ?? manifestoChain[0];
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  /** Entrada já em escala 1 (sem “caixa” no meio); leve zoom só no fim do pin. */
  const imgScale = useTransform(scrollYProgress, [0, 0.55, 1], [1, 1.03, 1.05]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["4%", "-12%"]);
  const trackY = useTransform(scrollYProgress, [0, 1], ["2%", "-6%"]);
  const [trackImgFailed, setTrackImgFailed] = useState(false);
  const trackSrc = getSiteImage("manifestoTrack");
  const stickyKind = manifestoStickyKind(manifestoSrc);
  const stickyAlt =
    stickyKind === "aerial"
      ? "Vista aérea do Rio Amazonas e da floresta amazônica"
      : "Cultivo vertical e hidroponia na unidade Fazendas Up, Manaus";
  const locationChip = stickyKind === "aerial" ? "Floresta · Manaus / AM" : "Cultivo · Manaus / AM";

  useEffect(() => {
    const primary = getSiteImage("manifesto");
    const track = getSiteImage("manifestoTrack");
    const links: HTMLLinkElement[] = [];
    for (const href of [primary, track]) {
      const l = document.createElement("link");
      l.rel = "preload";
      l.as = "image";
      l.href = href;
      document.head.appendChild(l);
      links.push(l);
    }
    return () => {
      for (const l of links) {
        l.parentNode?.removeChild(l);
      }
    };
  }, []);

  return (
    <section
      id="sobre"
      ref={ref}
      className="relative bg-forest-dark text-paper overflow-x-hidden overflow-y-visible py-28 md:py-40"
    >
      {/* Vertical chapter mark */}
      <div className="hidden lg:block absolute left-6 top-32 vertical-text text-paper/40 text-[0.68rem] tracking-[0.3em] uppercase">
        Capítulo 04: Sobre / Manifesto
      </div>

      <div className="container">
        <div className="grid grid-cols-12 gap-10 mb-20">
          <div className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-2">
            <p className="eyebrow text-paper/65 mb-6 inline-flex max-w-full flex-wrap items-center gap-3">
              <span className="h-px w-9 shrink-0 bg-paper/55" />
              <span className="min-w-0">Sobre a Fazendas Up</span>
            </p>
            <h2 className="display-head max-w-full min-w-0 break-words text-paper text-pretty hyphens-auto leading-[1.08] sm:leading-[1.05] md:leading-none text-[clamp(1.85rem,5.5vw+0.35rem,5.4rem)] md:text-[clamp(2.4rem,6.4vw,5.4rem)]">
              Cultivar <em className="text-brand-rose">no alto</em> é uma forma de proteger o que está embaixo.
            </h2>
          </div>
        </div>
      </div>

      <div className="relative w-screen max-w-[100vw] md:left-1/2 md:-translate-x-1/2">
        <div className="relative h-[160vh] md:h-[170vh] mb-24">
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-forest-dark"
            aria-hidden
          >
            {!trackImgFailed && (
              <>
                <img
                  src={trackSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full min-h-full object-cover object-[50%_48%] opacity-[0.92] brightness-[0.98] contrast-[1.04] md:hidden"
                  decoding="async"
                  loading="eager"
                  onError={() => setTrackImgFailed(true)}
                />
                <motion.img
                  src={trackSrc}
                  alt=""
                  style={{ y: trackY }}
                  className="absolute inset-0 h-full w-full min-h-full object-cover object-[50%_45%] opacity-[0.92] will-change-transform brightness-[0.98] contrast-[1.04] hidden md:block"
                  decoding="async"
                  onError={() => setTrackImgFailed(true)}
                />
              </>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_85%_at_50%_40%,oklch(0.22_0.05_300_/_0.28),transparent_70%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/40 via-forest/20 to-forest-dark" />
          </div>
          <div className="relative z-[1] sticky top-14 h-[78vh] min-h-[560px] overflow-hidden md:top-24 md:h-[min(88vh,920px)] md:min-h-[72vh]">
            <motion.img
              src={manifestoSrc}
              alt={stickyAlt}
              style={{ scale: imgScale, y: imgY }}
              className={cn(
                "absolute inset-0 z-[1] h-[125%] min-h-full w-full object-cover will-change-transform",
                stickyKind === "aerial"
                  ? "object-[48%_36%] brightness-[1.04] contrast-[1.06] saturate-[1.12] [transform-origin:50%_40%]"
                  : "object-center brightness-[1.12] contrast-[1.05] [transform-origin:50%_50%]"
              )}
              decoding="async"
              fetchPriority="high"
              onError={() => {
                setManifestoIdx((i) => {
                  const max = manifestoChain.length - 1;
                  return i < max ? i + 1 : i;
                });
              }}
            />
            <div
              className={cn(
                "absolute inset-0 z-[2] pointer-events-none bg-gradient-to-t to-transparent",
                stickyKind === "aerial"
                  ? "from-forest-dark/80 via-forest-dark/15"
                  : "from-forest-dark/55 via-forest-dark/12"
              )}
            />
            <div className="absolute inset-x-0 bottom-8 z-[3] px-5 md:px-8">
              <div className="container flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <p className="text-paper/85 text-[1.0625rem] leading-[1.65] font-light max-w-2xl">
                Acreditamos que produzir alimento na cidade, com tecnologia,
                eficiência e transparência, é uma das formas mais concretas de
                aliviar a pressão sobre biomas como a Amazônia.
              </p>
              <span className="text-paper/55 text-[0.7rem] uppercase tracking-[0.25em] shrink-0">
                {locationChip}
              </span>
              </div>
            </div>
          </div>

          {/* Foreground copy above sticky stack */}
          <div className="absolute inset-x-0 bottom-0 z-[4] pt-[75vh] md:pt-[82vh] pb-2 pointer-events-none">
            <div className="container">
              <div className="grid grid-cols-12 gap-8 rounded-sm bg-forest-dark/38 backdrop-blur-[1.5px] px-4 py-4 md:bg-transparent md:backdrop-blur-0 md:px-0 md:py-0">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.9 }}
                className="col-span-12 lg:col-span-5 lg:col-start-2 pointer-events-auto"
              >
                <p className="eyebrow text-paper/80 mb-4 inline-flex items-center gap-3">
                  <span className="h-px w-9 bg-paper/70" />
                  Por que cultivar verticalmente
                </p>
                <p className="text-paper text-[1.06rem] leading-[1.8] font-normal">
                  Cada quilo produzido em ambiente urbano e controlado
                  representa uma pequena área de floresta que não precisou ser
                  derrubada. Esse é o nosso cálculo ético antes de qualquer
                  cálculo econômico.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.9, delay: 0.15 }}
                className="col-span-12 lg:col-span-4 lg:col-start-8 pointer-events-auto"
              >
                <ul className="space-y-3 text-paper/92 text-[0.98rem] font-normal">
                  <li className="flex gap-3 border-t border-paper/30 pt-3">
                    <span className="font-display italic text-clay text-[0.95rem] pt-0.5">01</span>
                    <span>Operamos em Manaus, no centro do bioma que protegemos.</span>
                  </li>
                  <li className="flex gap-3 border-t border-paper/30 pt-3">
                    <span className="font-display italic text-clay text-[0.95rem] pt-0.5">02</span>
                    <span>Cada lote tem rastreabilidade da semente à colheita.</span>
                  </li>
                  <li className="flex gap-3 border-t border-paper/30 pt-3">
                    <span className="font-display italic text-clay text-[0.95rem] pt-0.5">03</span>
                    <span>Aliamos técnica agrônoma a engenharia de dados.</span>
                  </li>
                </ul>
              </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Pillars */}
        <div className="grid grid-cols-12 gap-x-10 gap-y-14 lg:px-[5%]">
          {pillars.map((p, i) => (
            <motion.div
              key={p.t}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1], delay: i * 0.12 }}
              className="col-span-12 md:col-span-4 border-t border-paper/20 pt-7"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-display italic text-paper/45 text-[0.95rem]">
                  /0{i + 1}
                </span>
                <span className="size-1.5 rounded-full bg-clay" />
              </div>
              <h3 className="display-head text-paper text-[2.4rem] leading-tight mb-4">
                {p.t}
              </h3>
              <p className="text-paper/70 text-[0.97rem] leading-[1.75] font-light">
                {p.b}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
