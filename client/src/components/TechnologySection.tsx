/**
 * Technology — Scroll-driven chapter with pinned stage.
 * As the user scrolls, the active step advances from 01 to 04.
 */
import { Cpu, Droplets, Sprout, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getSiteImage, type SiteImageKey } from "@/content/siteImages";
import { useMinLg } from "@/hooks/useMinLg";
import { useMemo, useState } from "react";

const technologyImageKeys = [
  "technologyStep1",
  "technologyStep2",
  "technologyStep3",
  "technologyStep4",
] as const satisfies readonly SiteImageKey[];

/** Se o ficheiro em /uploads/ não estiver no servidor, evita o painel vazio. */
const technologyImageFallback: Record<number, string> = {
  0: "/manus-storage/vertical_farm_alt_0fb78d96.jpg",
  1: "/manus-storage/lettuce_hydroponic_be7593c2.jpg",
  2: "/manus-storage/vertical_farm_alt_0fb78d96.jpg",
  3: "/manus-storage/vertical_farm_alt_0fb78d96.jpg",
};

const steps = [
  {
    n: "01",
    icon: Sprout,
    title: "Sementes selecionadas",
    body: "Trabalhamos com cultivares de alta performance e germinação em substrato livre de contaminantes, com padrão de qualidade desde o primeiro dia.",
    metric: "+ 15 cultivares",
    metricLabel: "no portfólio ativo",
  },
  {
    n: "02",
    icon: Droplets,
    title: "Hidroponia recirculante",
    body: "Um circuito fechado entrega água e nutrientes na medida exata. Reduzimos em até 95% o consumo hídrico em relação ao plantio convencional.",
    metric: "− 95%",
    metricLabel: "de consumo de água",
  },
  {
    n: "03",
    icon: Sun,
    title: "Iluminação LED espectral",
    body: "Espectros de luz são calibrados para cada espécie, encurtando ciclos em até 30% e preservando o perfil nutricional natural das plantas.",
    metric: "− 30%",
    metricLabel: "no ciclo de cultivo",
  },
  {
    n: "04",
    icon: Cpu,
    title: "Ambiente totalmente controlado",
    body: "Sensores de pH, condutividade, temperatura e umidade atuam continuamente. A planta vive sempre seu melhor clima possível, todos os dias do ano.",
    metric: "365 dias",
    metricLabel: "de produção estável",
  },
];

export function TechnologySection() {
  const desktopLg = useMinLg();
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goToStep = (nextStep: number) => {
    if (nextStep === activeStep) return;
    setDirection(nextStep > activeStep ? 1 : -1);
    setActiveStep(nextStep);
  };

  const nextStep = () => {
    setDirection(1);
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setDirection(-1);
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const current = steps[activeStep];
  const railWidth = `${((activeStep + 1) / steps.length) * 100}%`;
  /** Sem translateX: no iOS infla scrollWidth e corta texto à direita. */
  const slideVariants = useMemo(
    () => ({
      enter: () => ({
        opacity: 0,
        x: 0,
      }),
      center: { opacity: 1, x: 0 },
      exit: () => ({
        opacity: 0,
        x: 0,
      }),
    }),
    []
  );

  return (
    <div id="tecnologia" className="min-w-0 max-w-full">
      <section className="relative isolate w-full max-w-full min-w-0 overflow-x-visible bg-forest-dark text-paper lg:h-screen lg:overflow-hidden">
        <div className="container min-w-0 py-20 lg:flex lg:h-screen lg:flex-col lg:py-10 [&>*]:min-w-0">
          <p className="eyebrow text-on-plum-soft mb-5 inline-flex max-w-full flex-wrap items-center gap-3">
            <span className="h-px w-9 shrink-0 bg-on-plum-soft/70" />
            <span className="min-w-0">Capitulo 01 · Tecnologia</span>
          </p>
          <h2 className="display-head hyphens-none break-normal text-paper max-w-full leading-[1.08] text-[clamp(1.65rem,5.8vw+0.35rem,2.5rem)] [overflow-wrap:normal] sm:leading-[1.05] md:leading-none lg:max-w-5xl lg:text-[clamp(2rem,3.6vw,3.25rem)]">
            Um <em className="text-on-plum-strong not-italic">sistema agricola</em> que une{" "}
            <span className="whitespace-nowrap">biologia</span>, engenharia e dados.
          </h2>
          <p className="mt-5 max-w-full text-[0.95rem] leading-[1.65] text-on-plum-soft md:max-w-xl">
            Quatro principios sustentam cada bandeja produzida pela Fazendas Up.
          </p>
          <div className="mt-10 grid min-h-0 grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:mt-6 lg:flex-1 lg:items-stretch lg:gap-10 [&>*]:min-w-0">
            <div className="col-span-full min-w-0 lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              {desktopLg ? (
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={`content-${activeStep}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mb-5 flex items-center gap-4 lg:mb-4">
                      <span className="font-display italic text-on-plum-muted text-[1.05rem]">
                        {current.n} / 04
                      </span>
                      <span className="h-px max-w-[120px] flex-1 bg-on-plum-soft/35" />
                      <span className="flex size-10 items-center justify-center rounded-full border border-on-plum-soft/40">
                        <current.icon className="size-4 text-on-plum-strong" />
                      </span>
                    </div>
                    <h3 className="display-head mb-4 max-w-full hyphens-none text-paper text-[clamp(1.45rem,4.2vw+0.2rem,2.4rem)] leading-[1.08] md:text-[clamp(1.6rem,3vw,2.4rem)] md:leading-none lg:max-w-md">
                      {current.title}
                    </h3>
                    <p className="max-w-full text-[1rem] font-light leading-[1.65] text-on-plum-strong/95 lg:max-w-md lg:text-[0.98rem]">
                      {current.body}
                    </p>
                    <div className="mt-7 max-w-md border-t border-on-plum-soft/30 pt-5 lg:mt-6">
                      <div className="mb-1 font-display text-[clamp(2.1rem,5vw,2.7rem)] italic leading-none text-on-plum-strong">
                        {current.metric}
                      </div>
                      <div className="max-w-full min-w-0 text-[0.78rem] uppercase tracking-[0.2em] text-on-plum-muted">
                        {current.metricLabel}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div key={activeStep}>
                  <div className="mb-5 flex items-center gap-4 lg:mb-4">
                    <span className="font-display italic text-on-plum-muted text-[1.05rem]">
                      {current.n} / 04
                    </span>
                    <span className="h-px max-w-[120px] flex-1 bg-on-plum-soft/35" />
                    <span className="flex size-10 items-center justify-center rounded-full border border-on-plum-soft/40">
                      <current.icon className="size-4 text-on-plum-strong" />
                    </span>
                  </div>
                  <h3 className="display-head mb-4 max-w-full hyphens-none text-paper text-[clamp(1.45rem,4.2vw+0.2rem,2.4rem)] leading-[1.08] md:text-[clamp(1.6rem,3vw,2.4rem)] md:leading-none lg:max-w-md">
                    {current.title}
                  </h3>
                  <p className="max-w-full text-[1rem] font-light leading-[1.65] text-on-plum-strong/95 lg:max-w-md lg:text-[0.98rem]">
                    {current.body}
                  </p>
                  <div className="mt-7 max-w-md border-t border-on-plum-soft/30 pt-5 lg:mt-6">
                    <div className="mb-1 font-display text-[clamp(2.1rem,5vw,2.7rem)] italic leading-none text-on-plum-strong">
                      {current.metric}
                    </div>
                    <div className="max-w-full min-w-0 text-[0.78rem] uppercase tracking-[0.2em] text-on-plum-muted">
                      {current.metricLabel}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-full min-w-0 lg:col-span-7 lg:min-h-0">
              <div className="relative aspect-[4/3] w-full max-w-full overflow-hidden rounded-sm border border-on-plum-soft/25 bg-forest-dark lg:aspect-auto lg:h-full">
                {desktopLg ? (
                  <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.img
                      key={`image-${activeStep}`}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      src={getSiteImage(technologyImageKeys[activeStep])}
                      alt={current.title}
                      className={
                        activeStep === 0
                          ? "absolute inset-0 h-full w-full max-h-none max-w-full object-cover object-[50%_10%] md:object-[50%_6%]"
                          : activeStep === 1
                            ? "absolute inset-0 h-full w-full max-h-none max-w-full object-cover object-[50%_58%] md:object-center"
                            : "absolute inset-0 h-full w-full max-h-none max-w-full object-cover"
                      }
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.getAttribute("data-fallback") === "1") return;
                        const next = technologyImageFallback[activeStep];
                        if (!next || el.src.endsWith(next)) return;
                        el.setAttribute("data-fallback", "1");
                        el.src = next;
                      }}
                    />
                  </AnimatePresence>
                ) : (
                  <img
                    key={activeStep}
                    src={getSiteImage(technologyImageKeys[activeStep])}
                    alt={current.title}
                    className={
                      activeStep === 0
                        ? "absolute inset-0 h-full w-full max-h-none max-w-full object-cover object-[50%_10%] md:object-[50%_6%]"
                        : activeStep === 1
                          ? "absolute inset-0 h-full w-full max-h-none max-w-full object-cover object-[50%_58%] md:object-center"
                          : "absolute inset-0 h-full w-full max-h-none max-w-full object-cover"
                    }
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.getAttribute("data-fallback") === "1") return;
                      const next = technologyImageFallback[activeStep];
                      if (!next || el.src.endsWith(next)) return;
                      el.setAttribute("data-fallback", "1");
                      el.src = next;
                    }}
                  />
                )}
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-forest-dark/50 via-forest-dark/12 to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 z-[2] flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-on-plum-strong/95 text-[0.72rem] uppercase tracking-[0.2em]">
                  <span className="min-w-0">FZD-UP / Cultivo</span>
                  <span className="shrink-0">{current.n} de 04</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex min-w-0 w-full items-center justify-between gap-4 lg:mt-5 [&>*]:min-w-0">
            <button
              type="button"
              onClick={prevStep}
              className="shrink-0 rounded-full border border-on-plum-soft/35 px-4 py-2 text-[0.78rem] uppercase tracking-[0.16em] text-on-plum-soft hover:text-paper hover:border-on-plum-soft/60 transition-colors"
            >
              Anterior
            </button>
            <div className="hidden md:flex flex-1 h-px bg-on-plum-soft/30 relative max-w-[420px] mx-3">
              <motion.div
                animate={{ width: railWidth }}
                transition={{ type: "spring", stiffness: 250, damping: 30 }}
                className="absolute inset-y-0 left-0 bg-on-plum-strong h-px origin-left"
              />
            </div>
            <button
              type="button"
              onClick={nextStep}
              className="shrink-0 rounded-full border border-on-plum-soft/35 px-4 py-2 text-[0.78rem] uppercase tracking-[0.16em] text-on-plum-soft hover:text-paper hover:border-on-plum-soft/60 transition-colors"
            >
              Proximo
            </button>
          </div>

          <div className="mt-5 flex min-w-0 w-full items-center justify-between gap-2 lg:mt-4 [&>*]:min-w-0">
            {steps.map((step, index) => (
              <button
                key={step.n}
                type="button"
                onClick={() => goToStep(index)}
                className={`h-[2px] flex-1 transition-colors ${
                  index <= activeStep ? "bg-on-plum-strong" : "bg-on-plum-soft/30"
                }`}
                aria-label={`Ir para item ${step.n}`}
                aria-current={index === activeStep ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
