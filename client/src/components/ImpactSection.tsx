/**
 * Impact — Sticky title with progressive reveal grid.
 * The headline pins on the left while the stats cards stream past on the right,
 * each scaling and fading in as it enters the viewport.
 */
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";

const stats = [
  {
    value: "−95%",
    label: "Consumo de água",
    body: "A hidroponia recirculante reaproveita praticamente toda a água do sistema.",
  },
  {
    value: "−80%",
    label: "Pegada de carbono",
    body: "Cultivar próximo ao consumidor encurta a cadeia entre quem planta e quem come.",
  },
  {
    value: "−40%",
    label: "Uso de fertilizantes",
    body: "Aplicamos exatamente o que cada cultura precisa, sem excesso.",
  },
  {
    value: "10×",
    label: "Produtividade por m²",
    body: "Cultivar verticalmente preserva áreas naturais e libera o solo.",
  },
  {
    value: "+40%",
    label: "Tempo de prateleira",
    body: "Colheita no ponto certo, com mínima manipulação, mais frescor.",
  },
  {
    value: "0",
    label: "Agrotóxicos",
    body: "Ambiente fechado dispensa pesticidas. Sem exceções, sem trade-offs.",
  },
];

export function ImpactSection() {
  const ref = useRef<HTMLElement>(null);
  const narrow = useNarrowViewport();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], ["5%", "-6%"]);
  const titleScale = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [0.94, 1, 1.02, 0.98]);

  return (
    <section
      id="impacto"
      ref={ref}
      className="relative overflow-x-visible bg-paper pt-24 pb-16 text-ink scroll-mt-20 md:scroll-mt-24 md:pt-28 md:pb-20"
    >
      {/* Top curved seam from forest section above */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute -top-px inset-x-0 z-[6] w-full h-[80px] md:h-[120px] text-forest-dark"
      >
        <path
          d="M0,0 L1440,0 L1440,40 Q1080,120 720,40 T0,40 Z"
          fill="currentColor"
        />
      </svg>

      <div className="container relative min-w-0">
        <div className="grid grid-cols-12 gap-10 lg:gap-14 [&>*]:min-w-0">
          {/* Sticky title column */}
          <motion.div
            style={{
              y: narrow ? 0 : titleY,
              scale: narrow ? 1 : titleScale,
            }}
            className="col-span-12 z-[1] min-w-0 max-w-full origin-top-left self-start overflow-x-visible will-change-transform lg:sticky lg:top-28 lg:col-span-5"
          >
            <p className="eyebrow mb-7 inline-flex max-w-full flex-wrap items-center gap-3">
              <span className="h-px w-9 shrink-0 bg-forest" />
              <span className="min-w-0">Capítulo 02 · Impacto</span>
            </p>
            <h2 className="display-head hyphens-none mb-8 max-w-full text-ink text-[clamp(1.7rem,5.5vw+0.35rem,5rem)] leading-[1.08] sm:leading-[1.05] md:leading-none md:text-[clamp(2.4rem,6vw,5rem)]">
              Sustentabilidade <em>medida</em>, não declarada.
            </h2>
            <p className="mb-10 max-w-full text-[1.0625rem] font-light leading-[1.75] text-ink/70 md:max-w-md">
              Cada indicador foi acompanhado durante a operação da nossa
              unidade em Manaus. Acreditamos que sustentabilidade só faz sentido
              se puder ser auditada.
            </p>
            <div className="text-[0.72rem] tracking-[0.25em] uppercase text-muted-foreground border-t border-ink/15 pt-5 max-w-xs">
              Indicadores · Edição 2026
            </div>
          </motion.div>

          {/* Cards column */}
          <div className="relative z-0 col-span-12 flex min-w-0 max-w-full flex-col overflow-x-visible perspective-none lg:[perspective:1400px] lg:col-span-7 [&>*]:min-w-0">
            {stats.map((s, i) => (
              <motion.article
                key={s.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-14% 0px" }}
                transition={{
                  type: "spring",
                  stiffness: 62,
                  damping: 22,
                  mass: 1.05,
                  delay: i * 0.07,
                }}
                className={`relative flex min-w-0 max-w-full flex-col gap-y-5 py-7 sm:grid sm:grid-cols-12 sm:gap-x-6 sm:gap-y-6 md:py-8 [&>*]:min-w-0 ${
                  i !== stats.length - 1 ? "border-b border-ink/15" : ""
                }`}
              >
                {/* Mobile: índice + valor empilhados (evita % cortado em linha única) */}
                <div className="col-span-12 space-y-3 sm:col-span-2 sm:space-y-0">
                  <div className="space-y-3 sm:hidden">
                    <span className="block font-display text-[0.95rem] italic text-muted-foreground tabular-nums">
                      /0{i + 1}
                    </span>
                    <div
                      className={`display-head w-full max-w-full leading-none ${
                        s.value === "0"
                          ? "text-[clamp(2rem,3.4vw,2.85rem)]"
                          : "text-[clamp(2.2rem,4.8vw,3.75rem)]"
                      }`}
                    >
                      {s.value}
                    </div>
                  </div>
                  <span className="hidden font-display text-[0.95rem] italic text-muted-foreground tabular-nums sm:inline-block">
                    /0{i + 1}
                  </span>
                </div>
                <div className="hidden min-w-0 sm:col-span-10 md:col-span-5 sm:block">
                  <div
                    className={`display-head max-w-full break-words text-ink leading-none ${
                      s.value === "0"
                        ? "text-[clamp(2rem,3.4vw,2.85rem)]"
                        : "text-[clamp(2.2rem,4.8vw,3.75rem)]"
                    }`}
                  >
                    {s.value}
                  </div>
                </div>
                <div className="col-span-12 min-w-0 w-full max-w-full md:col-span-5 md:pt-2">
                  <h3 className="mb-2 min-w-0 text-[1.05rem] font-medium text-ink">
                    {s.label}
                  </h3>
                  <p className="min-w-0 max-w-full text-[0.95rem] font-light leading-[1.65] text-ink/65">
                    {s.body}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
