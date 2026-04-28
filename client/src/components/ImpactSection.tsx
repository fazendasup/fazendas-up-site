/**
 * Impact — Sticky title with progressive reveal grid.
 * The headline pins on the left while the stats cards stream past on the right,
 * each scaling and fading in as it enters the viewport.
 */
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

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
      className="relative bg-paper text-ink pt-24 pb-16 md:pt-28 md:pb-20 overflow-x-hidden"
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

      <div className="container relative">
        <div className="grid grid-cols-12 gap-10 lg:gap-14">
          {/* Sticky title column */}
          <motion.div
            style={{ y: titleY, scale: titleScale }}
            className="col-span-12 lg:col-span-5 lg:sticky lg:top-28 self-start z-[1] origin-top-left will-change-transform"
          >
            <p className="eyebrow mb-7 inline-flex items-center gap-3">
              <span className="h-px w-9 bg-forest" />
              Capítulo 02 · Impacto
            </p>
            <h2 className="display-head text-ink text-[clamp(2.4rem,6vw,5rem)] mb-8">
              Sustentabilidade <em>medida</em>, não declarada.
            </h2>
            <p className="text-ink/70 text-[1.0625rem] leading-[1.75] font-light max-w-md mb-10">
              Cada indicador foi acompanhado durante a operação da nossa
              unidade em Manaus. Acreditamos que sustentabilidade só faz sentido
              se puder ser auditada.
            </p>
            <div className="text-[0.72rem] tracking-[0.25em] uppercase text-muted-foreground border-t border-ink/15 pt-5 max-w-xs">
              Indicadores · Edição 2026
            </div>
          </motion.div>

          {/* Cards column */}
          <div className="col-span-12 lg:col-span-7 flex flex-col relative z-0 [perspective:1400px]">
            {stats.map((s, i) => (
              <motion.article
                key={s.label}
                initial={{ opacity: 0, y: 110, rotateX: -6, filter: "blur(12px)" }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-14% 0px" }}
                transition={{
                  type: "spring",
                  stiffness: 62,
                  damping: 22,
                  mass: 1.05,
                  delay: i * 0.07,
                }}
                className={`relative grid grid-cols-12 gap-6 py-7 md:py-8 ${
                  i !== stats.length - 1 ? "border-b border-ink/15" : ""
                }`}
              >
                <div className="col-span-2 md:col-span-2">
                  <span className="font-display italic text-muted-foreground text-[0.95rem]">
                    /0{i + 1}
                  </span>
                </div>
                <div className="col-span-10 md:col-span-5">
                  <div
                    className={`display-head text-ink leading-none ${
                      s.value === "0"
                        ? "text-[clamp(2rem,3.4vw,2.85rem)]"
                        : "text-[clamp(2.2rem,4.8vw,3.75rem)]"
                    }`}
                  >
                    {s.value}
                  </div>
                </div>
                <div className="col-span-12 md:col-span-5 md:pt-2">
                  <h3 className="text-ink text-[1.05rem] font-medium mb-2">
                    {s.label}
                  </h3>
                  <p className="text-ink/65 text-[0.95rem] leading-[1.65] font-light">
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
