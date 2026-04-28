/**
 * ScrollProgress — Discreet right-side vertical progress with chapter labels.
 * Adds a sense of "navigation through chapters" without being heavy UI.
 */
import { useNarrowViewport } from "@/hooks/useNarrowViewport";
import { useEffect, useState } from "react";

const chapters = [
  { id: "top", label: "Abertura" },
  { id: "tecnologia", label: "I · Tecnologia" },
  { id: "sustentabilidade", label: "II · Impacto" },
  { id: "produtos", label: "III · Produtos" },
  { id: "sobre", label: "IV · Sobre" },
  { id: "contato", label: "V · Contato" },
];

export function ScrollProgress() {
  const narrow = useNarrowViewport();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("top");

  useEffect(() => {
    if (narrow) return;
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? (h.scrollTop / total) * 100 : 0);

      // Active chapter
      let current = "top";
      for (const c of chapters) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45) current = c.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [narrow]);

  /** Em mobile/tablet não montar — hidden lg:flex ainda pode largar scrollWidth em WebKit */
  if (narrow) return null;

  return (
    <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-3 pointer-events-none">
      {/* Track */}
      <div className="relative w-px h-[40vh] bg-current/15">
        <div
          className="absolute top-0 left-0 w-px bg-current/70 transition-[height] duration-150"
          style={{ height: `${progress}%` }}
        />
      </div>
      {/* Active chapter label */}
      <div className="vertical-text text-[0.65rem] tracking-[0.3em] uppercase opacity-70 mt-3 pointer-events-auto">
        {chapters.find((c) => c.id === active)?.label}
      </div>
    </div>
  );
}
