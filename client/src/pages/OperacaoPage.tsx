/**
 * Página institucional do supervisório: pilares (capacidades) + grelha de capturas da app.
 */
import { motion } from "framer-motion";
import {
  ClipboardList,
  Cpu,
  Droplets,
  Layers3,
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
    title: "Estruturas de cultivo e geometria",
    body: "Cada formato de projeto mapeado no software: postos de cultivo, bancadas, furos e módulos — o desenho físico em dados que a equipa consulta sem adivinhar.",
  },
  {
    icon: Droplets,
    title: "Ciclo hidropónico com memória",
    body: "EC, pH, irrigação e registos ligados ao tempo: histórico do que a planta recebeu, para auditar decisões e repetir o que funcionou.",
  },
  {
    icon: ClipboardList,
    title: "Tarefas e agenda do dia",
    body: "O supervisório organiza o operacional: o que entra hoje, quem faz o quê e em que contexto — menos post-it, mais fluxo.",
  },
  {
    icon: Sprout,
    title: "Germinação ao prato",
    body: "Da semente à colheita contínua: planejamento, lotes, prontas para colheita e indicadores — a narrativa da produção num só lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-projeto, isolado",
    body: "Autenticação, papéis e isolamento por projeto: cada cliente ou unidade vê só o seu universo — regra de ouro para SaaS e conformidade.",
  },
  {
    icon: Cpu,
    title: "Stack que escala com a equipa",
    body: "React, tRPC e API tipada sobre base relacional (Drizzle): menos surpresas em produção, mais velocidade para evoluir funcionalidades sem quebrar o que já roda.",
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
                <span className="min-w-0">Software de operação, Fazendas Up</span>
              </p>
              <h1 className="display-head hyphens-none mb-6 max-w-full text-paper text-[clamp(1.85rem,min(5vw+0.6rem,7vw),3.4rem)] leading-[1.08] md:max-w-4xl md:text-[clamp(2.2rem,4vw,3.75rem)]">
                O supervisório que passa <em className="text-brand-rose not-italic">o cultivo em painel</em> e painel em
                decisão.
              </h1>
              <p className="mb-8 max-w-full text-[1.05rem] font-light leading-[1.75] text-paper/85 md:max-w-2xl md:text-[1.12rem]">
                Plataforma web para acompanhar operações hidropónicas em vários formatos de projeto (fazenda vertical,
                bancadas tradicionais, microverdes e o que o administrador configurar): medições, tarefas e rastreabilidade
                num só sítio. Pensámos para equipas que vivem entre bandejas e ecrã, sem perder o fio à meada.
              </p>
              <p className="mb-10 max-w-full text-[0.98rem] leading-[1.72] text-paper/75 md:max-w-2xl">
                Tudo isto vive em{" "}
                <strong className="font-medium text-paper">app.fazendasup.com.br</strong>. O site institucional explica a
                marca e o contexto. A app é onde a operação corre.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <LoginCta />
                <p className="text-[0.78rem] uppercase tracking-[0.2em] text-paper/50">
                  Login seguro (mesmo domínio da produção)
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
                  Monitoriza e gere a operação da unidade — postos de cultivo, ciclos, tarefas, manutenções, planejamento e
                  indicadores — com software pensado para quem trabalha de luvas e de teclado ao mesmo tempo.
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
                  Telas reais da plataforma
                </h2>
                <p className="mt-4 text-[1.02rem] leading-[1.72] text-ink/70">
                  Cada cartão pode mostrar uma captura do supervisório. Os caminhos são os da app em produção; alguns
                  módulos só aparecem se o administrador os ativar ou se o teu utilizador tiver perfil adequado.
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
                    <OperacaoScreenCard
                      slug={s.slug}
                      title={s.title}
                      path={s.path}
                      caption={s.caption}
                    />
                  </motion.div>
                ))}
              </div>

              <p className="mt-12 max-w-3xl text-[0.92rem] leading-[1.7] text-ink/60">
                Há ainda ecrãs de administração interna, como{" "}
                <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.8rem] text-ink/80">/ciclos</code>,{" "}
                <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.8rem] text-ink/80">/config</code>,{" "}
                <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.8rem] text-ink/80">/capacidade</code>,{" "}
                <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.8rem] text-ink/80">/analytics</code>,{" "}
                <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.8rem] text-ink/80">/usuarios</code> e{" "}
                <code className="rounded bg-ink/5 px-1 py-0.5 text-[0.8rem] text-ink/80">/projetos</code>, reservados a
                perfis com permissão explícita.
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
