/**
 * Pré-visualização estática do painel vertical (KPIs + fases), alinhada ao
 * `Home.tsx` do supervisório em fazendas-up-processo (mesmos rótulos,
 * grid e padrões de cartão; valores de exemplo como no painel vazio).
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Layers,
  Leaf,
  Scissors,
  Sprout,
  Target,
  Wrench,
} from "lucide-react";

const KPI_BG: Record<string, string> = {
  emerald: "bg-emerald-500/[0.07] dark:bg-emerald-500/15",
  blue: "bg-sky-500/[0.07] dark:bg-sky-500/15",
  amber: "bg-amber-500/[0.08] dark:bg-amber-500/15",
  red: "bg-red-500/[0.07] dark:bg-red-500/15",
  orange: "bg-orange-500/[0.07] dark:bg-orange-500/15",
};

function SurfacePanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-xl border border-zinc-600/50 bg-zinc-900/85 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_24px_56px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md dark:border-zinc-600/50 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: keyof typeof KPI_BG | "muted";
}) {
  const tint = color === "muted" ? "bg-zinc-800/40" : KPI_BG[color] ?? KPI_BG.emerald;
  return (
    <SurfacePanel className={`p-3.5 ${tint}`}>
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-medium text-zinc-400">{label}</span>
      </div>
      <p className="font-display text-xl font-bold tabular-nums text-zinc-50">{value}</p>
    </SurfacePanel>
  );
}

const FASES_PREVIEW = [
  {
    fase: "mudas" as const,
    label: "🌱 Mudas",
    ec: "1–1.2",
    ph: "5.8–6.2",
    rotuloOperacao: "perfis plantados",
    plantadas: 0,
    unidade: "perfis",
    ocupadas: 0,
    capacidade: 144,
    maturacao: false,
  },
  {
    fase: "vegetativa" as const,
    label: "🌿 Vegetativa",
    ec: "1.5–2",
    ph: "5.5–6.5",
    rotuloOperacao: "furos plantados",
    plantadas: 0,
    unidade: "furos",
    ocupadas: 0,
    capacidade: 3888,
    maturacao: false,
  },
  {
    fase: "maturacao" as const,
    label: "🥬 Maturação",
    ec: "2–2.5",
    ph: "5.8–6.2",
    rotuloOperacao: "",
    plantadas: 0,
    colhidas: 0,
    unidade: "furos",
    ocupadas: 0,
    capacidade: 3888,
    maturacao: true,
  },
];

export type OperacaoDashboardPreviewProps = {
  className?: string;
  /** Texto pequeno no rodapé do mock (desligar quando for só fundo decorativo). */
  showFootnote?: boolean;
  /** Largura máxima padrão; desligar quando o pai controla escala/overflow. */
  contained?: boolean;
};

export function OperacaoDashboardPreview({
  className,
  showFootnote = true,
  contained = true,
}: OperacaoDashboardPreviewProps) {
  return (
    <div
      className={cn(
        "fu-operacao-dashboard-preview w-full text-zinc-100 dark",
        contained && "mx-auto max-w-6xl",
        className,
      )}
      aria-label="Pré-visualização do painel de operação (layout semelhante à app)"
    >
      <div className="space-y-6 rounded-xl border border-zinc-700/60 bg-zinc-950 p-4 sm:p-5">
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-zinc-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/25">
              <BarChart3 className="h-4 w-4" aria-hidden />
            </span>
            Indicadores (KPIs)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KPICard
              icon={<Sprout className="h-4 w-4 text-emerald-400" />}
              label="Cultivo ativo"
              value={0}
              color="emerald"
            />
            <KPICard
              icon={<Target className="h-4 w-4 text-sky-400" />}
              label="Ocupação geral"
              value="0%"
              color="blue"
            />
            <KPICard
              icon={<Scissors className="h-4 w-4 text-amber-400" />}
              label="Prontas Colheita"
              value={0}
              color="amber"
            />
            <KPICard
              icon={<Leaf className="h-4 w-4 text-emerald-400" />}
              label="Taxa Germinação"
              value="–"
              color="emerald"
            />
            <KPICard
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              label="Desperdício"
              value="–"
              color="red"
            />
            <KPICard
              icon={<Wrench className="h-4 w-4 text-orange-400" />}
              label="Manutenções"
              value={0}
              color="orange"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-zinc-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/25">
              <Layers className="h-4 w-4" aria-hidden />
            </span>
            Cultivo por fase
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {FASES_PREVIEW.map((row) => {
              const taxa = row.capacidade > 0 ? Math.round((row.ocupadas / row.capacidade) * 100) : 0;
              return (
                <SurfacePanel
                  key={row.fase}
                  className="flex flex-col overflow-hidden rounded-lg border-zinc-600/60"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-700/50 bg-zinc-900/50 px-2.5 py-1.5">
                    <span className="font-display text-xs font-semibold text-zinc-100">{row.label}</span>
                    <span className="text-right text-[9px] tabular-nums leading-tight text-zinc-500">
                      EC {row.ec} · pH {row.ph}
                    </span>
                  </div>
                  <div className="px-2.5 pb-1.5 pt-2">
                    <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-zinc-500">Em operação</p>
                    {row.maturacao ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-1.5 text-center dark:bg-emerald-950/30">
                          <p className="font-display text-lg font-bold leading-none text-emerald-200 tabular-nums">
                            {row.plantadas}
                          </p>
                          <p className="mt-0.5 text-[9px] leading-tight text-zinc-500">Processo</p>
                        </div>
                        <div className="rounded-md border border-amber-500/25 bg-amber-500/[0.08] px-2 py-1.5 text-center dark:bg-amber-950/30">
                          <p className="font-display text-lg font-bold leading-none text-amber-200 tabular-nums">
                            {row.colhidas ?? 0}
                          </p>
                          <p className="mt-0.5 text-[9px] text-zinc-500">Colhidas</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="font-display text-xl font-bold tabular-nums text-zinc-50">{row.plantadas}</span>
                        <span className="text-[10px] text-zinc-500">{row.rotuloOperacao}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto border-t border-zinc-800/80 bg-zinc-900/40 px-2.5 py-2">
                    <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-zinc-500">Ocupação</p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-lg font-bold tabular-nums text-cyan-400">{taxa}%</span>
                      <span className="text-right text-[10px] tabular-nums leading-tight text-zinc-500">
                        {row.ocupadas}/{row.capacidade} {row.unidade}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-cyan-500/80 transition-[width]"
                        style={{ width: `${Math.min(100, taxa)}%` }}
                      />
                    </div>
                  </div>
                </SurfacePanel>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-zinc-50">
              <span aria-hidden>🌱</span>
              Mudas (1 torre)
            </h2>
            <div className="text-[10px] text-zinc-500">
              <span className="tabular-nums">EC 1–1.2</span>
              <span className="mx-1.5">·</span>
              <span className="tabular-nums">pH 5.8–6.2</span>
            </div>
          </div>
          <SurfacePanel className="overflow-hidden rounded-lg border-zinc-600/60 p-0">
            <div className="border-b border-zinc-800 bg-zinc-900/60 px-3 py-2 font-display text-sm font-semibold text-zinc-100">
              Torre 1
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-3 p-3 sm:gap-4">
              <div className="flex flex-col gap-1 border-r border-zinc-800/80 pr-2 text-right font-mono text-[10px] tabular-nums text-zinc-500">
                {[12, 11, 10, 9, 8, 7].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <div className="flex min-h-[8rem] flex-col justify-center rounded-md border border-dashed border-zinc-700/50 bg-zinc-900/30 p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Totais da torre</p>
                <p className="mt-2 flex items-center justify-center gap-1.5 font-display text-sm font-semibold text-zinc-200">
                  <Sprout className="h-4 w-4 text-emerald-400" aria-hidden />
                  0 em processo
                </p>
              </div>
            </div>
          </SurfacePanel>
        </section>

        {showFootnote ? (
          <p className="text-center text-[10px] text-zinc-500">
            Ilustração estática para o site. Na app os números refletem os dados reais do projeto.
          </p>
        ) : null}
      </div>
    </div>
  );
}
