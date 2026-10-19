export class PortalError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ClienteSessao = {
  nome: string;
  email: string;
  cnpj: string | null;
  documento?: string | null;
  perfil?: "empresa" | "pessoa";
  vinculado: boolean;
  recorrente?: boolean;
};

export type ProgramacaoPortal = {
  minimoReais: number;
  dias: Array<{
    diaSemana: number;
    itens: Array<{ produtoId: string; nome: string; quantidade: number; preco: number | null; peso?: string | null }>;
  }>;
  proximas: Array<{ data: string; diaSemana: number; total: number }>;
  mantidas?: number;
};

export type EquipeSessao = {
  nome: string;
  email: string | null;
};

export type ProdutoLoja = {
  id: string;
  nome: string;
  grupo: string;
  descricao: string;
  aplicacao: string;
  preco: number | null;
  precoEspecial: boolean;
  imagemUrl: string | null;
  unidade: string;
  /** Embalagem ou venda por kg, ex.: "100 g", "por kg". */
  peso?: string | null;
  estoque: number | null;
};

export type ProdutoEquipe = {
  id: string;
  nome: string;
  categoria: string | null;
  grupo: string;
  descricao: string;
  aplicacao: string;
  naLoja: boolean;
  exclusivo: boolean;
  preco: number | null;
  imagemUrl: string | null;
  unidade: string;
  peso?: string | null;
  estoque: number | null;
};

export type CadastroConta = {
  nome: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  contato: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  inscricaoEstadual: string;
};

export type ContaPortal = {
  cadastro: CadastroConta;
  minimoReais: number;
  aviso?: string | null;
  contrato: {
    versao: string;
    texto: string;
    status: string;
    aceite: {
      aceitoEm: string;
      representanteNome: string;
      representanteCpf: string;
      representanteEmail: string;
      ip: string;
      userAgent: string;
    } | null;
  } | null;
};

export type CadastroEmpresa = {
  nome: string;
  nomeFantasia?: string;
  cnpj: string;
  email: string;
  telefone: string;
  contato: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  inscricaoEstadual?: string;
};

export type PedidoPagamento = {
  status: string;
  pixUrl: string | null;
  cartaoUrl: string | null;
  total: number | null;
  formaPagamento?: "pix" | "cartao" | null;
};

export type PedidoCliente = {
  id: string;
  dataEntrega: string;
  status: string;
  programado?: boolean;
  doSite?: boolean;
  pessoa?: boolean;
  pagamento?: PedidoPagamento | null;
  itens: Array<{ nome: string; quantidade: number; preco: number | null; peso?: string | null }>;
};

export type CadastroPessoa = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
};

export type TituloCliente = {
  id: string;
  descricao: string;
  vencimento: string | null;
  pagamento: string | null;
  status: string;
  valor: number;
  emAberto: number;
  pago: number;
  referencia: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/portal${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "X-Portal-Request": "1",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new PortalError(0, "Não foi possível falar com o sistema da fazenda.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new PortalError(response.status, data.error || "Não foi possível concluir agora.");
  }
  return data as T;
}

export const portalApi = {
  regras: () =>
    request<{ minimoReais: number; primeiraData: string; datas: string[] }>("/regras"),
  sessao: () => request<{ cliente: ClienteSessao | null; equipe: EquipeSessao | null }>("/sessao"),
  entrar: (documento: string, senha: string) =>
    request<{ cliente: ClienteSessao; senhaInicial?: boolean }>("/entrar", {
      method: "POST",
      body: JSON.stringify({ documento, senha }),
    }),
  alterarSenha: (senhaAtual: string, senhaNova: string) =>
    request<{ ok: boolean }>("/senha", {
      method: "POST",
      body: JSON.stringify({ senhaAtual, senhaNova }),
    }),
  sair: () => request<{ ok: boolean }>("/sair", { method: "POST" }),
  ativar: (token: string, senha: string) =>
    request<{ cliente: ClienteSessao }>("/convite/ativar", {
      method: "POST",
      body: JSON.stringify({ token, senha }),
    }),
  vitrine: () =>
    request<{ minimoReais: number; datas: string[]; itens: ProdutoLoja[] }>("/vitrine"),
  conta: () => request<ContaPortal>("/conta"),
  salvarConta: (body: CadastroConta) =>
    request<ContaPortal & { aviso: string | null }>("/conta", { method: "PATCH", body: JSON.stringify(body) }),
  aceitarContrato: (body: { representanteNome: string; representanteCpf: string; representanteEmail: string; liEAceito: true }) =>
    request<ContaPortal>("/conta/contrato", { method: "POST", body: JSON.stringify(body) }),
  programacao: () => request<ProgramacaoPortal>("/programacao"),
  salvarProgramacao: (body: { dias: Array<{ diaSemana: number; itens: Array<{ produtoId: string; quantidade: number }> }> }) =>
    request<ProgramacaoPortal>("/programacao", { method: "POST", body: JSON.stringify(body) }),
  cadastrar: (body: CadastroEmpresa) =>
    request<{ pendente: boolean; mensagem: string }>("/cadastro", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  cadastrarPessoa: (body: CadastroPessoa) =>
    request<{ cliente: ClienteSessao; mensagem: string }>("/cadastro/pessoa", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  catalogo: () => request<{ itens: ProdutoLoja[] }>("/catalogo"),
  pedidos: () => request<{ pedidos: PedidoCliente[] }>("/pedidos"),
  endereco: () =>
    request<{
      endereco: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        estado: string;
      };
      telefone: string;
    }>("/endereco"),
  criarPedido: (body: {
    dataEntrega: string;
    observacoes?: string;
    periodoEntrega?: "manha" | "tarde";
    formaPagamento?: "pix" | "cartao";
    endereco?: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
    };
    itens: Array<{ produtoId: string; quantidade: number }>;
  }) =>
    request<{
      id: string;
      dataEntrega: string;
      total: number;
      perfil?: "empresa" | "pessoa";
      mensagem?: string;
      pagamento?: PedidoPagamento & { formaPagamento?: "pix" | "cartao" };
    }>("/pedidos", { method: "POST", body: JSON.stringify(body) }),
  pagamentoPedido: (id: string) =>
    request<{
      pedidoId: string;
      status: string;
      pixUrl: string | null;
      cartaoUrl: string | null;
      total: number | null;
      pago: boolean;
      formaPagamento?: "pix" | "cartao" | null;
    }>(`/pedidos/${encodeURIComponent(id)}/pagamento`),
  cancelarPedido: (id: string) =>
    request<{ ok: boolean }>(`/pedidos/${encodeURIComponent(id)}/cancelar`, { method: "POST" }),
  alterarFormaPagamento: (id: string, formaPagamento: "pix" | "cartao") =>
    request<PedidoPagamento & { formaPagamento?: "pix" | "cartao"; mensagem?: string }>(
      `/pedidos/${encodeURIComponent(id)}/forma-pagamento`,
      { method: "POST", body: JSON.stringify({ formaPagamento }) },
    ),
  financeiro: () =>
    request<{
      totais: { recebido: number; emAberto: number; emAtraso: number };
      titulos: TituloCliente[];
      aviso?: string;
    }>("/financeiro"),
  baixarDocumento: async (id: string, tipo: "boleto" | "nota") => {
    let response: Response;
    try {
      response = await fetch(`/api/portal/financeiro/${encodeURIComponent(id)}/${tipo}`, { credentials: "include" });
    } catch {
      throw new PortalError(0, "Não foi possível falar com o sistema da fazenda.");
    }
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new PortalError(response.status, data.error || "Não foi possível baixar agora.");
    }
    const blob = await response.blob();
    const disposto = response.headers.get("Content-Disposition") ?? "";
    const nome = /filename="([^"]+)"/.exec(disposto)?.[1] || (tipo === "boleto" ? "boleto.pdf" : "nota.xml");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    link.click();
    URL.revokeObjectURL(url);
  },
  equipeEntrar: (email: string, senha: string) =>
    request<{ equipe: EquipeSessao }>("/equipe/entrar", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
  equipeSair: () => request<{ ok: boolean }>("/equipe/sair", { method: "POST" }),
  equipeProdutos: () => request<{ produtos: ProdutoEquipe[] }>("/equipe/produtos"),
  liberarProdutos: () => request<{ atualizados: number }>("/equipe/produtos/liberar", { method: "POST" }),
  salvarProduto: (
    id: string,
    body: {
      naLoja?: boolean;
      exclusivo?: boolean;
      preco?: number;
      imagemUrl?: string | null;
      descricao?: string;
      aplicacao?: string;
      estoque?: number | null;
    },
  ) =>
    request<{
      id: string;
      naLoja: boolean;
      exclusivo: boolean;
      preco: number | null;
      imagemUrl: string | null;
      descricao: string | null;
      aplicacao: string | null;
      estoque: number | null;
    }>(`/equipe/produtos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  enviarFoto: (id: string, imagem: string) =>
    request<{ imagemUrl: string }>(`/equipe/produtos/${id}/foto`, {
      method: "POST",
      body: JSON.stringify({ imagem }),
    }),
  cadastros: () =>
    request<{
      cadastros: Array<{
        id: string;
        nome: string;
        cnpj: string;
        email: string;
        cidade: string;
        estado: string;
        status: string;
        erro: string | null;
      }>;
    }>("/equipe/cadastros"),
  enviarCadastro: (id: string) => request<{ ok: boolean }>(`/equipe/cadastros/${id}/enviar`, { method: "POST" }),
  convites: (body?: { email?: string; redefinir?: boolean }) =>
    request<{
      criados: Array<{ nome: string; email: string; link: string }>;
      ignorados: Array<{ nome: string; email: string | null; motivo: string }>;
    }>("/equipe/convites", { method: "POST", body: JSON.stringify(body ?? {}) }),
};
