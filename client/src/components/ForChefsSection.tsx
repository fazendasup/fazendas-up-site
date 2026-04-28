/**
 * For Chefs / Business — Off-axis split with parallax photograph
 * and progressively revealed benefit cards.
 */
import { ChefHat, Leaf, Truck, ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { getSiteImage } from "@/content/siteImages";

const benefits = [
  {
    icon: ChefHat,
    title: "Padrão de chef",
    body: "Cultivares premium e colheita feita em no máximo 24h antes da entrega, com apresentação e textura impecáveis.",
  },
  {
    icon: Leaf,
    title: "Cultivo limpo",
    body: "Produção sem agrotóxicos em ambiente controlado, com rastreabilidade completa de cada lote.",
  },
  {
    icon: Truck,
    title: "Entregas regulares",
    body: "Programações semanais ajustadas ao volume e ao mix do seu restaurante, mercado ou rede.",
  },
];

export function ForChefsSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["2%", "-18%"]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.16, 1.06, 1]);
  const vignette = useTransform(scrollYProgress, [0, 0.45, 1], [0.18, 0.28, 0.38]);

  return (
    <section
      ref={ref}
      className="relative overflow-x-clip overflow-y-visible border-t border-ink/10 bg-secondary py-24 text-ink md:py-30 lg:h-screen lg:py-10"
    >
      {/* Decorative big number, behind content */}
      <div className="pointer-events-none absolute -top-6 right-0 max-w-[100vw] select-none overflow-hidden md:right-10">
        <span className="font-display italic text-ink/[0.05] text-[12rem] leading-none sm:text-[15rem] md:text-[22rem] lg:text-[26rem]">
          B2B
        </span>
      </div>

      <div className="container relative min-w-0 lg:flex lg:h-full lg:flex-col lg:justify-center">
        <div className="grid grid-cols-12 items-stretch gap-10 lg:gap-14">
          {/* Image with parallax */}
          <div className="relative col-span-12 min-w-0 lg:col-span-5 lg:min-h-0">
            <div className="relative aspect-[4/5] w-full max-w-full overflow-hidden rounded-sm lg:aspect-auto lg:h-full">
              <motion.div
                style={{ y: imgY, scale: imgScale }}
                className="absolute inset-0 min-h-0 min-w-0 overflow-hidden will-change-transform"
              >
                <img
                  src={getSiteImage("forChefs")}
                  alt="Prato com ingredientes frescos da Fazendas Up"
                  className="absolute inset-0 h-full w-full max-w-none object-cover object-center md:h-[125%]"
                  onError={(e) => {
                    const el = e.currentTarget;
                    const step = el.getAttribute("data-for-chefs-fb");
                    if (step === "2") return;
                    if (step === "1") {
                      el.setAttribute("data-for-chefs-fb", "2");
                      el.src = "/manus-storage/vertical_farm_alt_0fb78d96.jpg";
                      return;
                    }
                    el.setAttribute("data-for-chefs-fb", "1");
                    el.src = "/uploads/prato_16.png";
                  }}
                />
              </motion.div>
              <motion.div
                style={{ opacity: vignette }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-ink/55"
              />
              <div className="absolute top-5 left-5 px-3 py-1.5 bg-paper/90 backdrop-blur-sm text-[0.7rem] uppercase tracking-[0.25em] text-ink">
                Para chefs e negócios
              </div>
            </div>
            <div className="mt-4 max-w-full text-pretty text-[0.78rem] italic text-muted-foreground md:max-w-xs">
              Colheita em no máximo 24h antes da entrega, com padrão visual e
              frescor consistentes.
            </div>
          </div>

          <div className="col-span-12 min-w-0 lg:col-span-7 lg:flex lg:flex-col lg:justify-center">
            <p className="eyebrow mb-6 inline-flex max-w-full flex-wrap items-center gap-3">
              <span className="h-px w-9 shrink-0 bg-forest" />
              <span className="min-w-0">Capítulo 05 · Parcerias</span>
            </p>
            <h2 className="display-head hyphens-auto max-w-full break-words text-ink text-[clamp(1.75rem,5vw+0.35rem,4rem)] leading-[1.12] sm:leading-[1.08] md:leading-none md:text-[clamp(2.2rem,5vw,4rem)]">
              Um parceiro <em>discreto</em> para cozinhas e operações exigentes.
            </h2>
            <p className="mt-6 max-w-full text-ink/75 text-[1rem] font-light leading-[1.7] text-pretty md:max-w-xl">
              Trabalhamos lado a lado com restaurantes, hotéis, mercados premium
              e redes de food service que enxergam ingrediente como matéria-prima
              estratégica.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/10 mt-9 border border-ink/10">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 48, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-12% 0px" }}
                  transition={{
                    type: "spring",
                    stiffness: 64,
                    damping: 20,
                    mass: 0.95,
                    delay: i * 0.09,
                  }}
                  className="min-w-0 max-w-full overflow-x-clip bg-secondary p-6 sm:p-7 transition-colors group hover:bg-paper"
                >
                  <div className="mb-6 flex min-w-0 items-center justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink/20 transition-colors group-hover:border-forest">
                      <b.icon className="size-4 text-forest" />
                    </span>
                    <span className="shrink-0 font-display text-[0.85rem] italic text-muted-foreground tabular-nums">
                      /0{i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 min-w-0 text-pretty text-[1.05rem] font-medium text-ink">
                    {b.title}
                  </h3>
                  <p className="min-w-0 text-pretty text-[0.9rem] font-light leading-[1.65] text-ink/65 break-words [overflow-wrap:anywhere]">
                    {b.body}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
              <a
                href="#contato"
                className="inline-flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-center text-[0.875rem] font-medium text-paper transition-colors hover:bg-forest-dark sm:w-auto"
              >
                Solicitar proposta comercial
                <ArrowUpRight className="size-4 shrink-0" />
              </a>
              <span className="min-w-0 text-pretty text-[0.85rem] text-muted-foreground break-words [overflow-wrap:anywhere]">
                Entrega em até 48h úteis
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
