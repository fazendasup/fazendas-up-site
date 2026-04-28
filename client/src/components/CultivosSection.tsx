/**
 * Cultivos — Sticky alternating editorial spreads.
 * Each product gets a full-viewport spread; image and copy alternate sides.
 * Imagens com parallax acoplado ao scroll (mesma lógica editorial da capa).
 */
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { getSiteImage } from "@/content/siteImages";

/**
 * Se /uploads/... não existir, tenta-se a lista (manus-storage; último = sempre o mesmo ficheiro base).
 * Assim o painel 03 (Saladas) não fica vazio se flora comestível falhar.
 */
const cultivosImageFallbackChain: string[][] = [
  ["/manus-storage/microgreens_real_acdfc639.jpg", "/manus-storage/vertical_farm_alt_0fb78d96.jpg"],
  ["/manus-storage/lettuce_hydroponic_be7593c2.jpg", "/manus-storage/vertical_farm_alt_0fb78d96.jpg"],
  [
    "/uploads/prato_15.png",
    "/manus-storage/edible_flowers_real_120fd4f0.jpg",
    "/manus-storage/lettuce_hydroponic_be7593c2.jpg",
    "/manus-storage/vertical_farm_alt_0fb78d96.jpg",
  ],
];

const cultivos = [
  {
    n: "01",
    name: "Microverdes",
    subtitle: "Produção ativa",
    image: getSiteImage("cultivosMicroverdes"),
    body: "Produzimos microverdes para gastronomia e varejo premium, com foco em frescor, regularidade e qualidade visual.",
    notes: ["Aplicações culinárias", "Padrão de colheita", "Rastreabilidade de lotes", "Entrega local"],
    accent: "#5c2761",
  },
  {
    n: "02",
    name: "Hortalicas folhosas",
    subtitle: "Produção ativa",
    image: getSiteImage("cultivosSalanova"),
    body: "Produzimos hortaliças folhosas para consumo diário, com manejo controlado e padrão consistente para canais de consumo e venda.",
    notes: ["Mix de folhas", "Textura e crocância", "Padrão visual", "Vida útil em foco"],
    accent: "#4b004f",
  },
  {
    n: "03",
    name: "Saladas prontas",
    subtitle: "Produção ativa",
    image: getSiteImage("cultivosFlores"),
    body: "Produzimos soluções de saladas para atender consumidores e operações B2B com conveniência, frescor e previsibilidade de fornecimento.",
    notes: ["Porcionamento", "Praticidade", "Padrão de qualidade", "Escala comercial"],
    accent: "#72347a",
  },
] as const;

type CultivoRow = (typeof cultivos)[number];

function CultivosSpreadRow({
  c,
  i,
  reverse,
  showBorder,
}: {
  c: CultivoRow;
  i: number;
  reverse: boolean;
  showBorder: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.09, 1, 1.04]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const gloss = useTransform(scrollYProgress, [0, 0.55, 1], [0.22, 0.38, 0.28]);

  return (
    <div
      ref={rowRef}
      className={`relative flex flex-col justify-center overflow-x-clip md:min-h-[78vh] ${showBorder ? "border-b border-ink/10" : ""}`}
    >
      <div className="container min-w-0 py-14 md:py-24">
        <div
          className={`grid min-w-0 grid-cols-12 items-center gap-10 lg:gap-16 [&>*]:min-w-0 ${
            reverse ? "lg:[direction:rtl]" : ""
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 72, rotateY: reverse ? 5 : -5, filter: "blur(16px)" }}
            whileInView={{ opacity: 1, y: 0, rotateY: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{
              type: "spring",
              stiffness: 48,
              damping: 20,
              mass: 1.1,
            }}
            className="col-span-12 min-w-0 max-w-full [direction:ltr] [perspective:1200px] lg:col-span-7"
          >
            <div className="relative mx-auto aspect-[5/6] w-full max-w-full overflow-hidden rounded-sm lg:aspect-[7/8]">
              <motion.div
                style={{ scale: imgScale, y: imgY }}
                className="absolute inset-0 min-h-0 min-w-0 overflow-hidden will-change-transform"
              >
                <img
                  key={c.image}
                  src={c.image}
                  alt={c.name}
                  className="h-full w-full max-w-none object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    const chain = cultivosImageFallbackChain[i] ?? [];
                    const prev = el.getAttribute("data-cultivos-fb");
                    const nextIdx = prev === null ? 0 : Number(prev) + 1;
                    if (nextIdx >= chain.length) return;
                    el.setAttribute("data-cultivos-fb", String(nextIdx));
                    el.src = chain[nextIdx] ?? "";
                  }}
                />
              </motion.div>
              <motion.div
                style={{ opacity: gloss }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink/25 via-transparent to-paper/20"
              />
              <div
                className="absolute top-5 left-5 px-3 py-1.5 text-[0.7rem] tracking-[0.25em] uppercase text-paper"
                style={{ background: c.accent }}
              >
                Nº {c.n}
              </div>
              <div className="absolute bottom-5 right-5 text-paper/85 text-[0.7rem] uppercase tracking-[0.25em] bg-ink/40 backdrop-blur-sm px-3 py-1.5">
                {c.subtitle}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 56, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{
              type: "spring",
              stiffness: 58,
              damping: 22,
              delay: 0.08,
            }}
            className="col-span-12 min-w-0 [direction:ltr] lg:col-span-5"
          >
            <div className="mb-5 flex min-w-0 items-center gap-4">
              <span className="font-display italic text-muted-foreground text-[0.9rem]">
                Edição /0{i + 1}
              </span>
              <span className="h-px flex-1 bg-ink/15" />
            </div>
            <h3 className="display-head hyphens-auto mb-3 max-w-full text-ink text-[clamp(1.75rem,5vw+0.35rem,3.6rem)] leading-[1.08] md:leading-none md:text-[clamp(2.2rem,4.4vw,3.6rem)]">
              {c.name}
            </h3>
            <p className="mb-8 max-w-full text-[1.05rem] font-light leading-[1.75] text-ink/75">
              {c.body}
            </p>
            <div className="border-t border-ink/15 pt-6">
              <p className="eyebrow mb-4 text-muted-foreground">Diretrizes da categoria</p>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {c.notes.map((n) => (
                  <li key={n} className="flex min-w-0 items-start gap-2.5 text-[0.92rem] text-ink/75">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: c.accent }} />
                    <span className="min-w-0 break-words">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function CultivosSection() {
  return (
    <section id="cultivos" className="relative overflow-x-clip bg-paper text-ink">
      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ type: "spring", stiffness: 52, damping: 22 }}
        className="container min-w-0 pt-16 pb-12 md:pt-20 md:pb-16"
      >
        <div className="grid grid-cols-12 items-end gap-8 [&>*]:min-w-0">
          <div className="col-span-12 min-w-0 pb-1 lg:col-span-7">
            <p className="eyebrow mb-6 inline-flex max-w-full flex-wrap items-center gap-3">
              <span className="h-px w-9 shrink-0 bg-forest" />
              <span className="min-w-0">Capítulo 03 · Produtos</span>
            </p>
            <h2 className="display-head hyphens-auto max-w-full text-ink text-[clamp(1.85rem,5.2vw+0.35rem,4.25rem)] leading-[1.12] tracking-tight sm:leading-[1.1] md:text-[clamp(2.2rem,5.2vw,4.25rem)] md:leading-[1.14]">
              Categorias em produção, <em>um padrão</em>
              <br className="hidden md:block" /> de excelência.
            </h2>
          </div>
          <div className="col-span-12 min-w-0 pb-2 lg:col-span-4 lg:col-start-9">
            <p className="text-[1.0625rem] font-light leading-[1.75] text-ink/70">
              Atendemos restaurantes, mercados e clientes do nosso clube de assinatura. Toda colheita é feita em no
              máximo 24h antes da entrega.
            </p>
          </div>
        </div>
      </motion.div>

      {cultivos.map((c, i) => (
        <CultivosSpreadRow
          key={c.name}
          c={c}
          i={i}
          reverse={i % 2 === 1}
          showBorder={i !== cultivos.length - 1}
        />
      ))}
    </section>
  );
}
