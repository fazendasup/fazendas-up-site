/**
 * Página institucional do supervisório: pilares (capacidades) + itens da app em texto.
 */
import { motion } from "framer-motion";
import {
  Brain,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Droplets,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Package,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { motionEnterFromBelow } from "@/lib/motionEntrance";

const APP_URL = "https://app.fazendasup.com.br/";

const pillars = [
  {
    icon: Layers3,
    title: "Cultivo desenhado na tela",
    body: "Torre, mesa ou furos na bandeja. O arranjo físico fica registrado para toda a equipe ver do mesmo jeito, sem ficar adivinhando no corredor.",
  },
  {
    icon: Droplets,
    title: "Água e solução com histórico",
    body: "EC, pH, irrigação e anotações com data e hora. Fica guardado o que a planta recebeu, para lembrar o que deu certo e ajustar com segurança.",
  },
  {
    icon: ClipboardList,
    title: "Tarefas e agenda do dia",
    body: "Organiza o operacional: o que entra hoje, quem faz o quê e em qual contexto. Menos papel solto, mais ritmo no turno.",
  },
  {
    icon: Sprout,
    title: "Germinação até a colheita",
    body: "Da semente à colheita contínua: planejamento, lotes, bandejas prontas para colheita e números do dia a dia. A história da produção em um só lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Cada produtor no seu espaço",
    body: "Cada produtor ou unidade vê só o seu cultivo e os seus dados, sem misturar informação com outro cliente.",
  },
  {
    icon: RefreshCw,
    title: "Acompanha seu crescimento",
    body: "Novidades chegam de forma ordenada. O que já funcionava no seu dia a dia tende a se manter estável, sem sustos na estufa.",
  },
];

const mainScreens: {
  title: string;
  body: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    title: "Início",
    body: "Depois de entrar, você vê o retrato da unidade: atalhos para onde está o cultivo, o que precisa de atenção e o resumo do dia.",
    icon: LayoutDashboard,
  },
  {
    title: "Hoje",
    body: "O que é prioridade agora, compromissos da equipe e alertas num só olhar, sem precisar perguntar para todo mundo.",
    icon: CalendarClock,
  },
  {
    title: "Cultivo em estrutura",
    body: "Cada posto hidropônico (coluna, mesa ou linha de microverdes) com a sua ficha: desenho da estrutura, lotes e anotações da operação.",
    icon: Building2,
  },
  {
    title: "Germinação",
    body: "Bandejas novas, variedades e estados. Controle do material vivo até integrar no resto da produção.",
    icon: Sprout,
  },
  {
    title: "Tarefas",
    body: "Lista de trabalhos da equipe, com quem faz o quê. Ajuda a fechar pendências com registro, sem depender só de mensagem solta.",
    icon: ListChecks,
  },
  {
    title: "Planejamento",
    body: "Calendário de colheitas, lotes e prazos para alinhar produção com vendas ou laboratório, sem planilha perdida.",
    icon: CalendarDays,
  },
  {
    title: "Estoque",
    body: "Quando esta parte está ligada ao seu projeto, você vê entradas e saídas de insumos: substrato, nutrientes e o que mais cadastrarem.",
    icon: Package,
  },
  {
    title: "Manutenção",
    body: "Avarias, revisões e o histórico do que já foi feito. Ajuda a explicar paradas e não repetir o mesmo diagnóstico.",
    icon: Wrench,
  },
  {
    title: "Inteligência e visão",
    body: "Números e sugestões. Quando há câmera ou sensores, dá para acompanhar o ambiente do cultivo sem abrir portas à toa.",
    icon: Brain,
  },
  {
    title: "Automação",
    body: "Rotinas que poupam trabalho repetido, com a equipe decidindo o que é importante.",
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
                <span className="min-w-0">Painel de operação, Fazendas Up</span>
              </p>
              <h1 className="display-head hyphens-none mb-6 max-w-full text-paper text-[clamp(1.85rem,min(5vw+0.6rem,7vw),3.4rem)] leading-[1.08] md:max-w-4xl md:text-[clamp(2.2rem,4vw,3.75rem)]">
                O supervisório que passa <em className="text-brand-rose not-italic">o cultivo em painel</em> e painel em
                decisão.
              </h1>
              <p className="mb-8 max-w-full text-[1.05rem] font-light leading-[1.75] text-paper/85 md:max-w-2xl md:text-[1.12rem]">
                Plataforma na internet para acompanhar sua operação hidropônica em vários formatos, como fazenda vertical,
                bancadas tradicionais, microverdes ou o que a administração da unidade tiver ligado. Medições da solução,
                tarefas da equipe e rastreamento do cultivo em um só lugar. Feita para quem vive entre bandejas e celular,
                sem perder o fio da meada.
              </p>
              <p className="mb-10 max-w-full text-[0.98rem] leading-[1.72] text-paper/75 md:max-w-2xl">
                O dia a dia roda em <strong className="font-medium text-paper">app.fazendasup.com.br</strong>. Este site
                apresenta a marca e o contexto. Na app você registra irrigação, anotações e encerra o turno.
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
                  Acompanha e gerencia o dia a dia da unidade: onde está o cultivo, ciclos da solução, tarefas da equipe,
                  manutenção, planejamento e números. Tudo num painel pensado para quem alterna entre luvas e celular ou
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
                  Principais telas e o que cada uma resolve
                </h2>
                <p className="mt-4 text-[1.02rem] leading-[1.72] text-ink/70">
                  A lista espelha as partes principais do supervisório. Alguns itens só aparecem se a administração da
                  unidade tiver ligado o módulo ou se o seu login tiver permissão.
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
                      </div>
                      <h3 className="mb-2 font-medium text-ink text-[1.08rem] leading-snug">{s.title}</h3>
                      <p className="text-[0.95rem] leading-[1.72] text-ink/72">{s.body}</p>
                    </motion.article>
                  );
                })}
              </div>

              <p className="mt-12 max-w-3xl text-[0.92rem] leading-[1.7] text-ink/60">
                Existem também áreas só para quem administra o sistema por dentro, como ciclos, configurações, capacidade,
                relatórios e quem pode entrar no painel, sempre com permissão própria, para não expor dados sensíveis para
                toda a equipe.
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
