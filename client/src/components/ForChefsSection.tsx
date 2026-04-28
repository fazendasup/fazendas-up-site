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
      className="relative bg-secondary text-ink py-24 md:py-30 lg:h-screen lg:py-10 overflow-hidden border-t border-ink/10"
    >
      {/* Decorative big number, behind content */}
      <div className="absolute -top-6 right-4 md:right-10 select-none pointer-events-none">
        <span className="font-display italic text-ink/[0.05] text-[18rem] md:text-[26rem] leading-none">
          B2B
        </span>
      </div>

      <div className="container relative lg:h-full lg:flex lg:flex-col lg:justify-center">
        <div className="grid grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Image with parallax */}
          <div className="col-span-12 lg:col-span-5 relative lg:min-h-0">
            <div className="relative aspect-[4/5] lg:h-full lg:aspect-auto overflow-hidden rounded-sm">
              <motion.div
                style={{ y: imgY, scale: imgScale }}
                className="absolute inset-0 will-change-transform"
              >
                <img
                  src={getSiteImage("forChefs")}
                  alt="Prato com ingredientes frescos da Fazendas Up"
                  className="absolute inset-0 w-full h-[125%] object-cover object-center"
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
            <div className="mt-4 text-[0.78rem] text-muted-foreground italic max-w-xs">
              Colheita em no máximo 24h antes da entrega, com padrão visual e
              frescor consistentes.
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 lg:flex lg:flex-col lg:justify-center">
            <p className="eyebrow mb-6 inline-flex items-center gap-3">
              <span className="h-px w-9 bg-forest" />
              Capítulo 05 · Parcerias
            </p>
            <h2 className="display-head text-ink text-[clamp(2.2rem,5vw,4rem)]">
              Um parceiro <em>discreto</em> para cozinhas e operações exigentes.
            </h2>
            <p className="text-ink/75 text-[1rem] leading-[1.7] font-light max-w-xl mt-6">
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
                  className="bg-secondary p-7 group hover:bg-paper transition-colors"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="size-10 rounded-full border border-ink/20 flex items-center justify-center group-hover:border-forest transition-colors">
                      <b.icon className="size-4 text-forest" />
                    </span>
                    <span className="font-display italic text-muted-foreground text-[0.85rem]">
                      /0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-ink text-[1.05rem] font-medium mb-2">
                    {b.title}
                  </h3>
                  <p className="text-ink/65 text-[0.9rem] leading-[1.65] font-light">
                    {b.body}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#contato"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-forest text-paper text-[0.875rem] font-medium hover:bg-forest-dark transition-colors"
              >
                Solicitar proposta comercial
                <ArrowUpRight className="size-4" />
              </a>
              <span className="text-[0.85rem] text-muted-foreground">
                Entrega em até 48h úteis
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
