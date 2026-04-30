/**
 * Bridge — A connective interlude between Hero and Technology.
 * Words reveal one by one as the user scrolls, creating a deliberate moment
 * of pause that elevates the editorial tone.
 */
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useMinLg } from "@/hooks/useMinLg";

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

function BridgeWordMotion({
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

/** Mobile: zero Framer neste bloco — evita scrollWidth/layout estranhos. */
function BridgeWordStatic({ word }: { word: string }) {
  const isAccent = word === "floresta";
  return (
    <span
      className={`min-w-0 max-w-full ${isAccent ? "font-display italic text-forest" : ""}`}
    >
      {word}
    </span>
  );
}

export function Bridge() {
  const ref = useRef<HTMLElement>(null);
  const desktopLg = useMinLg();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "end 0.35"],
  });
  const revealProgress = useTransform(scrollYProgress, [0, 0.68], [0, 1]);
  const deckOpacity = useTransform(revealProgress, [0.2, 0.55], [0, 1]);
  const railScaleX = useTransform(revealProgress, [0.15, 0.5], [0.08, 1]);

  return (
    <section
      ref={ref}
      className="relative z-10 isolate -mt-[42px] w-full max-w-full min-w-0 overflow-x-visible overflow-y-visible bg-paper text-ink pt-14 pb-16 md:-mt-[62px] md:pt-20 md:pb-24"
    >
      <div className="container min-w-0">
        <div className="flex min-w-0 items-baseline gap-4 mb-8 md:mb-10">
          <span className="font-display italic text-muted-foreground text-[0.95rem]">
            Prólogo
          </span>
          {!desktopLg ? (
            <span className="h-px max-w-[200px] flex-1 bg-ink/15" aria-hidden />
          ) : (
            <motion.span
              style={{ scaleX: railScaleX }}
              className="h-px max-w-[200px] flex-1 origin-left bg-ink/15"
            />
          )}
        </div>

        <div className="max-w-full min-w-0">
          <p className="display-head hyphens-none max-w-full text-[clamp(1.75rem,5.2vw+0.25rem,4.4rem)] leading-[1.12] md:leading-[1.1] flex flex-wrap gap-x-3 gap-y-1">
            {phrase.map((w, i) =>
              desktopLg ? (
                <BridgeWordMotion
                  key={i}
                  word={w}
                  index={i}
                  total={phrase.length}
                  revealProgress={revealProgress}
                />
              ) : (
                <BridgeWordStatic key={i} word={w} />
              )
            )}
          </p>
        </div>

        {desktopLg ? (
          <motion.div
            style={{ opacity: deckOpacity }}
            className="mt-10 grid min-w-0 grid-cols-1 items-end gap-8 md:grid-cols-12 md:mt-14 [&>*]:min-w-0"
          >
            <div className="col-span-full min-w-0 md:col-span-7 lg:col-span-5 lg:col-start-2">
              <p className="text-[1.0625rem] font-light leading-[1.75] text-ink/70">
                Da semente ao prato, em metros, não em milhares de quilômetros.
                Conheça os princípios que sustentam nossa operação em Manaus.
              </p>
            </div>
            <div className="col-span-full flex min-w-0 md:col-span-5 md:justify-end lg:col-span-3 lg:col-start-9">
              <span className="font-display text-[0.9rem] italic text-muted-foreground">
                ↓ Capítulo I: Tecnologia
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="mt-10 grid min-w-0 grid-cols-1 items-end gap-8 md:grid-cols-12 md:mt-14 [&>*]:min-w-0">
            <div className="col-span-full min-w-0 md:col-span-7 lg:col-span-5 lg:col-start-2">
              <p className="text-[1.0625rem] font-light leading-[1.75] text-ink/70">
                Da semente ao prato, em metros, não em milhares de quilômetros.
                Conheça os princípios que sustentam nossa operação em Manaus.
              </p>
            </div>
            <div className="col-span-full flex min-w-0 md:col-span-5 md:justify-end lg:col-span-3 lg:col-start-9">
              <span className="font-display text-[0.9rem] italic text-muted-foreground">
                ↓ Capítulo I: Tecnologia
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
