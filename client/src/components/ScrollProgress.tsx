/**
 * ScrollProgress — Discreet right-side vertical progress with chapter labels.
 * Adds a sense of "navigation through chapters" without being heavy UI.
 */
import { useMinLg } from "@/hooks/useMinLg";
import { useEffect, useState } from "react";

const chapters = [
  { id: "top", label: "Abertura" },
  { id: "tecnologia", label: "I · Tecnologia" },
  { id: "sustentabilidade", label: "II · Impacto" },
  { id: "produtos", label: "III · Produtos" },
  { id: "sobre", label: "IV · Sobre" },
  { id: "contato", label: "V · Contato" },
];

const LG = "(min-width: 1024px)";

export function ScrollProgress() {
  const desktopLg = useMinLg();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("top");

  useEffect(() => {
    if (!desktopLg) return;
    const mq = window.matchMedia(LG);
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? (h.scrollTop / total) * 100 : 0);

      let current = "top";
      for (const c of chapters) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45) current = c.id;
      }
      setActive(current);
    };

    const attach = () => {
      window.removeEventListener("scroll", onScroll);
      if (!mq.matches) return;
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    };

    const onMq = () => attach();
    mq.addEventListener("change", onMq);
    attach();
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", onScroll);
    };
  }, [desktopLg]);

  if (!desktopLg) return null;

  return (
    <div className="fixed right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col items-end gap-3 pointer-events-none">
      <div className="relative w-px h-[40vh] bg-current/15">
        <div
          className="absolute top-0 left-0 w-px bg-current/70 transition-[height] duration-150"
          style={{ height: `${progress}%` }}
        />
      </div>
      <div className="vertical-text text-[0.65rem] tracking-[0.3em] uppercase opacity-70 mt-3 pointer-events-auto">
        {chapters.find((c) => c.id === active)?.label}
      </div>
    </div>
  );
}
