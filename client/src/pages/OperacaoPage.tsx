/**
 * Página institucional do supervisório (fazendas-up-processo): telas reais + CTA para app.fazendasup.com.br
 */
import { motion } from "framer-motion";
import {
  Brain,
  Building2,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Package,
  SlidersHorizontal,
  Sprout,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { motionEnterFromBelow } from "@/lib/motionEntrance";

const APP_URL = "https://app.fazendasup.com.br/";

/** Funcionalidades alinhadas às rotas do app em produção (nomes podem variar por projeto ou perfil). */
const mainScreens: {
  title: string;
  path: string;
  body: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    title: "Início",
    path: "/",
    body: "Depois do login, isto é o retrato da unidade: acesso rápido a torres e bancadas, resumo do cultivo e ganchos para o que está a correr mal ou bem.",
    icon: LayoutDashboard,
  },
  {
    title: "Hoje",
    path: "/hoje",
    body: "O turno começa aqui: prioridades, compromissos e alertas numa única leitura, para ninguém precisar de correr salas a perguntar “o que é urgente”.",
    icon: CalendarClock,
  },
  {
    title: "Torres e bancadas",
    path: "/torre/:id, /bancada/:id",
    body: "Cada torre ou bancada hidropónica tem ficha própria: geometria, furos, lotes ativos e notas da operação. É o mapa detalhado de quem trata de plantas reais.",
    icon: Building2,
  },
  {
    title: "Germinação",
    path: "/germinacao",
    body: "Controla a entrada do material vivo: bandejas, variedades e estados até passarem para o resto do fluxo com registo.",
    icon: Sprout,
  },
  {
    title: "Tarefas",
    path: "/tarefas",
    body: "Lista trabalho aberto, responsáveis e estados. Troca o caos do grupo de WhatsApp por uma fila que se pode filtrar e fechar com registo.",
    icon: ListChecks,
  },
  {
    title: "Planejamento",
    path: "/planejamento",
    body: "Calendário de colheita contínua, lotes e encaixe no tempo. Serve para alinhar produção com janelas de venda ou laboratório sem folha partilhada perdida.",
    icon: CalendarDays,
  },
  {
    title: "Estoque",
    path: "/estoque",
    body: "Quando o módulo está ligado ao projecto, mostra insumos e movimentos. Ajuda a explicar “onde foi parar” cada saco de substrato ou nutriente.",
    icon: Package,
  },
  {
    title: "Manutenção",
    path: "/manutencao",
    body: "Registo de avarias, preventivas e o que já se fez. Bom para não repetir diagnósticos e para justificar paragens perante quem gere números.",
    icon: Wrench,
  },
  {
    title: "Inteligência e visão",
    path: "/inteligencia, /visao",
    body: "Inteligência junta dados e sugestões; Visão do cultivo usa câmara e sensores quando existem, para ver o ambiente sem abrir todas as portas.",
    icon: Brain,
  },
  {
    title: "Automação",
    path: "/automacao",
    body: "Rotinas e regras que aliviam cliques repetitivos. Automatiza o chato, deixa sempre um humano no comando do que é estratégico.",
    icon: SlidersHorizontal,
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
                O supervisório que passa <em className="text-brand-rose not-italic">torre em painel</em> e painel em decisão.
              </h1>
              <p className="mb-8 max-w-full text-[1.05rem] font-light leading-[1.75] text-paper/85 md:max-w-2xl md:text-[1.12rem]">
                Plataforma web para acompanhar a fazenda vertical hidropónica em Manaus: cultivo, medições, tarefas e
                rastreabilidade num só sítio. Pensámos para equipas que passam o dia entre bandejas e ecrã, sem perder o
                fio à meada.
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
              <div className="mb-12 max-w-3xl">
                <p className="eyebrow mb-3 inline-flex items-center gap-3 text-muted-foreground">
                  <span className="h-px w-9 bg-forest/40" />
                  Dentro da aplicação
                </p>
                <h2 className="display-head text-[clamp(1.5rem,3.2vw,2.25rem)] leading-tight text-ink">
                  Principais telas e o que cada uma resolve
                </h2>
                <p className="mt-4 text-[1.02rem] leading-[1.72] text-ink/70">
                  A lista espelha as rotas principais do sistema supervisório (stack React, tRPC e base relacional).
                  Alguns módulos só aparecem se o administrador os ativar ou se o teu utilizador tiver perfil de admin.
                  Caminhos abaixo são os da app, não desta página.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {mainScreens.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.article
                      key={s.title}
                      {...motionEnterFromBelow()}
                      viewport={{ once: true, margin: "-6% 0px" }}
                      transition={{ duration: 0.65, delay: i * 0.04 }}
                      className="flex min-w-0 flex-col rounded-sm border border-ink/10 bg-secondary/30 p-6 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-ink/10 bg-paper text-forest">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <code className="max-w-[55%] break-all text-right text-[0.7rem] leading-snug text-ink/45">
                          {s.path}
                        </code>
                      </div>
                      <h3 className="mb-2 font-medium text-ink text-[1.08rem] leading-snug">{s.title}</h3>
                      <p className="text-[0.95rem] leading-[1.72] text-ink/72">{s.body}</p>
                    </motion.article>
                  );
                })}
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

              <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-10">
                <LoginCta />
                <p className="text-[0.9rem] text-ink/60">
                  Código e dados sensíveis ficam na app; aqui só ficam palavras para quem ainda não tem acesso.
                </p>
              </div>
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
