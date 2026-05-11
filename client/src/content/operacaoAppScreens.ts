/**
 * Telas da app na página /operacao.
 * Capturas: ficheiros `client/public/uploads/operacao/{slug}.webp` ou `.png`
 * (mesmo `slug` que abaixo). Proporção sugerida ~16:10, recorte superior para ver UI.
 */
export const operacaoAppScreens = [
  {
    slug: "inicio",
    title: "Início",
    path: "/",
    caption:
      "Retrato da unidade depois do login: atalhos para postos de cultivo, resumo e alertas sem abrir dez separadores.",
  },
  {
    slug: "hoje",
    title: "Hoje",
    path: "/hoje",
    caption: "Prioridades e compromissos do turno numa só leitura, para ninguém correr a perguntar o que é urgente.",
  },
  {
    slug: "estrutura",
    title: "Cultivo em estrutura",
    path: "/torre/:id, /bancada/:id",
    caption:
      "Ficha de cada posto hidropónico (coluna, mesa ou linha de microverdes): geometria, lotes e notas. As rotas /torre e /bancada seguem o tipo de projeto.",
  },
  {
    slug: "germinacao",
    title: "Germinação",
    path: "/germinacao",
    caption: "Entrada do material vivo: bandejas, variedades e estados até integrarem o fluxo com registo.",
  },
  {
    slug: "tarefas",
    title: "Tarefas",
    path: "/tarefas",
    caption: "Trabalho aberto, responsáveis e estados: fila com registo em vez de fio de mensagens soltas.",
  },
  {
    slug: "planejamento",
    title: "Planejamento",
    path: "/planejamento",
    caption: "Calendário de colheita contínua, lotes e encaixe no tempo para alinhar produção com vendas ou laboratório.",
  },
  {
    slug: "estoque",
    title: "Estoque",
    path: "/estoque",
    caption: "Insumos e movimentos quando o módulo está ligado ao projeto: ver para onde foi cada saco ou nutriente.",
  },
  {
    slug: "manutencao",
    title: "Manutenção",
    path: "/manutencao",
    caption: "Avarias, preventivas e histórico: menos diagnósticos repetidos, mais justificação de paragens.",
  },
  {
    slug: "inteligencia",
    title: "Inteligência e visão",
    path: "/inteligencia, /visao",
    caption: "Dados e sugestões; visão do cultivo com câmara e sensores quando existem, sem abrir todas as portas.",
  },
  {
    slug: "automacao",
    title: "Automação",
    path: "/automacao",
    caption: "Rotinas que aliviam cliques repetitivos, com humano no comando do que é estratégico.",
  },
] as const;
