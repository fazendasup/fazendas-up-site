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
import { getSiteImage } from "@/content/siteImages";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { motionEnterFromBelow } from "@/lib/motionEntrance";

const APP_URL = "https://app.fazendasup.com.br/";
/** Hero /operacao: DSC_9912 (upload em client/public/uploads). */
const OPERACAO_HERO_PHOTO = getSiteImage("technologyStep4");

const pillars = [
  {
    icon: Layers3,
    title: "O desenho do cultivo na tela",
    body: "Torre, bancada ou fileira de microverdes vira mapa na tela, com posições e lotes. Quem está na mão na massa e quem coordena passam a falar a mesma língua.",
  },
  {
    icon: Droplets,
    title: "Solução e irrigação com histórico",
    body: "EC, pH, irrigação e anotações com data e hora. Ajuda a corrigir na hora, a lembrar o que deu certo e a mostrar o rastro do que a planta recebeu quando precisar conferir.",
  },
  {
    icon: ClipboardList,
    title: "Tarefas que saem do vácuo",
    body: "O que precisa ser feito hoje, por quem e em qual área. Menos combinado solto no corredor, mais registro do que já foi executado.",
  },
  {
    icon: Sprout,
    title: "Da germinação à colheita",
    body: "Planejamento de lotes, bandejas em fase e colheita contínua no mesmo fluxo. Produção, venda e laboratório enxergam o mesmo calendário de cultivo.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados só seus",
    body: "Cada produtor ou unidade vê só o próprio cultivo e os próprios números. Cliente diferente, ambiente separado.",
  },
  {
    icon: RefreshCw,
    title: "Evolução sem quebrar o turno",
    body: "Novidades chegam organizadas. O que a equipe já domina tende a seguir familiar, sem jogar o dia a dia da estufa no ar.",
  },
];

const mainScreens: {
  title: string;
  body: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    title: "Início",
    body: "Tela de chegada: resumo da unidade, atalhos para o que está crítico e leituras recentes. Serve para alinhar quem acabou de entrar no turno.",
    icon: LayoutDashboard,
  },
  {
    title: "Hoje",
    body: "O que não pode esperar, combinados da equipe e alertas. Quem está na bancada ou na casa de máquinas vê o foco do dia sem depender de correr atrás de mensagem.",
    icon: CalendarClock,
  },
  {
    title: "Cultivo em estrutura",
    body: "Ficha de cada posto hidropônico (coluna, mesa ou linha de microverdes): desenho, lotes ativos e observação de campo. É onde o físico encontra o registrado.",
    icon: Building2,
  },
  {
    title: "Germinação",
    body: "Bandejas, variedades e fase do material vivo até esse material entrar no fluxo principal de produção.",
    icon: Sprout,
  },
  {
    title: "Tarefas",
    body: "Fila de serviço com responsável e andamento. Fecha pendência com registro, não só com conversa.",
    icon: ListChecks,
  },
  {
    title: "Planejamento",
    body: "Calendário de colheitas e lotes para encaixar produção em venda ou laboratório, com menos planilha solta.",
    icon: CalendarDays,
  },
  {
    title: "Estoque",
    body: "Entradas e saídas de insumos quando o módulo estiver ativo no projeto, somando substrato, nutrientes e o mais que vocês cadastrarem.",
    icon: Package,
  },
  {
    title: "Manutenção",
    body: "Quebra, preventiva e o que já foi mexido. Ajuda a justificar parada e a não repetir o mesmo diagnóstico.",
    icon: Wrench,
  },
  {
    title: "Inteligência e visão",
    body: "Indicadores e alertas. Com câmera ou sensores, dá para vistoriar o ambiente do cultivo sem abrir toda hora a porta da estufa.",
    icon: Brain,
  },
  {
    title: "Automação",
    body: "Rotinas repetitivas que o sistema pode assumir, com a equipe definindo regra e prioridade.",
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
          <section className="relative isolate min-h-[min(92dvh,46rem)] w-full overflow-hidden bg-ink pb-12 pt-24 text-paper md:min-h-[min(90dvh,52rem)] md:pb-16 md:pt-28">
            {/* Foto em destaque: véu só na base + leve sombra à esquerda (sem caixa largura total). */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <img
                src={OPERACAO_HERO_PHOTO}
                alt=""
                width={1600}
                height={1067}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[center_38%] md:object-[center_32%]"
              />
              {/* Escurece só a parte inferior (cinema / editorial): o topo da foto fica quase limpo. */}
              <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/78 via-black/35 to-transparent md:h-[52%] md:from-black/72 md:via-black/28" />
              {/* Reforço discreto no canto inferior esquerdo, onde está o texto (estreito). */}
              <div
                className="absolute bottom-0 left-0 h-[52%] w-[min(100%,34rem)] bg-gradient-to-tr from-black/50 to-transparent md:h-[48%] md:w-[min(100%,30rem)]"
                aria-hidden
              />
              {/* Topo: leve vinheta para o header não “flutuar” em claridade máxima (bem suave). */}
              <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black/25 to-transparent md:h-[22%] md:from-black/20" />
            </div>

            <div className="container relative z-10 mx-auto flex min-h-[min(78dvh,34rem)] max-w-full flex-col justify-end px-4 pb-10 pt-6 md:min-h-[min(82dvh,44rem)] md:justify-end md:pb-14 md:pt-8">
              {/* Coluna estreita + vidro leve: não cobre a largura da tela; a foto respira à direita e acima. */}
              <div className="w-full max-w-[min(100%,26.5rem)] rounded-xl border border-white/12 bg-black/28 px-5 py-6 shadow-lg shadow-black/20 ring-1 ring-white/[0.06] backdrop-blur-[14px] supports-[backdrop-filter]:bg-black/22 sm:max-w-xl sm:px-7 sm:py-7 md:max-w-[28rem] md:px-8 md:py-8">
                <p className="eyebrow mb-5 inline-flex max-w-full flex-wrap items-center gap-3 text-paper">
                  <span className="h-px w-10 shrink-0 bg-paper/60" />
                  <span className="min-w-0 font-medium tracking-wide">Painel de operação, Fazendas Up</span>
                </p>
                <h1 className="display-head hyphens-none mb-6 max-w-full text-paper text-[clamp(1.75rem,min(4.5vw+0.5rem,6.5vw),3.15rem)] leading-[1.08] md:text-[clamp(2rem,3.6vw,3.35rem)] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                  O supervisório que transforma <em className="text-brand-rose not-italic">o cultivo em painel</em> e painel
                  em decisão.
                </h1>
                <p className="mb-6 max-w-full text-[1.02rem] font-light leading-[1.78] text-paper md:text-[1.08rem] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                  Você produz hidroponia em formatos diferentes: torre, bancada, microverdes ou outro arranjo que a unidade
                  use. O painel junta o que importa no turno: leituras da solução, tarefas, lotes e histórico do cultivo.
                  Quem está na operação deixa de espalhar informação em papéis e grupos soltos; quem decide enxerga o
                  mesmo recorte.
                </p>
                <p className="mb-8 max-w-full text-[0.96rem] leading-[1.75] text-paper/95 md:text-[1.01rem] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                  A rotina da operação roda em{" "}
                  <strong className="rounded px-1.5 py-0.5 font-semibold text-white tabular-nums ring-1 ring-white/15 [text-shadow:none] bg-white/10">
                    app.fazendasup.com.br
                  </strong>
                  . Este site apresenta a Fazendas Up. Na app a equipe registra irrigação, lotes e encerramento do dia.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <LoginCta />
                  <p className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-paper/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                    Acesso com conta segura
                  </p>
                </div>
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
                  manutenção, planejamento e números. Tudo num painel pensado para quem alterna entre mão na massa e
                  gestão.
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
                  Do que acontece na estufa ao que aparece na tela
                </h2>
                <p className="mt-4 max-w-2xl text-[1.02rem] leading-[1.72] text-ink/70">
                  A seguir, o que o sistema reforça para segurar operação e gestão juntas: mapa do cultivo, registro da
                  solução, tarefas com dono, fluxo até a colheita e dados separados por cliente.
                </p>
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
                  O que você encontra ao abrir a app
                </h2>
                <p className="mt-4 text-[1.02rem] leading-[1.72] text-ink/70">
                  Cada bloco descreve uma área comum do menu. Nem todo módulo fica visível para todo mundo: depende do que
                  a administração liberou e do tipo de acesso da sua conta.
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
                Também existem telas restritas para quem configura ciclos, capacidade, relatórios e quem pode acessar o
                sistema, sempre com permissão própria, para não expor informação sensível a quem não precisa ver.
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
