/**
 * Página institucional do supervisório operacional (stack fazendas-up-processo):
 * explicação técnica + tom lúdico; CTA para login na app em produção.
 */
import { motion } from "framer-motion";
import {
  ClipboardList,
  Cpu,
  Droplets,
  Layers3,
  LineChart,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Link } from "wouter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { motionEnterFromBelow } from "@/lib/motionEntrance";

const APP_URL = "https://app.fazendasup.com.br/";

const pillars = [
  {
    icon: Layers3,
    title: "Torres, perfis e geometria",
    body: "Cada nível da fazenda vertical mapeado: torres, bancadas, furos e módulos — o desenho físico traduzido em dados que a equipa consulta sem adivinhar.",
  },
  {
    icon: Droplets,
    title: "Ciclo hidropônico com memória",
    body: "EC, pH, irrigação e registros ligados ao tempo: o sistema guarda o histórico do que a planta recebeu, para auditar decisões e repetir o que funcionou.",
  },
  {
    icon: ClipboardList,
    title: "Tarefas e agenda do dia",
    body: "O supervisório organiza o operacional: o que entra hoje, quem faz o quê e em que contexto — menos post-it, mais fluxo.",
  },
  {
    icon: Sprout,
    title: "Germinação ao prato",
    body: "Da semente à colheita contínua: planejamento, lotes, prontas para colheita e KPIs — a narrativa da produção num só lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-projeto, isolado",
    body: "Autenticação, papéis e isolamento por projeto: cada cliente ou unidade vê só o seu universo — regra de ouro para SaaS e conformidade.",
  },
  {
    icon: Cpu,
    title: "Stack que escala com a equipa",
    body: "React, tRPC e API tipada sobre base relacional (Drizzle): menos surpresas em produção, mais velocidade para evoluir features sem quebrar o que já roda.",
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
          {/* Faixa hero escura — header transparente legível como na home */}
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
                <span className="min-w-0">Software de operação · Fazendas Up</span>
              </p>
              <h1 className="display-head hyphens-none mb-6 max-w-full text-paper text-[clamp(1.85rem,min(5vw+0.6rem,7vw),3.4rem)] leading-[1.08] md:max-w-4xl md:text-[clamp(2.2rem,4vw,3.75rem)]">
                O supervisório que transforma{" "}
                <em className="text-brand-rose not-italic">torre em painel</em> — e painel em decisão.
              </h1>
              <p className="mb-10 max-w-full text-[1.05rem] font-light leading-[1.75] text-paper/85 md:max-w-2xl md:text-[1.12rem]">
                Plataforma web para acompanhar a fazenda vertical hidropónica: cultivo, medições, tarefas e rastreabilidade.
                Pense nela como o cockpit da operação — séria o suficiente para auditoria, humana o suficiente para o turno de
                manhã.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <LoginCta />
                <p className="text-[0.78rem] uppercase tracking-[0.22em] text-paper/50">
                  Login seguro · app.fazendasup.com.br
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
                  Monitoriza e gere a operação da unidade — torres, ciclos, tarefas, manutenções, planejamento e indicadores —
                  com uma camada de software pensada para quem trabalha de luvas e de teclado ao mesmo tempo.
                </p>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-20">
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
                        <h3 className="mb-2 font-medium text-ink text-[1.05rem] leading-snug md:text-[1.08rem]">{p.title}</h3>
                        <p className="text-[0.97rem] leading-[1.72] text-ink/70">{p.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-t border-ink/10 bg-secondary/40 py-14 md:py-16">
            <div className="container flex min-w-0 flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="min-w-0 max-w-xl">
                <div className="mb-2 flex items-center gap-2 text-forest">
                  <LineChart className="size-5 shrink-0" aria-hidden />
                  <span className="text-[0.8rem] font-medium uppercase tracking-[0.18em] text-ink/60">Pronto quando tu estiveres</span>
                </div>
                <p className="text-[1.08rem] leading-[1.7] text-ink md:text-[1.12rem]">
                  A app vive em <strong className="font-medium text-forest">app.fazendasup.com.br</strong> — leva o teu
                  acesso, continua o turno. O site fica para contar a história; a plataforma fica para correr a operação.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="shrink-0 rounded-full border-forest/80 bg-paper px-8 text-forest hover:bg-forest hover:text-paper"
              >
                <a href={APP_URL} target="_blank" rel="noopener noreferrer">
                  Entrar na plataforma
                </a>
              </Button>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <Link
                href="/"
                className="text-[0.95rem] text-forest underline-offset-4 hover:underline"
              >
                ← Voltar ao site institucional
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
