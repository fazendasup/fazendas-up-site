/**
 * Página institucional do supervisório: pilares (capacidades) + grelha de capturas da app.
 */
import { motion } from "framer-motion";
import {
  ClipboardList,
  Droplets,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Link } from "wouter";
import { OperacaoScreenCard } from "@/components/OperacaoScreenCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { operacaoAppScreens } from "@/content/operacaoAppScreens";
import { motionEnterFromBelow } from "@/lib/motionEntrance";

const APP_URL = "https://app.fazendasup.com.br/";

const pillars = [
  {
    icon: Layers3,
    title: "Cultivo desenhado no ecrã",
    body: "Torre, mesa ou covas na bandeja: o arranjo físico fica registado para toda a equipa ver da mesma forma, sem adivinhar no corredor.",
  },
  {
    icon: Droplets,
    title: "Água e solução com histórico",
    body: "EC, pH, regas e notas ligadas à data: fica guardado o que a planta recebeu, para lembrar o que correu bem e ajustar com segurança.",
  },
  {
    icon: ClipboardList,
    title: "Tarefas e agenda do dia",
    body: "Organiza o operacional: o que entra hoje, quem faz o quê e em que contexto — menos papel solto, mais ritmo no turno.",
  },
  {
    icon: Sprout,
    title: "Germinação ao prato",
    body: "Da semente à colheita contínua: planejamento, lotes, prontas para colheita e números do dia a dia — a história da produção num só lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Cada um com o seu espaço",
    body: "Cada produtor ou unidade vê só o seu cultivo e os seus dados, sem misturar informação com outro cliente.",
  },
  {
    icon: RefreshCw,
    title: "Acompanha o teu crescimento",
    body: "Novidades chegam de forma ordenada; o que já funcionava no teu dia a dia tende a manter-se estável, sem sobressaltos na estufa.",
  },
];

function LoginCta({ size = "lg" }: { size?: "default" | "lg" }) {
  return (
    <Button
      asChild
      size={size}
      className="rounded-full bg-paper px-8 font-medium text-forest shadow-none hover:bg-clay hover:text-paper"
    >
      <a href={APP_URL} target="_blank" rel="noopener noreferrer">
        Entrar na plataforma
      </a>
    </Button>
  );
}

export default function OperacaoPage() {
  return (
    <div className="relative min-h-screen w-full max-w-full min-w-0 bg-paper text-ink">
      <SiteHeader variant="subpage" />
      <div className="copy-flow min-w-0 w-full max-w-full">
        <main className="fu-main-mobile w-full min-w-0 max-w-full">
          <section className="relative isolate overflow-hidden bg-forest-dark pb-16 pt-28 text-paper md:pb-20 md:pt-32">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(230,31,147,0.35), transparent 42%), radial-gradient(circle at 85% 10%, rgba(120,60,180,0.25), transparent 40%)",
              }}
            />
            <div className="container relative min-w-0">
              <p className="eyebrow mb-6 inline-flex max-w-full flex-wrap items-center gap-3 text-paper/70">
                <span className="h-px w-10 shrink-0 bg-paper/45" />
                <span className="min-w-0">Painel de operação, Fazendas Up</span>
              </p>
              <h1 className="display-head hyphens-none mb-6 max-w-full text-paper text-[clamp(1.85rem,min(5vw+0.6rem,7vw),3.4rem)] leading-[1.08] md:max-w-4xl md:text-[clamp(2.2rem,4vw,3.75rem)]">
                O supervisório que passa <em className="text-brand-rose not-italic">o cultivo em painel</em> e painel em
                decisão.
              </h1>
              <p className="mb-8 max-w-full text-[1.05rem] font-light leading-[1.75] text-paper/85 md:max-w-2xl md:text-[1.12rem]">
                Plataforma na internet para acompanhar a tua operação hidropónica em vários formatos — fazenda vertical,
                bancadas tradicionais, microverdes ou o que a gestão da unidade tiver ligado: medições da solução, tarefas
                da equipa e rastreio do cultivo num só sítio. Feita para quem vive entre bandejas e telemóvel, sem perder o
                fio à meada.
              </p>
              <p className="mb-10 max-w-full text-[0.98rem] leading-[1.72] text-paper/75 md:max-w-2xl">
                O dia a dia corre em{" "}
                <strong className="font-medium text-paper">app.fazendasup.com.br</strong>. Este site apresenta a marca e o
                contexto; na app é que se rega, se aponta e se fecha o turno.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <LoginCta />
                <p className="text-[0.78rem] uppercase tracking-[0.2em] text-paper/50">
                  Acesso com conta segura
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-ink/10 py-16 md:py-20">
            <div className="container min-w-0">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="display-head mb-4 text-[clamp(1.45rem,3.5vw,2rem)] leading-tight text-ink">
                  O que faz, em uma frase
                </h2>
                <p className="text-[1.05rem] leading-[1.75] text-ink/75 md:text-[1.1rem]">
                  Acompanha e gere o dia a dia da unidade — onde está o cultivo, ciclos da solução, tarefas da equipa,
                  manutenção, planeamento e números — num painel pensado para quem alterna entre luvas e telemóvel ou
                  computador.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-ink/10 py-16 md:py-20">
            <div className="container min-w-0">
              <div className="mb-12 max-w-2xl">
                <p className="eyebrow mb-3 inline-flex items-center gap-3 text-muted-foreground">
                  <span className="h-px w-9 bg-forest/40" />
                  Módulos e capacidades
                </p>
                <h2 className="display-head text-[clamp(1.5rem,3.2vw,2.25rem)] leading-tight text-ink">
                  Precisão de laboratório, ritmo de fazenda
                </h2>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12 lg:gap-x-16">
                {pillars.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.title}
                      {...motionEnterFromBelow()}
                      viewport={{ once: true, margin: "-8% 0px" }}
                      transition={{ duration: 0.75, delay: i * 0.06 }}
                      className="flex min-w-0 gap-4"
                    >
                      <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-sm border border-ink/10 bg-secondary/80 text-forest">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="mb-2 font-medium text-ink text-[1.05rem] leading-snug md:text-[1.08rem]">
                          {p.title}
                        </h3>
                        <p className="text-[0.97rem] leading-[1.72] text-ink/70">{p.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-16 md:py-20">
            <div className="container min-w-0">
              <div className="mb-12 max-w-3xl">
                <p className="eyebrow mb-3 inline-flex items-center gap-3 text-muted-foreground">
                  <span className="h-px w-9 bg-forest/40" />
                  Dentro da aplicação
                </p>
                <h2 className="display-head text-[clamp(1.5rem,3.2vw,2.25rem)] leading-tight text-ink">
                  Como a app se vê na prática
                </h2>
                <p className="mt-4 text-[1.02rem] leading-[1.72] text-ink/70">
                  Cada cartão pode trazer uma imagem do painel. O que aparece no teu ecrã depende do que a unidade ligou e
                  do tipo de acesso que tens — nem todas as áreas ficam visíveis para toda a gente.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {operacaoAppScreens.map((s, i) => (
                  <motion.div
                    key={s.slug}
                    {...motionEnterFromBelow()}
                    viewport={{ once: true, margin: "-6% 0px" }}
                    transition={{ duration: 0.65, delay: i * 0.04 }}
                  >
                    <OperacaoScreenCard slug={s.slug} title={s.title} caption={s.caption} />
                  </motion.div>
                ))}
              </div>

              <p className="mt-12 max-w-3xl text-[0.92rem] leading-[1.7] text-ink/60">
                Existem também áreas só para quem gere o sistema por dentro — ciclos, configurações, capacidade, relatórios
                e quem pode entrar no painel — com permissão própria, para não expor dados sensíveis a toda a equipa.
              </p>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <Link href="/" className="text-[0.95rem] text-forest underline-offset-4 hover:underline">
                Voltar ao site institucional
              </Link>
              <a
                href="/#contato"
                className="text-[0.95rem] text-ink/70 underline-offset-4 hover:text-forest hover:underline"
              >
                Falar com a equipe
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
