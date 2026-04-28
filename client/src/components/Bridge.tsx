/**
 * Bridge — A connective interlude between Hero and Technology.
 * Words reveal one by one as the user scrolls, creating a deliberate moment
 * of pause that elevates the editorial tone.
 */
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const phrase = [
  "Uma",
  "fazenda",
  "vertical,",
  "no",
  "centro",
  "da",
  "maior",
  "floresta",
  "tropical",
  "do",
  "mundo.",
];

function BridgeWord({
  word,
  index,
  total,
  revealProgress,
}: {
  word: string;
  index: number;
  total: number;
  revealProgress: MotionValue<number>;
}) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(revealProgress, [start, end], [0.18, 1]);
  const isAccent = word === "floresta";
  return (
    <motion.span
      style={{ opacity }}
      className={`min-w-0 max-w-full ${isAccent ? "font-display italic text-forest" : ""}`}
    >
      {word}
    </motion.span>
  );
}

export function Bridge() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "end 0.35"],
  });
  const revealProgress = useTransform(scrollYProgress, [0, 0.68], [0, 1]);
  const deckLift = useTransform(revealProgress, [0.25, 0.92], [28, 0]);
  const deckOpacity = useTransform(revealProgress, [0.2, 0.55], [0, 1]);
  const railScaleX = useTransform(revealProgress, [0.15, 0.5], [0.08, 1]);

  return (
    <section
      ref={ref}
      className="relative z-10 -mt-[42px] md:-mt-[62px] bg-paper text-ink overflow-x-hidden overflow-y-visible pt-14 pb-16 md:pt-20 md:pb-24"
    >
      <div className="container min-w-0">
        <div className="flex min-w-0 items-baseline gap-4 mb-8 md:mb-10">
          <span className="font-display italic text-muted-foreground text-[0.95rem]">
            Prólogo
          </span>
          <motion.span
            style={{ scaleX: railScaleX }}
            className="h-px flex-1 bg-ink/15 max-w-[200px] origin-left"
          />
        </div>

        <div className="max-w-full min-w-0 md:max-w-5xl">
          <p className="display-head hyphens-auto max-w-full text-[clamp(1.75rem,5.2vw+0.25rem,4.4rem)] leading-[1.12] md:leading-[1.1] flex flex-wrap gap-x-3 gap-y-1">
            {phrase.map((w, i) => (
              <BridgeWord key={i} word={w} index={i} total={phrase.length} revealProgress={revealProgress} />
            ))}
          </p>
        </div>

        <motion.div
          style={{ opacity: deckOpacity, y: deckLift }}
          className="mt-10 grid min-w-0 grid-cols-12 items-end gap-8 md:mt-14 [&>*]:min-w-0"
        >
          <div className="col-span-12 min-w-0 md:col-span-7 lg:col-span-5 lg:col-start-2">
            <p className="text-[1.0625rem] font-light leading-[1.75] text-ink/70">
              Da semente ao prato, em metros, não em milhares de quilômetros.
              Conheça os princípios que sustentam nossa operação em Manaus.
            </p>
          </div>
          <div className="col-span-12 flex min-w-0 md:col-span-5 md:justify-end lg:col-span-3 lg:col-start-9">
            <span className="font-display text-[0.9rem] italic text-muted-foreground">
              ↓ Capítulo I: Tecnologia
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
