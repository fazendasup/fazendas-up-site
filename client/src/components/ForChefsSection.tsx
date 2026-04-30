/**
 * For Chefs / Business — Off-axis split with parallax photograph
 * and progressively revealed benefit cards.
 */
import { ChefHat, Leaf, Truck, ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { getSiteImage } from "@/content/siteImages";
import { useMinLg } from "@/hooks/useMinLg";
import { motionEnterFromBelow } from "@/lib/motionEntrance";

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
  const desktopLg = useMinLg();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["2%", "-18%"]);
  /** Parallax suave — escala alta em mobile corta a foto nas bordas (object-cover + overflow). */
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.07, 1.04, 1]);
  const vignette = useTransform(scrollYProgress, [0, 0.45, 1], [0.18, 0.28, 0.38]);

  return (
    <section
      ref={ref}
      className="relative isolate w-full max-w-full min-w-0 overflow-x-visible overflow-y-visible border-t border-ink/10 bg-secondary pt-24 pb-32 text-ink md:py-30 lg:h-screen lg:py-10"
    >
      {/* Decorativo enorme — em mobile empurra layout/scrollWidth mesmo com overflow; só a partir de md */}
      <div className="pointer-events-none absolute inset-x-0 -top-6 hidden max-w-full justify-end overflow-hidden select-none md:flex md:inset-x-auto md:right-10 md:left-auto md:w-auto">
        <span className="font-display italic text-ink/[0.05] text-[clamp(6rem,42vw,12rem)] leading-none whitespace-nowrap sm:text-[15rem] md:text-[22rem] lg:text-[26rem]">
          B2B
        </span>
      </div>

      <div className="container relative min-w-0 lg:flex lg:h-full lg:flex-col lg:justify-center [&>*]:min-w-0">
        <div className="grid grid-cols-12 items-stretch gap-10 lg:gap-14 [&>*]:min-w-0">
          {/* Image with parallax */}
          <div className="relative col-span-12 min-w-0 lg:col-span-5 lg:min-h-0">
            <div className="relative aspect-[4/5] w-full max-w-full overflow-hidden rounded-sm bg-ink/35 lg:aspect-auto lg:h-full">
              {desktopLg ? (
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
              ) : (
                <div className="absolute inset-0 min-h-0 min-w-0 overflow-hidden">
                  <img
                    src={getSiteImage("forChefs")}
                    alt="Prato com ingredientes frescos da Fazendas Up"
                    className="absolute inset-0 z-0 h-full w-full min-h-full min-w-full max-w-none scale-[1.002] object-cover object-center"
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
                </div>
              )}
              {desktopLg ? (
                <motion.div
                  style={{ opacity: vignette }}
                  className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-ink/25 via-transparent to-ink/55"
                />
              ) : (
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-ink/25 via-transparent to-ink/55 opacity-[0.32]"
                  aria-hidden
                />
              )}
              <div className="absolute top-5 left-5 z-[2] px-3 py-1.5 bg-paper/90 backdrop-blur-sm text-[0.7rem] uppercase tracking-[0.25em] text-ink">
                Para chefs e negócios
              </div>
            </div>
            <div className="mt-4 max-w-full text-[0.78rem] italic text-muted-foreground md:max-w-xs">
              Colheita em no máximo 24h antes da entrega, com padrão visual e
              frescor consistentes.
            </div>
          </div>

          <div className="col-span-12 min-w-0 max-w-full lg:col-span-7 lg:flex lg:flex-col lg:justify-center">
            <p className="eyebrow mb-6 inline-flex max-w-full flex-wrap items-center gap-3">
              <span className="h-px w-9 shrink-0 bg-forest" />
              <span className="min-w-0">Capítulo 05 · Parcerias</span>
            </p>
            <h2 className="display-head hyphens-none max-w-full break-words pb-1 text-ink text-[clamp(1.45rem,4.5vw+0.35rem,4rem)] leading-[1.32] sm:leading-[1.26] md:leading-none md:text-[clamp(2.2rem,5vw,4rem)] [&_em]:font-display [&_em]:italic [&_em]:font-normal [&_em]:text-brand-rose">
              Um parceiro <em>discreto</em> para cozinhas e operações exigentes.
            </h2>
            <p className="mt-6 max-w-full text-[1rem] font-light leading-[1.7] text-ink/75 md:max-w-xl">
              Trabalhamos lado a lado com restaurantes, hotéis, mercados premium
              e redes de food service que enxergam ingrediente como matéria-prima
              estratégica.
            </p>

            <div className="mt-9 grid w-full min-w-0 max-w-full rounded-sm border border-ink/10 bg-ink/10 [grid-template-columns:minmax(0,1fr)] md:[grid-template-columns:repeat(3,minmax(0,1fr))] [&>*]:min-w-0">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  {...motionEnterFromBelow()}
                  viewport={{ once: true, margin: "-12% 0px" }}
                  transition={{
                    type: "spring",
                    stiffness: 64,
                    damping: 20,
                    mass: 0.95,
                    delay: i * 0.09,
                  }}
                  className="min-w-0 max-w-full overflow-x-visible overflow-y-visible bg-secondary px-5 pt-6 pb-7 sm:p-7 transition-colors group hover:bg-paper"
                >
                  <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink/20 transition-colors group-hover:border-forest">
                      <b.icon className="size-4 text-forest" />
                    </span>
                    <span className="shrink-0 text-right font-display text-[0.85rem] italic text-muted-foreground tabular-nums">
                      /0{i + 1}
                    </span>
                  </div>
                  <h3 className="mb-3.5 min-w-0 text-[1.05rem] font-medium leading-snug text-ink">
                    {b.title}
                  </h3>
                  <p className="min-w-0 text-[0.9rem] font-light leading-[1.78] text-ink/65 md:leading-[1.72] [overflow-wrap:anywhere] [word-break:break-word] max-md:pb-0.5">
                    {b.body}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex w-full min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 max-lg:pb-1">
              <a
                href="#contato"
                className="box-border inline-flex w-full min-w-0 max-w-full shrink-0 items-center justify-center gap-2 rounded-full bg-forest px-4 py-3 text-center text-[0.875rem] font-medium text-paper transition-colors [overflow-wrap:anywhere] hover:bg-forest-dark sm:w-auto sm:max-w-[min(100%,28rem)] sm:px-5"
              >
                Solicitar proposta comercial
                <ArrowUpRight className="size-4 shrink-0" />
              </a>
              <span className="min-w-0 text-[0.85rem] text-muted-foreground">
                Entrega em até 48h úteis
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
