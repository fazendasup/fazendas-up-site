import { useCallback, useState } from "react";

type OperacaoScreenCardProps = {
  slug: string;
  title: string;
  caption: string;
};

/**
 * Espera capturas em `client/public/uploads/operacao/{slug}.webp` ou `.png`.
 * Sem ficheiro, mostra estado vazio discreto (nada de imagem partida).
 */
export function OperacaoScreenCard({ slug, title, caption }: OperacaoScreenCardProps) {
  const [phase, setPhase] = useState<"webp" | "png" | "missing">("webp");
  const src =
    phase === "webp"
      ? `/uploads/operacao/${slug}.webp`
      : phase === "png"
        ? `/uploads/operacao/${slug}.png`
        : null;

  const onImgError = useCallback(() => {
    setPhase((p) => (p === "webp" ? "png" : "missing"));
  }, []);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-sm border border-ink/10 bg-secondary/30 shadow-sm">
      <div className="relative aspect-[16/10] w-full min-h-[11rem] bg-ink/[0.04]">
        {src ? (
          <img
            src={src}
            alt={`Imagem da app: ${title}`}
            width={1280}
            height={800}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top"
            onError={onImgError}
          />
        ) : (
          <div className="flex h-full min-h-[11rem] flex-col items-center justify-center gap-1 px-5 py-8 text-center">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink/45">Imagem em preparação</p>
            <p className="max-w-[16rem] text-[0.82rem] leading-snug text-ink/55">
              Brevemente mostramos aqui o ecrã real da app.
            </p>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2 border-t border-ink/10 p-5">
        <h3 className="font-medium text-ink text-[1.05rem] leading-snug">{title}</h3>
        <p className="text-[0.92rem] leading-[1.68] text-ink/72">{caption}</p>
      </div>
    </article>
  );
}
