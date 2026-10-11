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
  vinculado: boolean;
};

export type EquipeSessao = {
  nome: string;
  email: string | null;
};

export type ProdutoLoja = {
  id: string;
  nome: string;
  categoria: string | null;
  preco: number;
  precoEspecial: boolean;
  imagemUrl: string | null;
  unidade: string;
};

export type ProdutoEquipe = {
  id: string;
  nome: string;
  categoria: string | null;
  naLoja: boolean;
  preco: number | null;
  imagemUrl: string | null;
  unidade: string;
};

export type PedidoCliente = {
  id: string;
  dataEntrega: string;
  status: string;
  observacoes: string | null;
  itens: Array<{ nome: string; quantidade: number; preco: number | null }>;
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
  entrar: (cnpj: string, senha: string) =>
    request<{ cliente: ClienteSessao; senhaInicial?: boolean }>("/entrar", {
      method: "POST",
      body: JSON.stringify({ cnpj, senha }),
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
  catalogo: () => request<{ itens: ProdutoLoja[] }>("/catalogo"),
  pedidos: () => request<{ pedidos: PedidoCliente[] }>("/pedidos"),
  criarPedido: (body: {
    dataEntrega: string;
    observacoes?: string;
    itens: Array<{ produtoId: string; quantidade: number }>;
  }) => request<{ id: string; dataEntrega: string; total: number }>("/pedidos", { method: "POST", body: JSON.stringify(body) }),
  financeiro: () =>
    request<{
      totais: { recebido: number; emAberto: number; emAtraso: number };
      titulos: TituloCliente[];
      aviso?: string;
    }>("/financeiro"),
  equipeEntrar: (email: string, senha: string) =>
    request<{ equipe: EquipeSessao }>("/equipe/entrar", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
  equipeSair: () => request<{ ok: boolean }>("/equipe/sair", { method: "POST" }),
  equipeProdutos: () => request<{ produtos: ProdutoEquipe[] }>("/equipe/produtos"),
  liberarProdutos: () => request<{ atualizados: number }>("/equipe/produtos/liberar", { method: "POST" }),
  salvarProduto: (id: string, body: { naLoja?: boolean; preco?: number; imagemUrl?: string | null }) =>
    request<{ id: string; naLoja: boolean; preco: number | null; imagemUrl: string | null }>(
      `/equipe/produtos/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  convites: (body?: { email?: string; redefinir?: boolean }) =>
    request<{
      criados: Array<{ nome: string; email: string; link: string }>;
      ignorados: Array<{ nome: string; email: string | null; motivo: string }>;
    }>("/equipe/convites", { method: "POST", body: JSON.stringify(body ?? {}) }),
};
