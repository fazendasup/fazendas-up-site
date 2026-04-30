/**
 * Diagnóstico objetivo de overflow horizontal — não substitui corrigir CSS,
 * mas elimina “adivinhação”: lista elementos que ultrapassam a viewport ou têm scrollWidth interno.
 *
 * Uso (telefone ou desktop): acrescente ?fu_overflow=1 à URL, role a página, toque em “Copiar relatório”.
 */
import { useCallback, useEffect, useState } from "react";

function describe(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  let cls = "";
  if (el instanceof HTMLElement && typeof el.className === "string") {
    const parts = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    cls = parts.length ? `.${parts.join(".")}` : "";
  }
  const section = el.closest("main section[id]")?.id;
  const sec = section ? ` §${section}` : "";
  return `<${tag}${id}${cls}>${sec}`;
}

export function OverflowProbe() {
  const [enabled, setEnabled] = useState(false);
  const [report, setReport] = useState<string>("");

  const run = useCallback(() => {
    const vw = window.innerWidth;
    const docEl = document.documentElement;
    const body = document.body;
    const lines: string[] = [];
    lines.push(
      `innerWidth=${vw} | doc.scrollWidth=${docEl.scrollWidth} | body.scrollWidth=${body.scrollWidth} | Δ=${docEl.scrollWidth - vw}`
    );

    type Hit = { el: HTMLElement; score: number; line: string };
    const hits: Hit[] = [];
    const root = document.getElementById("root");
    if (!root) {
      lines.push("(sem #root)");
      setReport(lines.join("\n"));
      return;
    }

    root.querySelectorAll("*").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const cs = window.getComputedStyle(node);
      if (cs.display === "none" || cs.visibility === "hidden") return;

      const r = node.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return;

      const overflowRight = r.right - vw;
      const overflowLeft = -r.left;
      if (overflowRight > 2) {
        hits.push({
          el: node,
          score: overflowRight + 1000,
          line: `→ direita +${overflowRight.toFixed(0)}px | ${describe(node)}`,
        });
      }
      if (overflowLeft > 2) {
        hits.push({
          el: node,
          score: overflowLeft + 500,
          line: `← esquerda +${overflowLeft.toFixed(0)}px | ${describe(node)}`,
        });
      }

      const sw = node.scrollWidth;
      const cw = node.clientWidth;
      if (cw > 40 && sw > cw + 3) {
        hits.push({
          el: node,
          score: sw - cw,
          line: `filhos largos +${(sw - cw).toFixed(0)}px (scroll) | ${describe(node)}`,
        });
      }
    });

    const best = new Map<HTMLElement, Hit>();
    for (const h of hits) {
      const prev = best.get(h.el);
      if (!prev || h.score > prev.score) best.set(h.el, h);
    }
    const merged = Array.from(best.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 28);
    for (const h of merged) lines.push(h.line);

    if (merged.length === 0)
      lines.push("(nenhum candidato óbvio neste instante — role até ao fim e toque “Medir outra vez”)");

    setReport(lines.join("\n"));
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("fu_overflow");
    if (q !== "1" && q !== "true") return;
    setEnabled(true);
    run();
    window.addEventListener("resize", run);
    const t0 = window.setTimeout(run, 400);
    const t1 = window.setTimeout(run, 1600);
    let idleHandle = 0;
    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => run());
    }
    return () => {
      window.removeEventListener("resize", run);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      if (idleHandle > 0 && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [run]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      /* clipboard pode falhar em HTTP antigo — utilizador copia manualmente */
    }
  }, [report]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2147483647] max-h-[42vh] overflow-auto bg-black/88 px-3 py-2 text-[11px] leading-snug text-white shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-2">
        <span className="font-medium">
          Overflow probe · remova{" "}
          <code className="rounded bg-white/15 px-1">?fu_overflow=1</code> da URL quando terminar
        </span>
        <span className="flex shrink-0 flex-wrap gap-1">
          <button
            type="button"
            className="rounded bg-white/15 px-2 py-1 text-[11px] font-medium hover:bg-white/28"
            onClick={() => run()}
          >
            Medir outra vez
          </button>
          <button
            type="button"
            className="rounded bg-white/20 px-2 py-1 text-[11px] font-medium hover:bg-white/30"
            onClick={copy}
          >
            Copiar relatório
          </button>
        </span>
      </div>
      <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-white/95">{report}</pre>
    </div>
  );
}
