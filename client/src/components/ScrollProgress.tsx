/**
 * ScrollProgress — Discreet right-side vertical progress with chapter labels.
 * Visibilidade: só `lg+` via CSS (`hidden lg:flex` + `data-fu-desktop-only`) para nunca
 * ocupar o ecrã no telemóvel mesmo se o estado JS estiver desalinhado.
 */
import { useEffect, useState } from "react";

const chapters = [
  { id: "top", label: "Abertura" },
  { id: "tecnologia", label: "I · Tecnologia" },
  { id: "impacto", label: "II · Impacto" },
  { id: "cultivos", label: "III · Produtos" },
  { id: "sobre", label: "IV · Sobre" },
  { id: "contato", label: "V · Contato" },
];

const LG = "(min-width: 1024px)";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("top");

  useEffect(() => {
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

    mq.addEventListener("change", attach);
    attach();
    return () => {
      mq.removeEventListener("change", attach);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      data-fu-desktop-only
      className="pointer-events-none fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
    >
      <div className="relative h-[40vh] w-px bg-current/15">
        <div
          className="absolute top-0 left-0 w-px bg-current/70 transition-[height] duration-150"
          style={{ height: `${progress}%` }}
        />
      </div>
      <div className="vertical-text pointer-events-auto mt-3 text-[0.65rem] tracking-[0.3em] uppercase opacity-70">
        {chapters.find((c) => c.id === active)?.label}
      </div>
    </div>
  );
}
