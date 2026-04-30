/**
 * Manifesto / Sobre — Hero full-bleed: Amazónia e torres em coluna (sem sobreposição);
 * texto editorial no `.container`; pilares abaixo.
 */
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { appendImageCacheBust, getSiteImage } from "@/content/siteImages";
import { useMinLg } from "@/hooks/useMinLg";
import { motionEnterFromBelow } from "@/lib/motionEntrance";
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

/** Pista “torres” por baixo da Amazónia: vários ficheiros por si o deploy não tiver o principal. */
const manifestoTrackFallbacks = [
  "/uploads/IMG_6915.jpg",
  "/uploads/DSC_9912.jpg",
  "/uploads/IMG_0073.jpg",
  "/uploads/DSC_0229.jpg",
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
  const desktopLg = useMinLg();
  const manifestoChain = Array.from(
    new Set([getSiteImage("manifesto"), ...manifestoImageFallbacks.map(appendImageCacheBust)])
  );
  const [manifestoIdx, setManifestoIdx] = useState(0);
  const manifestoSrc = manifestoChain[Math.min(manifestoIdx, manifestoChain.length - 1)] ?? manifestoChain[0];
  /** Índice na cadeia de URLs do track; ao esgotar, a camada some (sem boolean “morto” cedo). */
  const trackChain = useMemo(
    () =>
      Array.from(
        new Set([
          getSiteImage("manifestoTrack"),
          ...manifestoTrackFallbacks.map(appendImageCacheBust),
        ])
      ),
    []
  );
  const [trackTry, setTrackTry] = useState(0);
  const showTrackLayer = trackTry < trackChain.length;
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
      className="relative isolate scroll-mt-20 w-full max-w-full min-w-0 overflow-x-visible overflow-y-visible bg-forest-dark py-28 text-paper md:scroll-mt-24 md:py-40"
    >
      {/* Vertical chapter mark */}
      {desktopLg && (
        <div className="absolute left-6 top-32 vertical-text text-paper/40 text-[0.68rem] tracking-[0.3em] uppercase">
          Capítulo 04: Sobre / Manifesto
        </div>
      )}

      <div className="container min-w-0">
        <div className="mb-20 grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-12 [&>*]:min-w-0">
          <div className="col-span-full min-w-0 lg:col-span-7 lg:col-start-2">
            <p className="eyebrow text-paper/65 mb-6 inline-flex max-w-full flex-wrap items-center gap-3">
              <span className="h-px w-9 shrink-0 bg-paper/55" />
              <span className="min-w-0">Sobre a Fazendas Up</span>
            </p>
            <h2 className="display-head w-full min-w-0 max-w-full hyphens-auto text-paper leading-[1.08] sm:leading-[1.05] md:leading-none text-[clamp(1.45rem,min(4.15vw+0.65rem,8.2vw),3.6rem)] md:text-[clamp(2.4rem,6.4vw,5.4rem)] [overflow-wrap:anywhere] [word-break:break-word]">
              Cultivar <em className="text-brand-rose">no alto</em> é uma forma de proteger o que está embaixo.
            </h2>
          </div>
        </div>
      </div>

      {desktopLg ? (
        <>
          {/**
           * Hero à largura da secção (fora do `.container` 1360px) + texto editorial no container.
           */}
          <div className="mb-12 flex w-full max-w-full min-w-0 flex-col lg:mb-16">
            {/* Amazónia — só esta faixa leva legenda; nada de máscara nem segunda foto por cima. */}
            <div
              className={cn(
                "relative w-full max-w-full overflow-hidden bg-forest-dark",
                "min-h-[min(52vh,560px)] h-[52vh] md:min-h-[520px] md:h-[min(58vh,640px)]"
              )}
            >
              <img
                src={manifestoSrc}
                alt={stickyAlt}
                className={cn(
                  "absolute inset-0 z-[1] h-full w-full object-cover",
                  stickyKind === "aerial"
                    ? "object-[48%_34%] brightness-[1.04] contrast-[1.06] saturate-[1.12]"
                    : "object-center brightness-[1.12] contrast-[1.05]"
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
                  "pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t to-transparent",
                  stickyKind === "aerial"
                    ? "from-forest-dark/80 via-forest-dark/15"
                    : "from-forest-dark/55 via-forest-dark/12"
                )}
              />
              <div className="absolute inset-x-0 bottom-0 z-[3] px-6 pb-14 pt-24 md:px-10 md:pb-16 md:pt-28">
                <div className="container flex min-w-0 max-w-full flex-col gap-5 sm:flex-row sm:items-end sm:gap-10">
                  <p className="max-w-full min-w-0 flex-1 text-paper text-[1.14rem] font-light leading-[1.7] md:max-w-3xl md:text-[1.3rem] md:leading-[1.72]">
                    Acreditamos que produzir alimento na cidade, com tecnologia, eficiência e transparência, é uma das
                    formas mais concretas de aliviar a pressão sobre biomas como a Amazônia.
                  </p>
                  <span className="min-w-0 max-w-full shrink-0 text-paper/75 text-[0.74rem] uppercase tracking-[0.22em] sm:max-w-[min(100%,15rem)] sm:text-right sm:text-[0.88rem] sm:tracking-[0.26em]">
                    {locationChip}
                  </span>
                </div>
              </div>
            </div>
            {/* Torres — bloco separado por baixo, mesma largura. */}
            {showTrackLayer && (
              <div className="relative w-full max-w-full overflow-hidden bg-forest-dark min-h-[220px] h-[min(32vh,400px)] md:min-h-[280px] md:h-[min(38vh,480px)]">
                <img
                  src={trackChain[trackTry]}
                  alt="Cultivo vertical na unidade Fazendas Up, Manaus"
                  className="absolute inset-0 z-0 h-full w-full object-cover object-center brightness-[1.02] contrast-[1.04]"
                  decoding="async"
                  loading="eager"
                  onError={() =>
                    setTrackTry((t) => (t < trackChain.length - 1 ? t + 1 : trackChain.length))
                  }
                />
              </div>
            )}
          </div>

          <div className="container min-w-0 pb-16 pt-6 md:pt-10">
          <div className="mb-8 grid min-w-0 grid-cols-1 gap-12 gap-y-14 lg:grid-cols-12 lg:gap-x-14 [&>*]:min-w-0">
            <motion.div
              {...motionEnterFromBelow()}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.9 }}
              className="col-span-full min-w-0 max-w-full lg:col-span-5 lg:col-start-2"
            >
              <p className="eyebrow mb-5 inline-flex max-w-full flex-wrap items-center gap-3 text-paper/88 text-[0.82rem] md:text-[0.98rem]">
                <span className="h-px w-10 shrink-0 bg-paper/70" />
                <span className="min-w-0">Por que cultivar verticalmente</span>
              </p>
              <p className="max-w-full min-w-0 text-paper text-[1.14rem] font-normal leading-[1.82] md:text-[1.26rem] md:leading-[1.86]">
                Cada quilo produzido em ambiente urbano e controlado representa uma pequena área de floresta que não
                precisou ser derrubada. Esse é o nosso cálculo ético antes de qualquer cálculo econômico.
              </p>
            </motion.div>
            <motion.div
              {...motionEnterFromBelow()}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="col-span-full min-w-0 max-w-full lg:col-span-4 lg:col-start-8"
            >
              <ul className="space-y-4 text-[1.06rem] font-normal leading-relaxed text-paper/92 md:text-[1.14rem] md:leading-[1.75]">
                <li className="flex min-w-0 gap-3 border-t border-paper/30 pt-3 md:pt-4">
                  <span className="font-display pt-0.5 text-[1rem] italic text-clay md:text-[1.05rem]">01</span>
                  <span className="min-w-0">Operamos em Manaus, no centro do bioma que protegemos.</span>
                </li>
                <li className="flex min-w-0 gap-3 border-t border-paper/30 pt-3 md:pt-4">
                  <span className="font-display pt-0.5 text-[1rem] italic text-clay md:text-[1.05rem]">02</span>
                  <span className="min-w-0">Cada lote tem rastreabilidade da semente à colheita.</span>
                </li>
                <li className="flex min-w-0 gap-3 border-t border-paper/30 pt-3 md:pt-4">
                  <span className="font-display pt-0.5 text-[1rem] italic text-clay md:text-[1.05rem]">03</span>
                  <span className="min-w-0">Aliamos técnica agrônoma a engenharia de dados.</span>
                </li>
              </ul>
            </motion.div>
          </div>
          </div>
        </>
      ) : (
        <div className="container min-w-0 pb-16">
          {/** Mobile: Amazónia e torres em coluna (sem sobreposição). */}
          <div className="mb-10 flex w-full max-w-full min-w-0 flex-col overflow-hidden rounded-sm bg-forest-dark">
            <div
              className={cn(
                "relative w-full overflow-hidden",
                "aspect-[4/5] min-h-[280px] sm:aspect-[5/6] sm:min-h-[320px]"
              )}
            >
              <img
                src={manifestoSrc}
                alt={stickyAlt}
                className={cn(
                  "absolute inset-0 z-[1] h-full w-full object-cover",
                  stickyKind === "aerial"
                    ? "object-[48%_36%] brightness-[1.04] contrast-[1.06] saturate-[1.12]"
                    : "object-center brightness-[1.12] contrast-[1.05]"
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
                  "pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t to-transparent",
                  stickyKind === "aerial"
                    ? "from-forest-dark/80 via-forest-dark/15"
                    : "from-forest-dark/55 via-forest-dark/12"
                )}
              />
            </div>
            {showTrackLayer && (
              <div className="relative aspect-[16/11] w-full min-h-[200px] overflow-hidden border-t border-paper/10 sm:aspect-[16/10] sm:min-h-[220px]">
                <img
                  src={trackChain[trackTry]}
                  alt="Cultivo vertical na unidade Fazendas Up, Manaus"
                  className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.02] contrast-[1.04]"
                  decoding="async"
                  loading="eager"
                  onError={() =>
                    setTrackTry((t) => (t < trackChain.length - 1 ? t + 1 : trackChain.length))
                  }
                />
              </div>
            )}
          </div>
          <div className="mb-12 min-w-0 space-y-4">
            <p className="text-[1.1rem] font-light leading-[1.68] text-paper/88 sm:text-[1.14rem] sm:leading-[1.7]">
              Acreditamos que produzir alimento na cidade, com tecnologia, eficiência e transparência, é uma das formas
              mais concretas de aliviar a pressão sobre biomas como a Amazônia.
            </p>
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-paper/60 sm:text-[0.78rem]">{locationChip}</p>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-10 rounded-sm bg-forest-dark/45 px-4 py-7 sm:gap-12 sm:px-6 sm:py-8">
            <div className="min-w-0">
              <p className="eyebrow mb-4 inline-flex max-w-full flex-wrap items-center gap-3 text-paper/85 text-[0.82rem] sm:text-[0.9rem]">
                <span className="h-px w-9 shrink-0 bg-paper/70" />
                <span className="min-w-0">Por que cultivar verticalmente</span>
              </p>
              <p className="max-w-full min-w-0 text-paper text-[1.08rem] font-normal leading-[1.82] sm:text-[1.14rem] sm:leading-[1.84]">
                Cada quilo produzido em ambiente urbano e controlado representa uma pequena área de floresta que não
                precisou ser derrubada. Esse é o nosso cálculo ético antes de qualquer cálculo econômico.
              </p>
            </div>
            <ul className="min-w-0 space-y-4 text-[1.02rem] font-normal leading-relaxed text-paper/92 sm:text-[1.06rem]">
              <li className="flex min-w-0 gap-3 border-t border-paper/30 pt-3 sm:pt-4">
                <span className="font-display pt-0.5 text-[1rem] italic text-clay">01</span>
                <span className="min-w-0">Operamos em Manaus, no centro do bioma que protegemos.</span>
              </li>
              <li className="flex min-w-0 gap-3 border-t border-paper/30 pt-3 sm:pt-4">
                <span className="font-display pt-0.5 text-[1rem] italic text-clay">02</span>
                <span className="min-w-0">Cada lote tem rastreabilidade da semente à colheita.</span>
              </li>
              <li className="flex min-w-0 gap-3 border-t border-paper/30 pt-3 sm:pt-4">
                <span className="font-display pt-0.5 text-[1rem] italic text-clay">03</span>
                <span className="min-w-0">Aliamos técnica agrônoma a engenharia de dados.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/**
       * z-10 + fundo: separa Missão/Visão/Valores do hero acima para não competirem em empilhamento.
       */}
      <div className="relative z-10 min-w-0 bg-forest-dark pt-10 md:pt-14">
        <div className="container min-w-0">
        {/* Pillars */}
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-x-4 gap-y-12 sm:gap-x-8 md:grid-cols-12 md:gap-x-10 md:gap-y-14 lg:px-[5%] [&>*]:min-w-0">
          {pillars.map((p, i) => {
            const pillarClass =
              "col-span-full w-full min-w-0 max-w-full border-t border-paper/20 pt-7 md:col-span-4";
            const pillarInner = (
              <>
                <div className="mb-5 flex min-w-0 max-w-full items-center justify-between gap-3">
                  <span className="shrink-0 font-display text-[0.95rem] italic text-paper/45">
                    /0{i + 1}
                  </span>
                  <span className="size-1.5 shrink-0 rounded-full bg-clay" />
                </div>
                <h3 className="display-head mb-4 max-w-full min-w-0 hyphens-auto text-paper text-[clamp(1.85rem,min(6vw,12vw),2.4rem)] leading-tight [overflow-wrap:anywhere]">
                  {p.t}
                </h3>
                <p className="w-full min-w-0 max-w-full text-[0.97rem] font-light leading-[1.75] text-paper/70 [overflow-wrap:anywhere] [word-break:break-word]">
                  {p.b}
                </p>
              </>
            );
            return desktopLg ? (
              <motion.div
                key={p.t}
                {...motionEnterFromBelow()}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1], delay: i * 0.12 }}
                className={pillarClass}
              >
                {pillarInner}
              </motion.div>
            ) : (
              <div key={p.t} className={pillarClass}>
                {pillarInner}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
