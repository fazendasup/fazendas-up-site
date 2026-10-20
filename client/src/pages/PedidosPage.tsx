import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ContaCliente } from "@/components/ContaCliente";
import { ProgramacaoPedidos } from "@/components/ProgramacaoPedidos";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  portalApi,
  PortalError,
  type CadastroEmpresa,
  type CadastroPessoa,
  type ClienteSessao,
  type EquipeSessao,
  type PedidoCliente,
  type PedidoPagamento,
  type ProdutoEquipe,
  type ProdutoLoja,
  type TituloCliente,
} from "@/lib/pedidos/api";
import { buscarCep, formatarCep } from "@/lib/pedidos/cep";
import { nomeSemPeso, pesoDoProduto } from "@/lib/pedidos/peso";
import { formatCnpj, formatCpf, formatDocumento, formatLongDate, isValidCnpj, isValidCpf } from "@/lib/pedidos/rules";

function pesoDoItem(nome: string, peso?: string | null, unidade?: string | null) {
  return peso?.trim() || pesoDoProduto(nome, unidade);
}

type Vista = "loja" | "programacao" | "pedidos" | "pagamentos" | "conta" | "equipe" | "cadastro";
type TipoCadastro = "empresa" | "pessoa";
type PeriodoEntrega = "manha" | "tarde";
type FormaPagamento = "pix" | "cartao";
type EnderecoEntrega = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const enderecoVazio: EnderecoEntrega = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "Manaus",
  estado: "AM",
};

const ORDEM_GRUPOS = [
  "Folhas",
  "Microverdes",
  "Ervas",
  "Saladas",
  "Flores",
  "Legumes",
  "Minimamente Processados",
  "Molhos",
  "Planos",
  "Da fazenda",
];

/** Alinha o nome legado da API com o termo correto na loja e no painel. */
function normalizarGrupo(grupo: string) {
  return grupo === "Processados" ? "Minimamente Processados" : grupo;
}

const cadastroVazio: CadastroEmpresa = {
  nome: "",
  nomeFantasia: "",
  cnpj: "",
  email: "",
  telefone: "",
  contato: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "Manaus",
  estado: "AM",
  inscricaoEstadual: "",
};

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Mesma regra do backend: cartão acrescenta 5% sobre os produtos. */
const TAXA_CARTAO = 0.05;

function totalNoCartao(baseProdutos: number) {
  return Math.round(baseProdutos * (1 + TAXA_CARTAO) * 100) / 100;
}

function totalNaForma(baseProdutos: number, forma: FormaPagamento) {
  return forma === "cartao" ? totalNoCartao(baseProdutos) : Math.round(baseProdutos * 100) / 100;
}

function baseItensPedido(pedido: PedidoCliente) {
  return Math.round(pedido.itens.reduce((soma, item) => soma + (item.preco ?? 0) * item.quantidade, 0) * 100) / 100;
}

function mensagem(error: unknown) {
  const texto = error instanceof PortalError ? error.message : "Não foi possível concluir agora.";
  if (/Conta Azul \(\d{3}\):/i.test(texto)) return "Não foi possível concluir agora. Tente de novo em instantes.";
  return texto;
}

function statusPedido(pedido: Pick<PedidoCliente, "status" | "doSite" | "pessoa" | "pagamento">) {
  if (pedido.status === "CANCELADO" || pedido.pagamento?.status === "CANCELADO") return "Cancelado";
  if (pedido.pessoa && pedido.pagamento?.status === "AGUARDANDO") return "Aguardando pagamento";
  if (pedido.pessoa && pedido.pagamento?.status === "PAGO") return "Pago · na programação";
  if (pedido.status === "PENDENTE") return pedido.doSite && !pedido.pessoa ? "Aguardando aprovação" : "Programado";
  if (pedido.status === "PRONTO") return "Separado";
  if (pedido.status === "ENTREGUE") return "Entregue";
  return "Em andamento";
}

function podeCancelarPedido(pedido: PedidoCliente) {
  if (pedido.status === "CANCELADO" || pedido.pagamento?.status === "CANCELADO") return false;
  if (pedido.pagamento?.status === "PAGO") return false;
  if (pedido.pessoa && pedido.pagamento?.status === "AGUARDANDO") return true;
  if (pedido.doSite && !pedido.pessoa && pedido.status === "PENDENTE") return true;
  return false;
}

function podeTrocarPagamento(pedido: PedidoCliente) {
  return Boolean(pedido.pessoa && pedido.pagamento?.status === "AGUARDANDO");
}

function ehPessoa(cliente: ClienteSessao | null) {
  return cliente?.perfil === "pessoa";
}

function hojeManaus() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function tituloEmAtraso(titulo: TituloCliente, hoje: string) {
  if (titulo.emAberto <= 0.009) return false;
  if (/ATRASADO/i.test(titulo.status)) return true;
  if (titulo.pagamento) return false;
  return Boolean(titulo.vencimento && titulo.vencimento.slice(0, 10) < hoje);
}

function lerCarrinho(): Record<string, number> {
  try {
    const salvo = JSON.parse(localStorage.getItem("fazendas.pedido") ?? "{}") as Record<string, number>;
    return salvo && typeof salvo === "object" ? salvo : {};
  } catch {
    return {};
  }
}

export default function PedidosPage({ acessoEquipe = false }: { acessoEquipe?: boolean }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const convite = params.get("convite") ?? "";
  const portaEquipe = acessoEquipe || params.get("acesso") === "equipe";
  const [cliente, setCliente] = useState<ClienteSessao | null>(null);
  const [equipe, setEquipe] = useState<EquipeSessao | null>(null);
  const [catalogo, setCatalogo] = useState<ProdutoLoja[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [titulos, setTitulos] = useState<TituloCliente[]>([]);
  const [carrinho, setCarrinho] = useState<Record<string, number>>(lerCarrinho);
  const [grupo, setGrupo] = useState("Tudo");
  const [vista, setVista] = useState<Vista>(portaEquipe ? "equipe" : "loja");
  const [modoEquipe, setModoEquipe] = useState(portaEquipe);
  const [datas, setDatas] = useState<string[]>([]);
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [minimo, setMinimo] = useState(300);
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [empresa, setEmpresa] = useState<CadastroEmpresa>(cadastroVazio);
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro>("pessoa");
  const [pessoa, setPessoa] = useState<CadastroPessoa>({ nome: "", cpf: "", email: "", telefone: "", senha: "" });
  const [pagamentoAberto, setPagamentoAberto] = useState<(PedidoPagamento & { pedidoId: string }) | null>(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  /** Checkout em etapas: 1 entrega · 2 pagamento · 3 confirmar */
  const [checkoutPasso, setCheckoutPasso] = useState<1 | 2 | 3>(1);
  const [endereco, setEndereco] = useState<EnderecoEntrega>(enderecoVazio);
  const [periodoEntrega, setPeriodoEntrega] = useState<PeriodoEntrega>("manha");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const itensCarrinho = useMemo(
    () => Object.values(carrinho).reduce((soma, qtd) => soma + (qtd > 0 ? qtd : 0), 0),
    [carrinho],
  );
  const pedidosAguardandoPagamento = useMemo(
    () => pedidos.filter((p) => p.pagamento?.status === "AGUARDANDO" && p.status !== "CANCELADO").length,
    [pedidos],
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  /** Evita double-click criar vários pedidos/cobranças no Conta Azul. */
  const enviandoRef = useRef(false);
  const [produtosEquipe, setProdutosEquipe] = useState<ProdutoEquipe[]>([]);
  const [cadastros, setCadastros] = useState<Array<{ id: string; nome: string; cnpj: string; email: string; cidade: string; estado: string; status: string; erro: string | null }>>([]);
  const [emAtraso, setEmAtraso] = useState(false);
  const [contaPronta, setContaPronta] = useState(false);
  const [avisoPagamento, setAvisoPagamento] = useState("");
  const [verHistorico, setVerHistorico] = useState(false);
  const [verHistoricoPedidos, setVerHistoricoPedidos] = useState(false);
  const [baixandoDoc, setBaixandoDoc] = useState("");

  const total = catalogo.reduce((soma, produto) => soma + (produto.preco ?? 0) * (carrinho[produto.id] ?? 0), 0);
  const precoDaConta = Boolean(cliente);
  const grupos = useMemo(() => {
    const presentes = new Set(catalogo.map((produto) => normalizarGrupo(produto.grupo)).filter(Boolean));
    const ordenados = ORDEM_GRUPOS.filter((item) => presentes.has(item));
    const extras = [...presentes].filter((item) => !ORDEM_GRUPOS.includes(item)).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [...ordenados, ...extras];
  }, [catalogo]);
  const visiveis = catalogo.filter((produto) => grupo === "Tudo" || normalizarGrupo(produto.grupo) === grupo);

  useEffect(() => {
    localStorage.setItem("fazendas.pedido", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    if (carregando) return;
    const ids = new Set(catalogo.map((produto) => produto.id));
    setCarrinho((atual) => {
      const proximo = Object.fromEntries(Object.entries(atual).filter(([id, quantidade]) => quantidade > 0 && ids.has(id)));
      return Object.keys(proximo).length === Object.keys(atual).length ? atual : proximo;
    });
  }, [carregando, catalogo]);

  const carregarVitrine = async () => {
    const loja = await portalApi.vitrine();
    setCatalogo(loja.itens);
    setDatas(loja.datas);
    setMinimo(loja.minimoReais);
    setDataEntrega((atual) => atual || loja.datas[0] || "");
  };

  const carregarConta = async () => {
    const [historico, financeiro] = await Promise.all([portalApi.pedidos(), portalApi.financeiro()]);
    setPedidos(historico.pedidos);
    setTitulos(financeiro.titulos);
    setAvisoPagamento(financeiro.aviso ?? "");
    setEmAtraso(financeiro.totais.emAtraso > 0);
    setContaPronta(true);
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        await carregarVitrine();
      } catch (error) {
        if (ativo) toast.error(mensagem(error));
      }
      try {
        const sessao = await portalApi.sessao();
        if (!ativo) return;
        setCliente(sessao.cliente);
        setEquipe(sessao.equipe);
        if (sessao.cliente) await carregarConta();
        if (sessao.equipe && !sessao.cliente) {
          setVista("equipe");
          const [lista, recebidos] = await Promise.all([portalApi.equipeProdutos(), portalApi.cadastros()]);
          if (!ativo) return;
          setProdutosEquipe(lista.produtos);
          setCadastros(recebidos.cadastros);
        }
      } catch {
        /* a vitrine abre sem sessão */
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const definirQtd = (produto: ProdutoLoja, qtd: number) => {
    const teto = produto.estoque == null ? 9999 : produto.estoque;
    setCarrinho((atual) => {
      const proximo = { ...atual };
      if (qtd <= 0) delete proximo[produto.id];
      else proximo[produto.id] = Math.min(teto, qtd);
      return proximo;
    });
  };

  const entrar = async () => {
    setEnviando(true);
    try {
      if (modoEquipe) {
        const resposta = await portalApi.equipeEntrar(email, senha);
        setEquipe(resposta.equipe);
        setVista("equipe");
        const [lista, recebidos] = await Promise.all([portalApi.equipeProdutos(), portalApi.cadastros()]);
        setProdutosEquipe(lista.produtos);
        setCadastros(recebidos.cadastros);
      } else {
        const resposta = await portalApi.entrar(cnpj, senha);
        setCliente(resposta.cliente);
        setSenha("");
        setVista("loja");
        await Promise.all([carregarVitrine(), carregarConta()]);
        if (resposta.cliente.perfil === "pessoa") {
          toast.success("Bem-vindo. Pague com Pix ou cartão ao enviar o pedido.");
        }
      }
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const criarSenha = async () => {
    if (senha.length < 10 || senha !== senha2) {
      toast.error("A senha precisa ter pelo menos 10 caracteres e as duas precisam ser iguais.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await portalApi.ativar(convite, senha);
      setCliente(resposta.cliente);
      setSenha("");
      setSenha2("");
      window.history.replaceState({}, "", "/pedidos");
      setVista("loja");
      await Promise.all([carregarVitrine(), carregarConta()]);
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const abrirCheckout = async () => {
    if (!cliente) {
      setVista("loja");
      document.getElementById("enviar-pedido")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const itens = Object.entries(carrinho)
      .filter(([, quantidade]) => quantidade > 0)
      .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
    if (itens.length === 0) {
      toast.error("Inclua ao menos um produto.");
      return;
    }
    if (minimo > 0 && total < minimo) {
      toast.error(`O pedido mínimo para entrega é ${reais(minimo)}.`);
      return;
    }
    if (!ehPessoa(cliente)) {
      await lancarEmpresa(itens);
      return;
    }
    try {
      const salvo = await portalApi.endereco();
      setEndereco({ ...enderecoVazio, ...salvo.endereco, complemento: salvo.endereco.complemento || "" });
    } catch {
      /* endereço vazio: preenche no checkout */
    }
    setCheckoutPasso(1);
    setCheckoutAberto(true);
  };

  const lancarEmpresa = async (itens: Array<{ produtoId: string; quantidade: number }>) => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const criado = await portalApi.criarPedido({ dataEntrega, observacoes, itens });
      setCarrinho({});
      setObservacoes("");
      await Promise.all([carregarVitrine(), carregarConta()]);
      setVista("pedidos");
      toast.success(criado.mensagem || "Pedido enviado para aprovação.");
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const concluirCheckoutPessoa = async () => {
    if (enviandoRef.current) return;
    const cep = endereco.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      toast.error("Informe um CEP válido.");
      return;
    }
    if (endereco.logradouro.trim().length < 2 || !endereco.numero.trim() || endereco.bairro.trim().length < 2) {
      toast.error("Complete o endereço de entrega.");
      return;
    }
    if (!dataEntrega) {
      toast.error("Escolha a data de entrega.");
      return;
    }
    const itens = Object.entries(carrinho)
      .filter(([, quantidade]) => quantidade > 0)
      .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const criado = await portalApi.criarPedido({
        dataEntrega,
        observacoes,
        periodoEntrega,
        formaPagamento,
        endereco: { ...endereco, cep, estado: endereco.estado.toUpperCase().slice(0, 2) },
        itens,
      });
      setCarrinho({});
      setObservacoes("");
      setCheckoutAberto(false);
      await Promise.all([carregarVitrine(), carregarConta()]);
      setVista("pedidos");
      if (criado.pagamento) {
        const forma = criado.pagamento.formaPagamento ?? formaPagamento;
        setPagamentoAberto({
          ...criado.pagamento,
          pixUrl: forma === "pix" ? criado.pagamento.pixUrl : null,
          cartaoUrl: forma === "cartao" ? criado.pagamento.cartaoUrl : null,
          formaPagamento: forma,
          pedidoId: criado.id,
          linkPendente: criado.pagamento.linkPendente,
        });
        if (criado.pagamento.linkPendente) {
          const id = criado.id;
          window.setTimeout(() => {
            void portalApi.pagamentoPedido(id).then((pagamento) => {
              const formaOk =
                pagamento.formaPagamento ??
                (pagamento.pixUrl ? "pix" : pagamento.cartaoUrl ? "cartao" : forma);
              const url = formaOk === "cartao" ? pagamento.cartaoUrl : pagamento.pixUrl;
              if (url) {
                setPagamentoAberto({
                  ...pagamento,
                  pixUrl: formaOk === "pix" ? pagamento.pixUrl : null,
                  cartaoUrl: formaOk === "cartao" ? pagamento.cartaoUrl : null,
                  formaPagamento: formaOk,
                  pedidoId: id,
                  linkPendente: false,
                });
              }
            }).catch(() => undefined);
          }, 4000);
        }
      }
      toast.success(criado.mensagem || "Pedido criado. Conclua o pagamento para liberar a entrega.");
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const preencherCep = async (valor: string) => {
    const cep = formatarCep(valor);
    setEndereco((atual) => ({ ...atual, cep }));
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscandoCep(true);
    try {
      const achado = await buscarCep(cep);
      if (!achado) {
        toast.error("CEP não encontrado.");
        return;
      }
      setEndereco((atual) => ({
        ...atual,
        cep: formatarCep(achado.cep),
        logradouro: achado.logradouro || atual.logradouro,
        bairro: achado.bairro || atual.bairro,
        cidade: achado.cidade || atual.cidade,
        estado: achado.estado || atual.estado,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const enviarCadastro = async () => {
    if (tipoCadastro === "pessoa") {
      if (!isValidCpf(pessoa.cpf)) {
        toast.error("Confira o CPF.");
        return;
      }
      if (pessoa.senha.length < 8) {
        toast.error("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      setEnviando(true);
      try {
        const resposta = await portalApi.cadastrarPessoa({
          ...pessoa,
          cpf: pessoa.cpf.replace(/\D/g, ""),
          telefone: pessoa.telefone.replace(/\D/g, ""),
        });
        setCliente(resposta.cliente);
        setCnpj(pessoa.cpf);
        setVista("loja");
        setModoEquipe(false);
        await Promise.all([carregarVitrine(), carregarConta()]);
        toast.success(resposta.mensagem || "Conta criada.");
      } catch (error) {
        toast.error(mensagem(error));
      } finally {
        setEnviando(false);
      }
      return;
    }
    if (!isValidCnpj(empresa.cnpj)) {
      toast.error("Confira o CNPJ.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await portalApi.cadastrar({
        ...empresa,
        cnpj: empresa.cnpj.replace(/\D/g, ""),
        estado: empresa.estado.toUpperCase(),
      });
      toast.success(resposta.mensagem);
      if (!resposta.pendente) {
        setCnpj(empresa.cnpj);
        setVista("loja");
        setModoEquipe(false);
      }
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const salvarProduto = async (
    produto: ProdutoEquipe,
    patch: {
      naLoja?: boolean;
      exclusivo?: boolean;
      preco?: number;
      imagemUrl?: string | null;
      descricao?: string;
      aplicacao?: string;
      estoque?: number | null;
      grupo?: string;
    },
  ) => {
    try {
      const salvo = await portalApi.salvarProduto(produto.id, patch);
      setProdutosEquipe((atual) =>
        atual.map((item) =>
          item.id === produto.id
            ? {
                ...item,
                ...salvo,
                descricao: salvo.descricao ?? item.descricao,
                aplicacao: salvo.aplicacao ?? item.aplicacao,
                grupo: salvo.grupo ?? item.grupo,
              }
            : item,
        ),
      );
      toast.success(patch.grupo ? `Classe atualizada: ${salvo.grupo ?? patch.grupo}.` : "Produto atualizado.");
      void carregarVitrine();
    } catch (error) {
      toast.error(mensagem(error));
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader variant="subpage" />
      <main className={`container pt-28 ${vista === "loja" && itensCarrinho > 0 ? "pb-32 lg:pb-24" : "pb-24"}`}>
        {(vista === "loja" || vista === "cadastro" || vista === "equipe") ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm font-medium tracking-[0.12em] text-forest uppercase">Fazendas UP</p>
              <h1 className="display-head text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[1.05]">
                {vista === "equipe"
                  ? equipe
                    ? "Painel da equipe"
                    : "Acesso da equipe"
                  : vista === "cadastro"
                    ? "Criar conta"
                    : <>Da fazenda para a <em>cozinha</em>.</>}
              </h1>
              {vista === "equipe" && equipe ? (
                <p className="max-w-xl text-sm text-ink/65">
                  Catálogo, vitrine do site, cadastros e ações rápidas para administrar a loja.
                </p>
              ) : null}
              {vista === "loja" && !cliente ? (
                <p className="max-w-xl text-sm text-ink/65">
                  Escolha os produtos, entre na conta e finalize em poucos passos — Pix sem taxa ou cartão.
                </p>
              ) : null}
              {vista === "loja" && cliente && ehPessoa(cliente) ? (
                <p className="max-w-xl text-sm text-ink/65">
                  Monte o pedido na vitrine. Entrega e pagamento ficam no checkout.
                </p>
              ) : null}
            </div>
            {cliente || vista === "equipe" ? null : (
              <div className="flex gap-4 text-sm">
                <button type="button" className="text-ink/70" onClick={() => { setVista("loja"); setModoEquipe(false); document.getElementById("enviar-pedido")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Entrar</button>
                <button type="button" className="text-forest" onClick={() => { setTipoCadastro("pessoa"); setVista("cadastro"); }}>Criar conta</button>
              </div>
            )}
          </div>
        ) : null}
        {cliente ? (
          <div className="mt-6 space-y-3">
            <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink/65">
                Olá, <span className="font-medium text-ink">{cliente.nome.split(" ")[0]}</span>
              </p>
              <nav className="flex flex-wrap gap-2">
                {(
                  [
                    ["loja", itensCarrinho > 0 ? `Loja (${itensCarrinho})` : "Loja"],
                    ...(cliente.recorrente && !ehPessoa(cliente) ? [["programacao", "Programação"] as const] : []),
                    ["pedidos", pedidosAguardandoPagamento > 0 ? `Meus pedidos (${pedidosAguardandoPagamento})` : "Meus pedidos"],
                    ...(!ehPessoa(cliente) ? [["pagamentos", "Pagamentos"] as const] : []),
                    ["conta", "Minha conta"],
                  ] as const
                ).map(([id, rotulo]) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      vista === id
                        ? "bg-forest px-3 py-2 text-sm text-paper"
                        : "border border-ink/15 px-3 py-2 text-sm text-ink"
                    }
                    onClick={() => {
                      if (id === "pagamentos") setVerHistorico(false);
                      if (id === "pedidos") setVerHistoricoPedidos(false);
                      setVista(id);
                      if (id === "loja") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {rotulo}
                  </button>
                ))}
                {equipe ? (
                  <button type="button" className="border border-ink/15 px-3 py-2 text-sm" onClick={() => setVista("equipe")}>
                    Equipe
                  </button>
                ) : null}
                <button
                  type="button"
                  className="border border-ink/15 px-3 py-2 text-sm"
                  onClick={() => {
                    void portalApi.sair().finally(() => {
                      setCliente(null);
                      setPedidos([]);
                      setTitulos([]);
                      setAvisoPagamento("");
                      setContaPronta(false);
                      setVerHistorico(false);
                      setVerHistoricoPedidos(false);
                      setVista("loja");
                      void carregarVitrine();
                    });
                  }}
                >
                  Sair
                </button>
              </nav>
            </div>
            {pedidosAguardandoPagamento > 0 && vista === "loja" ? (
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 border border-forest/30 bg-forest/5 px-4 py-3 text-left text-sm"
                onClick={() => {
                  setVerHistoricoPedidos(false);
                  setVista("pedidos");
                }}
              >
                <span>
                  {pedidosAguardandoPagamento === 1
                    ? "Você tem 1 pedido aguardando pagamento."
                    : `Você tem ${pedidosAguardandoPagamento} pedidos aguardando pagamento.`}
                </span>
                <span className="shrink-0 font-medium text-forest">Pagar agora →</span>
              </button>
            ) : null}
            {emAtraso && !ehPessoa(cliente) && vista === "loja" ? (
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 border border-red-800/25 bg-red-50 px-4 py-3 text-left text-sm text-red-900"
                onClick={() => {
                  setVerHistorico(false);
                  setVista("pagamentos");
                }}
              >
                <span>Há pagamento em atraso. Regularize para liberar novos pedidos.</span>
                <span className="shrink-0 font-medium">Ver pagamentos →</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {carregando ? <p className="mt-8 text-ink/60">Carregando os produtos...</p> : null}

        {vista === "cadastro" && !cliente ? (
          <div className="mt-8 max-w-3xl space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={tipoCadastro === "pessoa" ? "bg-forest px-3 py-2 text-sm text-paper" : "border border-ink/15 px-3 py-2 text-sm"}
                onClick={() => setTipoCadastro("pessoa")}
              >
                Pessoa física
              </button>
              <button
                type="button"
                className={tipoCadastro === "empresa" ? "bg-forest px-3 py-2 text-sm text-paper" : "border border-ink/15 px-3 py-2 text-sm"}
                onClick={() => setTipoCadastro("empresa")}
              >
                Empresa (CNPJ)
              </button>
            </div>
            {tipoCadastro === "pessoa" ? (
              <form
                className="grid gap-4 rounded-sm border border-ink/10 bg-white p-6 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void enviarCadastro();
                }}
              >
                <h2 className="display-head text-2xl sm:col-span-2">Criar conta</h2>
                <p className="text-sm text-ink/65 sm:col-span-2">
                  Cadastro rápido. No pedido você escolhe Pix (sem taxa) ou cartão (+5%). Pedido mínimo {reais(200)}. Entrega a partir de 2 dias úteis (48h).
                </p>
                <Campo label="Seu nome" value={pessoa.nome} onChange={(nome) => setPessoa({ ...pessoa, nome })} />
                <Campo label="CPF" value={formatCpf(pessoa.cpf)} onChange={(cpf) => setPessoa({ ...pessoa, cpf })} inputMode="numeric" />
                <Campo label="E-mail" value={pessoa.email} onChange={(email) => setPessoa({ ...pessoa, email })} type="email" />
                <Campo label="Telefone / WhatsApp" value={pessoa.telefone} onChange={(telefone) => setPessoa({ ...pessoa, telefone })} inputMode="tel" />
                <div className="sm:col-span-2">
                  <CampoSenha label="Senha (mín. 8)" value={pessoa.senha} onChange={(senha) => setPessoa({ ...pessoa, senha })} autoComplete="new-password" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={enviando}>Criar conta e entrar</Button>
                </div>
              </form>
            ) : (
              <form
                className="grid gap-4 rounded-sm border border-ink/10 bg-white p-6 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void enviarCadastro();
                }}
              >
                <h2 className="display-head text-2xl sm:col-span-2">Cadastro da empresa</h2>
                <p className="text-sm text-ink/65 sm:col-span-2">Pedidos B2B passam por aprovação da fazenda. As regras de pagamento ficam por cliente.</p>
                <Campo label="Razão social" value={empresa.nome} onChange={(nome) => setEmpresa({ ...empresa, nome })} />
                <Campo label="Nome fantasia" value={empresa.nomeFantasia ?? ""} onChange={(nomeFantasia) => setEmpresa({ ...empresa, nomeFantasia })} />
                <Campo label="CNPJ" value={formatCnpj(empresa.cnpj)} onChange={(valor) => setEmpresa({ ...empresa, cnpj: valor })} inputMode="numeric" />
                <Campo label="Inscrição estadual" value={empresa.inscricaoEstadual ?? ""} onChange={(inscricaoEstadual) => setEmpresa({ ...empresa, inscricaoEstadual })} />
                <Campo label="E-mail" value={empresa.email} onChange={(valor) => setEmpresa({ ...empresa, email: valor })} type="email" />
                <Campo label="Telefone" value={empresa.telefone} onChange={(telefone) => setEmpresa({ ...empresa, telefone })} inputMode="tel" />
                <Campo label="Pessoa de contato" value={empresa.contato} onChange={(contato) => setEmpresa({ ...empresa, contato })} />
                <Campo label="CEP" value={empresa.cep} onChange={(cep) => setEmpresa({ ...empresa, cep })} inputMode="numeric" />
                <Campo label="Logradouro" value={empresa.logradouro} onChange={(logradouro) => setEmpresa({ ...empresa, logradouro })} />
                <Campo label="Número" value={empresa.numero} onChange={(numero) => setEmpresa({ ...empresa, numero })} />
                <Campo label="Complemento" value={empresa.complemento ?? ""} onChange={(complemento) => setEmpresa({ ...empresa, complemento })} />
                <Campo label="Bairro" value={empresa.bairro} onChange={(bairro) => setEmpresa({ ...empresa, bairro })} />
                <Campo label="Cidade" value={empresa.cidade} onChange={(cidade) => setEmpresa({ ...empresa, cidade })} />
                <Campo label="Estado" value={empresa.estado} onChange={(estado) => setEmpresa({ ...empresa, estado: estado.slice(0, 2).toUpperCase() })} />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={enviando}>Enviar cadastro</Button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        {!cliente && convite ? (
          <form
            className="mt-8 max-w-md space-y-4 rounded-sm border border-ink/10 bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void criarSenha();
            }}
          >
            <h2 className="text-xl">Crie a senha da sua empresa</h2>
            <CampoSenha label="Senha" value={senha} onChange={setSenha} autoComplete="new-password" />
            <CampoSenha label="Repita a senha" value={senha2} onChange={setSenha2} autoComplete="new-password" />
            <Button type="submit" disabled={enviando}>Criar senha e entrar</Button>
          </form>
        ) : null}

        {vista === "programacao" && cliente?.recorrente ? <ProgramacaoPedidos produtos={catalogo} /> : null}

        {vista === "pedidos" && cliente ? (
          <PedidosCliente
            pedidos={pedidos}
            verHistorico={verHistoricoPedidos}
            onHistorico={() => setVerHistoricoPedidos((atual) => !atual)}
            onLoja={() => { setVista("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onAtualizar={() => carregarConta()}
            onPagamento={(pagamento) => setPagamentoAberto(pagamento)}
          />
        ) : null}

        {vista === "pagamentos" && cliente ? (
          <>
          {ehPessoa(cliente) ? (
            <div className="mt-8 max-w-lg space-y-3 rounded-sm border border-ink/10 bg-white p-6">
              <h2 className="display-head text-2xl">Pagamentos</h2>
              <p className="text-sm text-ink/70">
                Pix e cartão ficam em <span className="font-medium text-ink">Meus pedidos</span> — pague, troque a forma ou cancele por lá.
              </p>
              <Button type="button" onClick={() => { setVerHistoricoPedidos(false); setVista("pedidos"); }}>
                Ir para Meus pedidos
              </Button>
            </div>
          ) : (
            <Pagamentos
              titulos={titulos}
              aviso={avisoPagamento}
              verHistorico={verHistorico}
              baixandoDoc={baixandoDoc}
              onHistorico={() => setVerHistorico((atual) => !atual)}
              onBaixar={(id, tipo) => {
                const chave = `${tipo}:${id}`;
                setBaixandoDoc(chave);
                void portalApi
                  .baixarDocumento(id, tipo)
                  .catch((error) => toast.error(mensagem(error)))
                  .finally(() => setBaixandoDoc((atual) => (atual === chave ? "" : atual)));
              }}
            />
          )}
          <button type="button" className="mt-8 text-sm text-forest" onClick={() => { setVista("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Fazer pedido</button>
          </>
        ) : null}

        {vista === "conta" && cliente ? (
          <>
          {ehPessoa(cliente) ? (
            <ContaPessoa
              nome={cliente.nome}
              onSalvo={() => {
                void carregarConta().catch(() => undefined);
              }}
            />
          ) : (
            <ContaCliente
              onMinimo={setMinimo}
              onRecorrente={() => setCliente((atual) => (atual ? { ...atual, recorrente: true } : atual))}
            />
          )}
          <form
            className="mt-8 max-w-md space-y-3 rounded-sm border border-ink/10 bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (senhaNova.length < 8 || senhaNova !== senha2) {
                toast.error("A nova senha precisa ter pelo menos 8 caracteres e as duas precisam ser iguais.");
                return;
              }
              setEnviando(true);
              void portalApi.alterarSenha(senhaAtual, senhaNova)
                .then(() => {
                  setSenhaAtual("");
                  setSenhaNova("");
                  setSenha2("");
                  toast.success("Senha alterada.");
                })
                .catch((error) => toast.error(mensagem(error)))
                .finally(() => setEnviando(false));
            }}
          >
            <h2 className="text-lg">Senha desta conta</h2>
            <p className="text-sm text-ink/60">
              {ehPessoa(cliente)
                ? "Use a senha que você criou no cadastro."
                : "Se ainda não trocou, a senha atual são os 5 primeiros dígitos do CNPJ."}
            </p>
            <CampoSenha label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} autoComplete="current-password" />
            <CampoSenha label="Nova senha" value={senhaNova} onChange={setSenhaNova} autoComplete="new-password" />
            <CampoSenha label="Repita a nova senha" value={senha2} onChange={setSenha2} autoComplete="new-password" />
            <Button type="submit" disabled={enviando}>Alterar senha</Button>
            <button type="button" className="text-sm text-forest" onClick={() => { setVista("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Fazer pedido</button>
          </form>
          </>
        ) : null}

        {vista === "equipe" && (equipe || modoEquipe) ? (
          <section className="mt-8 space-y-6">
            {!equipe ? (
              <form
                className="max-w-md space-y-4 rounded-sm border border-ink/10 bg-white p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void entrar();
                }}
              >
                <p className="text-sm text-ink/65">O mesmo e-mail e a mesma senha do sistema interno.</p>
                <Campo label="E-mail" value={email} onChange={setEmail} type="email" />
                <CampoSenha label="Senha" value={senha} onChange={setSenha} autoComplete="current-password" />
                <Button type="submit" disabled={enviando}>Entrar</Button>
                <a href="/pedidos" className="block text-sm text-ink/55">Voltar aos produtos</a>
              </form>
            ) : (
              <PainelEquipe
                nome={equipe.nome}
                produtos={produtosEquipe}
                cadastros={cadastros}
                onSair={() => {
                  void portalApi.equipeSair().finally(() => {
                    setEquipe(null);
                    setVista("loja");
                  });
                }}
                onAtualizar={async () => {
                  const [lista, recebidos] = await Promise.all([portalApi.equipeProdutos(), portalApi.cadastros()]);
                  setProdutosEquipe(lista.produtos);
                  setCadastros(recebidos.cadastros);
                  void carregarVitrine();
                }}
                onSalvar={salvarProduto}
                onFoto={async (item, imagem) => {
                  const salvo = await portalApi.enviarFoto(item.id, imagem);
                  setProdutosEquipe((atual) =>
                    atual.map((produto) => (produto.id === item.id ? { ...produto, imagemUrl: salvo.imagemUrl } : produto)),
                  );
                  void carregarVitrine();
                  return salvo.imagemUrl;
                }}
                onCadastros={setCadastros}
              />
            )}
          </section>
        ) : null}

        {vista === "loja" ? (
          <section className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <button type="button" className={grupo === "Tudo" ? "text-forest" : "text-ink/55"} onClick={() => setGrupo("Tudo")}>Todos</button>
                {grupos.map((item) => (
                  <button key={item} type="button" className={grupo === item ? "text-forest" : "text-ink/55"} onClick={() => setGrupo(item)}>{item}</button>
                ))}
              </div>
              {visiveis.length === 0 && !carregando ? <p className="text-ink/60">Nenhum produto nesta seleção.</p> : null}
              {(grupo === "Tudo" ? grupos : [grupo]).map((nome) => {
                const itens = visiveis.filter((produto) => normalizarGrupo(produto.grupo) === nome);
                if (itens.length === 0) return null;
                return (
                  <section key={nome} className="mb-10">
                    <h2 className="display-head mb-4 text-[1.6rem]">{nome}</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                      {itens.map((produto) => (
                        <CartaoProduto key={produto.id} produto={produto} qtd={carrinho[produto.id] ?? 0} onQtd={definirQtd} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <aside id="enviar-pedido" className="space-y-4 rounded-sm border border-ink/10 bg-white p-5 lg:sticky lg:top-28">
              <h2 className="text-lg">Seu pedido</h2>
              {precoDaConta ? <p className="text-2xl font-medium tabular-nums">{reais(total)}</p> : <p className="text-sm text-ink/70">Entre para ver os preços e enviar o pedido.</p>}
              {precoDaConta && ehPessoa(cliente) && total > 0 ? (
                <div className="space-y-1 text-xs text-ink/60">
                  <p>Pix: {reais(total)} · sem taxa</p>
                  <p>Cartão: {reais(totalNoCartao(total))} · inclui +5% da operadora</p>
                  {minimo > 0 ? <p>Pedido mínimo: {reais(minimo)}</p> : null}
                </div>
              ) : null}
              {total === 0 && Object.values(carrinho).every((quantidade) => quantidade <= 0) ? <p className="text-sm text-ink/55">Escolha a quantidade nos produtos.</p> : null}
              {precoDaConta && minimo > 0 && total > 0 && total < minimo ? <p className="text-sm text-ink/65">Faltam {reais(minimo - total)} para atingir o pedido mínimo.</p> : null}
              {emAtraso && cliente && !ehPessoa(cliente) ? <p className="text-sm text-red-800">Há um pagamento em atraso nesta conta. O pedido fica bloqueado até a regularização.</p> : null}
              <ul className="space-y-3 text-sm">
                {catalogo.filter((produto) => (carrinho[produto.id] ?? 0) > 0).map((produto) => {
                  const qtd = carrinho[produto.id] ?? 0;
                  const noTeto = produto.estoque != null && qtd >= produto.estoque;
                  const peso = pesoDoItem(produto.nome, produto.peso, produto.unidade);
                  return (
                    <li key={produto.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{nomeSemPeso(produto.nome)}</p>
                        <p className="text-xs text-ink/50">
                          {peso ? `Peso ${peso}` : null}
                          {peso && produto.preco != null ? " · " : null}
                          {produto.preco != null ? reais(produto.preco * qtd) : `${qtd} ${produto.unidade}`}
                        </p>
                      </div>
                      <button type="button" className="h-8 w-8 border border-ink/15" onClick={() => definirQtd(produto, qtd - 1)} aria-label={`Diminuir ${produto.nome}`}>−</button>
                      <span className="w-6 text-center tabular-nums">{qtd}</span>
                      <button type="button" className="h-8 w-8 border border-ink/15 disabled:opacity-40" onClick={() => definirQtd(produto, qtd + 1)} disabled={noTeto} aria-label={`Aumentar ${produto.nome}`}>+</button>
                      <button type="button" className="h-8 w-8 text-ink/55" onClick={() => definirQtd(produto, 0)} aria-label={`Excluir ${produto.nome}`}>×</button>
                    </li>
                  );
                })}
              </ul>
              {cliente && !ehPessoa(cliente) ? (
                <>
                  <label className="block text-sm">
                    Entrega
                    <select value={dataEntrega} onChange={(event) => setDataEntrega(event.target.value)} className="mt-1 w-full border border-ink/15 bg-white px-3 py-3">
                      {datas.map((data) => <option key={data} value={data}>{formatLongDate(data)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm">
                    Observação
                    <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} className="mt-1 w-full border border-ink/15 px-3 py-3" />
                  </label>
                </>
              ) : null}
              {cliente ? (
                <Button
                  type="button"
                  disabled={enviando || (emAtraso && !ehPessoa(cliente)) || (minimo > 0 && total < minimo) || total <= 0}
                  onClick={() => void abrirCheckout()}
                >
                  {ehPessoa(cliente)
                    ? total > 0
                      ? `Continuar · ${reais(total)}`
                      : "Escolha os produtos"
                    : "Enviar para aprovação"}
                </Button>
              ) : (
                <form
                  className="space-y-3 border-t border-ink/10 pt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void entrar();
                  }}
                >
                  <p className="text-sm text-ink/70">Entre com CPF (pessoa) ou CNPJ (empresa).</p>
                  {modoEquipe ? (
                    <Campo label="E-mail" value={email} onChange={setEmail} type="email" />
                  ) : (
                    <Campo label="CPF ou CNPJ" value={formatDocumento(cnpj)} onChange={setCnpj} inputMode="numeric" />
                  )}
                  <CampoSenha label="Senha" value={senha} onChange={setSenha} autoComplete="current-password" />
                  <Button type="submit" disabled={enviando}>Entrar</Button>
                  <button
                    type="button"
                    className="block text-sm text-forest"
                    onClick={() => {
                      setTipoCadastro("pessoa");
                      setVista("cadastro");
                    }}
                  >
                    Criar conta (pessoa física)
                  </button>
                  <button
                    type="button"
                    className="block text-sm text-ink/55"
                    onClick={() => {
                      setTipoCadastro("empresa");
                      setVista("cadastro");
                    }}
                  >
                    Cadastrar empresa
                  </button>
                </form>
              )}
            </aside>
          </section>
        ) : null}
        {checkoutAberto ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="checkout-titulo">
            <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-sm bg-paper p-6 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="checkout-titulo" className="display-head text-2xl">Checkout</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {checkoutPasso === 1 ? "Passo 1 de 3 · Entrega" : checkoutPasso === 2 ? "Passo 2 de 3 · Pagamento" : "Passo 3 de 3 · Confirmar"}
                  </p>
                </div>
                <button type="button" className="text-sm text-ink/50" disabled={enviando} onClick={() => setCheckoutAberto(false)}>Fechar</button>
              </div>

              <ol className="grid grid-cols-3 gap-2 text-center text-xs">
                {(["Entrega", "Pagamento", "Confirmar"] as const).map((rotulo, indice) => {
                  const passo = (indice + 1) as 1 | 2 | 3;
                  const ativo = checkoutPasso === passo;
                  const feito = checkoutPasso > passo;
                  return (
                    <li key={rotulo} className={ativo ? "border-b-2 border-forest pb-2 font-medium text-ink" : feito ? "border-b border-forest/40 pb-2 text-forest" : "border-b border-ink/10 pb-2 text-ink/40"}>
                      {rotulo}
                    </li>
                  );
                })}
              </ol>

              {checkoutPasso === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Quando entregar?</p>
                    <p className="text-xs text-ink/55">Entrega a partir de 2 dias úteis (48h). Sábado, domingo e feriado de Manaus não entram na rota.</p>
                    <select value={dataEntrega} onChange={(event) => setDataEntrega(event.target.value)} className="w-full border border-ink/15 bg-white px-3 py-3">
                      {datas.map((data) => (
                        <option key={data} value={data}>{formatLongDate(data)}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className={periodoEntrega === "manha" ? "bg-forest px-3 py-3 text-sm text-paper" : "border border-ink/15 px-3 py-3 text-sm"} onClick={() => setPeriodoEntrega("manha")}>
                        Manhã · 8h–12h
                      </button>
                      <button type="button" className={periodoEntrega === "tarde" ? "bg-forest px-3 py-3 text-sm text-paper" : "border border-ink/15 px-3 py-3 text-sm"} onClick={() => setPeriodoEntrega("tarde")}>
                        Tarde · 13h–17h
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <p className="text-sm font-medium sm:col-span-2">Onde entregar?</p>
                    <label className="block text-sm sm:col-span-2">
                      CEP
                      <input value={endereco.cep} onChange={(event) => void preencherCep(event.target.value)} inputMode="numeric" autoComplete="postal-code" className="mt-1 w-full border border-ink/15 px-3 py-3" />
                      {buscandoCep ? <span className="text-xs text-ink/50">Buscando CEP…</span> : null}
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Rua / avenida
                      <input value={endereco.logradouro} onChange={(event) => setEndereco((atual) => ({ ...atual, logradouro: event.target.value }))} autoComplete="street-address" className="mt-1 w-full border border-ink/15 px-3 py-3" />
                    </label>
                    <label className="block text-sm">
                      Número
                      <input value={endereco.numero} onChange={(event) => setEndereco((atual) => ({ ...atual, numero: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
                    </label>
                    <label className="block text-sm">
                      Complemento <span className="font-normal text-ink/45">(opcional)</span>
                      <input value={endereco.complemento} onChange={(event) => setEndereco((atual) => ({ ...atual, complemento: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      Bairro
                      <input value={endereco.bairro} onChange={(event) => setEndereco((atual) => ({ ...atual, bairro: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
                    </label>
                    <label className="block text-sm">
                      Cidade
                      <input value={endereco.cidade} onChange={(event) => setEndereco((atual) => ({ ...atual, cidade: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
                    </label>
                    <label className="block text-sm">
                      UF
                      <input value={endereco.estado} onChange={(event) => setEndereco((atual) => ({ ...atual, estado: event.target.value.slice(0, 2).toUpperCase() }))} className="mt-1 w-full border border-ink/15 px-3 py-3" maxLength={2} />
                    </label>
                  </div>
                  <label className="block text-sm">
                    Observação <span className="font-normal text-ink/45">(opcional)</span>
                    <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={2} placeholder="Ex.: portão azul, deixar com o porteiro" className="mt-1 w-full border border-ink/15 px-3 py-3" />
                  </label>
                  <Button
                    type="button"
                    onClick={() => {
                      const cep = endereco.cep.replace(/\D/g, "");
                      if (!dataEntrega) {
                        toast.error("Escolha a data de entrega.");
                        return;
                      }
                      if (cep.length !== 8) {
                        toast.error("Informe um CEP válido.");
                        return;
                      }
                      if (endereco.logradouro.trim().length < 2 || !endereco.numero.trim() || endereco.bairro.trim().length < 2) {
                        toast.error("Complete o endereço de entrega.");
                        return;
                      }
                      setCheckoutPasso(2);
                    }}
                  >
                    Continuar para o pagamento
                  </Button>
                </div>
              ) : null}

              {checkoutPasso === 2 ? (
                <div className="space-y-4">
                  <p className="text-sm text-ink/70">Escolha como pagar. A cobrança só é gerada no próximo passo.</p>
                  <div className="grid gap-2">
                    <button type="button" className={formaPagamento === "pix" ? "bg-forest px-4 py-4 text-left text-paper" : "border border-ink/15 px-4 py-4 text-left"} onClick={() => setFormaPagamento("pix")}>
                      <span className="block text-base font-medium">Pix</span>
                      <span className={formaPagamento === "pix" ? "text-sm text-paper/85" : "text-sm text-ink/60"}>{reais(total)} · sem taxa · recomendado</span>
                    </button>
                    <button type="button" className={formaPagamento === "cartao" ? "bg-forest px-4 py-4 text-left text-paper" : "border border-ink/15 px-4 py-4 text-left"} onClick={() => setFormaPagamento("cartao")}>
                      <span className="block text-base font-medium">Cartão de crédito</span>
                      <span className={formaPagamento === "cartao" ? "text-sm text-paper/85" : "text-sm text-ink/60"}>{reais(totalNoCartao(total))} · inclui +5% da operadora</span>
                    </button>
                  </div>
                  {formaPagamento === "cartao" ? (
                    <p className="text-xs text-ink/55">Os 5% cobrem a taxa da operadora. No Pix esse valor não é cobrado.</p>
                  ) : (
                    <p className="text-xs text-ink/55">Pagamento instantâneo. A entrega só libera depois da confirmação.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="border border-ink/15 px-3 py-2 text-sm" onClick={() => setCheckoutPasso(1)}>Voltar</button>
                    <Button type="button" onClick={() => setCheckoutPasso(3)}>Revisar e confirmar</Button>
                  </div>
                </div>
              ) : null}

              {checkoutPasso === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-2 rounded-sm border border-ink/10 bg-white p-4 text-sm">
                    <p className="font-medium">Resumo</p>
                    <p className="text-ink/70">Entrega {formatLongDate(dataEntrega)} · {periodoEntrega === "manha" ? "manhã" : "tarde"}</p>
                    <p className="text-ink/70">{endereco.logradouro}, {endereco.numero}{endereco.complemento ? ` · ${endereco.complemento}` : ""} — {endereco.bairro}, {endereco.cidade}/{endereco.estado}</p>
                    <div className="flex justify-between gap-3 border-t border-ink/10 pt-2">
                      <span className="text-ink/65">Produtos</span>
                      <span className="tabular-nums">{reais(total)}</span>
                    </div>
                    {formaPagamento === "cartao" ? (
                      <div className="flex justify-between gap-3 text-ink/65">
                        <span>Taxa do cartão (5%)</span>
                        <span className="tabular-nums">{reais(totalNoCartao(total) - total)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-3 border-t border-ink/10 pt-2 text-base font-medium">
                      <span>{formaPagamento === "pix" ? "Total no Pix" : "Total no cartão"}</span>
                      <span className="tabular-nums">{reais(totalNaForma(total, formaPagamento))}</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink/50">Pagamento seguro via Conta Azul. Depois você ainda pode trocar Pix/cartão ou cancelar enquanto estiver aguardando pagamento.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="border border-ink/15 px-3 py-2 text-sm" disabled={enviando} onClick={() => setCheckoutPasso(2)}>Voltar</button>
                    <Button type="button" disabled={enviando || (minimo > 0 && total < minimo)} onClick={() => void concluirCheckoutPessoa()}>
                      {enviando
                        ? "Gerando pagamento…"
                        : formaPagamento === "pix"
                          ? `Confirmar e pagar ${reais(total)}`
                          : `Confirmar e pagar ${reais(totalNoCartao(total))}`}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {pagamentoAberto ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="pagamento-titulo">
            <div className="w-full max-w-md space-y-4 rounded-sm bg-paper p-6 shadow-lg">
              <h2 id="pagamento-titulo" className="display-head text-2xl">
                {pagamentoAberto.formaPagamento === "cartao" ? "Pagar no cartão" : "Pagar com Pix"}
              </h2>
              <div className="space-y-1 rounded-sm border border-ink/10 bg-white p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-ink/65">Valor da cobrança</span>
                  <span className="text-base font-medium tabular-nums">{pagamentoAberto.total != null ? reais(pagamentoAberto.total) : "—"}</span>
                </div>
                {pagamentoAberto.formaPagamento === "cartao" ? (
                  <p className="text-xs text-ink/55">Inclui taxa de 5% do cartão. A entrega só libera após a confirmação do pagamento.</p>
                ) : (
                  <p className="text-xs text-ink/55">Pix sem taxa. A entrega só libera após a confirmação do pagamento.</p>
                )}
              </div>
              {!pagamentoAberto.pixUrl && !pagamentoAberto.cartaoUrl ? (
                <p className="text-sm text-ink/65">O link ainda está sendo liberado. Aguarde alguns segundos e toque em “Buscar link”.</p>
              ) : null}
              <div className="flex flex-col gap-2">
                {pagamentoAberto.formaPagamento !== "cartao" && pagamentoAberto.pixUrl ? (
                  <a
                    href={pagamentoAberto.pixUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-forest px-4 py-3 text-center text-sm text-paper"
                  >
                    Abrir Pix agora
                  </a>
                ) : null}
                {pagamentoAberto.formaPagamento !== "pix" && pagamentoAberto.cartaoUrl ? (
                  <a
                    href={pagamentoAberto.cartaoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-forest px-4 py-3 text-center text-sm text-paper"
                  >
                    Abrir pagamento no cartão
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                className="text-sm text-forest"
                onClick={() => {
                  const id = pagamentoAberto.pedidoId;
                  void portalApi
                    .pagamentoPedido(id)
                    .then((pagamento) => {
                      if (pagamento.pago) {
                        toast.success("Pagamento confirmado. Pedido liberado para a fazenda.");
                        setPagamentoAberto(null);
                        void carregarConta();
                        return;
                      }
                      const forma =
                        pagamento.formaPagamento ??
                        (pagamento.pixUrl ? "pix" : pagamento.cartaoUrl ? "cartao" : null);
                      const url = forma === "cartao" ? pagamento.cartaoUrl : pagamento.pixUrl;
                      setPagamentoAberto({
                        ...pagamento,
                        pixUrl: forma === "pix" ? pagamento.pixUrl : null,
                        cartaoUrl: forma === "cartao" ? pagamento.cartaoUrl : null,
                        formaPagamento: forma,
                        pedidoId: id,
                        linkPendente: !url,
                      });
                      if (url) {
                        toast.success("Link de pagamento pronto.");
                        window.open(url, "_blank", "noopener,noreferrer");
                      } else {
                        toast.message("Link ainda não liberado. Tente de novo em instantes.");
                      }
                    })
                    .catch((error) => toast.error(mensagem(error)));
                }}
              >
                {!pagamentoAberto.pixUrl && !pagamentoAberto.cartaoUrl ? "Buscar link de pagamento" : "Já paguei · atualizar status"}
              </button>
              <p className="text-xs text-ink/50">
                Precisa trocar Pix/cartão ou cancelar? Feche e use as opções em “Meus pedidos”. A cobrança antiga deixa de valer.
              </p>
              <button type="button" className="block text-sm text-ink/55" onClick={() => setPagamentoAberto(null)}>
                Fechar
              </button>
            </div>
          </div>
        ) : null}
        {vista !== "equipe" ? (
          <p className="mt-16 text-sm text-ink/40">
            <a href="/pedidos/equipe">Acesso da equipe</a>
          </p>
        ) : null}
      </main>

      {vista === "loja" && itensCarrinho > 0 && !checkoutAberto && !pagamentoAberto ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 p-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 bg-forest px-4 py-3 text-sm text-paper disabled:opacity-50"
            disabled={enviando || (emAtraso && Boolean(cliente) && !ehPessoa(cliente)) || (Boolean(cliente) && minimo > 0 && total < minimo)}
            onClick={() => {
              if (!cliente) {
                document.getElementById("enviar-pedido")?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
              }
              void abrirCheckout();
            }}
          >
            <span>
              {itensCarrinho} {itensCarrinho === 1 ? "item" : "itens"}
              {precoDaConta ? ` · ${reais(total)}` : ""}
            </span>
            <span className="font-medium">
              {!cliente ? "Entrar para pedir" : ehPessoa(cliente) ? "Continuar" : "Enviar pedido"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CartaoProduto({
  produto,
  qtd,
  onQtd,
}: {
  produto: ProdutoLoja;
  qtd: number;
  onQtd: (produto: ProdutoLoja, qtd: number) => void;
}) {
  const esgotado = produto.estoque === 0;
  const peso = pesoDoItem(produto.nome, produto.peso, produto.unidade);
  return (
    <article className="overflow-hidden rounded-sm border border-ink/10 bg-white">
      {produto.imagemUrl ? (
        <img
          key={produto.imagemUrl}
          src={produto.imagemUrl}
          alt=""
          className="aspect-[4/5] w-full bg-ink/5 object-cover"
          onError={(event) => {
            event.currentTarget.removeAttribute("src");
          }}
        />
      ) : (
        <div className="aspect-[4/5] w-full bg-ink/5" />
      )}
      <div className="space-y-2 p-3">
        <h3 className="text-[0.95rem] leading-tight">{nomeSemPeso(produto.nome)}</h3>
        {peso ? <p className="text-xs font-medium text-forest">Peso {peso}</p> : null}
        <p className="line-clamp-2 text-xs leading-relaxed text-ink/70">{produto.descricao}</p>
        <p className="line-clamp-2 text-xs text-ink/50">{produto.aplicacao}</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-sm font-medium">
            {produto.preco != null ? (
              <>
                {reais(produto.preco)}
                <span className="ml-1 text-xs font-normal text-ink/50">/{produto.unidade}</span>
              </>
            ) : (
              "Entre para ver o preço"
            )}
          </p>
          {produto.precoEspecial ? <p className="text-[0.65rem] text-forest">Preço combinado</p> : null}
        </div>
        {produto.estoque != null ? <p className="text-[0.65rem] text-ink/50">{esgotado ? "Esgotado" : `Disponível: ${produto.estoque} ${produto.unidade}`}</p> : null}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onQtd(produto, qtd - 1)} disabled={qtd <= 0}>−</Button>
          <span className="w-6 text-center text-sm tabular-nums">{qtd}</span>
          <Button type="button" size="sm" onClick={() => onQtd(produto, qtd + 1)} disabled={esgotado || (produto.estoque != null && qtd >= produto.estoque)}>+</Button>
        </div>
      </div>
    </article>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  inputMode?: "numeric" | "tel" | "email";
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-ink/15 bg-white px-3 py-3 read-only:bg-ink/5"
      />
    </label>
  );
}

function CampoSenha({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input type="password" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full border border-ink/15 bg-white px-3 py-3" />
    </label>
  );
}

function base64DosBytes(bytes: Uint8Array): string {
  let binario = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    const fatia = bytes.subarray(i, i + passo);
    binario += String.fromCharCode.apply(null, Array.from(fatia));
  }
  return btoa(binario);
}

function pareceHeic(arquivo: File): boolean {
  const nome = arquivo.name.toLowerCase();
  return nome.endsWith(".heic") || nome.endsWith(".heif") || arquivo.type === "image/heic" || arquivo.type === "image/heif";
}

async function blobParaJpeg(origem: Blob): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(origem);
  } catch {
    throw new Error("Não consegui abrir essa foto. Escolha JPG, PNG ou WEBP.");
  }
  const limite = 1400;
  const escala = Math.min(1, limite / Math.max(bitmap.width, bitmap.height));
  const largura = Math.max(1, Math.round(bitmap.width * escala));
  const altura = Math.max(1, Math.round(bitmap.height * escala));
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  const contexto = tela.getContext("2d");
  if (!contexto) throw new Error("Não foi possível ler a foto.");
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, largura, altura);
  contexto.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();
  let qualidade = 0.82;
  let blob: Blob | null = null;
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    blob = await new Promise<Blob | null>((resolve) => tela.toBlob(resolve, "image/jpeg", qualidade));
    if (blob && blob.size <= 1_200_000) break;
    qualidade -= 0.15;
  }
  if (!blob) throw new Error("Não foi possível ler a foto.");
  if (blob.size > 1_400_000) throw new Error("Essa foto ficou grande demais. Escolha outra, ou uma menor.");
  return base64DosBytes(new Uint8Array(await blob.arrayBuffer()));
}

async function arquivoParaJpeg(arquivo: File): Promise<string> {
  if (pareceHeic(arquivo)) {
    if (arquivo.size > 12_000_000) throw new Error("Essa foto ficou grande demais. Escolha outra, ou uma menor.");
    return base64DosBytes(new Uint8Array(await arquivo.arrayBuffer()));
  }
  return blobParaJpeg(arquivo);
}

function ContaPessoa({ nome, onSalvo }: { nome: string; onSalvo: () => void }) {
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [endereco, setEndereco] = useState(enderecoVazio);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void portalApi
      .endereco()
      .then((dados) => {
        setTelefone(dados.telefone || "");
        setEmail(dados.email || "");
        setDocumento(dados.documento || "");
        setEndereco({ ...enderecoVazio, ...dados.endereco, complemento: dados.endereco.complemento || "" });
      })
      .catch((error) => toast.error(mensagem(error)));
  }, []);

  const preencherCep = async (valor: string) => {
    const cep = formatarCep(valor);
    setEndereco((atual) => ({ ...atual, cep }));
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscandoCep(true);
    try {
      const achado = await buscarCep(cep);
      if (!achado) {
        toast.error("CEP não encontrado.");
        return;
      }
      setEndereco((atual) => ({
        ...atual,
        cep: formatarCep(achado.cep),
        logradouro: achado.logradouro || atual.logradouro,
        bairro: achado.bairro || atual.bairro,
        cidade: achado.cidade || atual.cidade,
        estado: achado.estado || atual.estado,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  return (
    <form
      className="mt-8 max-w-3xl space-y-4 rounded-sm border border-ink/10 bg-white p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setEnviando(true);
        void portalApi
          .salvarEndereco({
            telefone,
            endereco: {
              ...endereco,
              cep: endereco.cep.replace(/\D/g, ""),
              estado: endereco.estado.toUpperCase().slice(0, 2),
            },
          })
          .then((salvo) => {
            setTelefone(salvo.telefone);
            setEndereco({ ...enderecoVazio, ...salvo.endereco, complemento: salvo.endereco.complemento || "" });
            toast.success(salvo.mensagem || "Dados salvos.");
            onSalvo();
          })
          .catch((error) => toast.error(mensagem(error)))
          .finally(() => setEnviando(false));
      }}
    >
      <h2 className="display-head text-2xl">Minha conta</h2>
      <p className="text-sm text-ink/65">Atualize telefone e endereço de entrega. Eles entram no próximo pedido e no pagamento.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" value={nome} onChange={() => undefined} readOnly />
        <Campo label="CPF" value={formatDocumento(documento)} onChange={() => undefined} readOnly />
        <Campo label="E-mail" value={email} onChange={() => undefined} type="email" readOnly />
        <Campo label="Telefone / WhatsApp" value={telefone} onChange={setTelefone} inputMode="tel" />
        <label className="block text-sm sm:col-span-2">
          CEP
          <input value={endereco.cep} onChange={(event) => void preencherCep(event.target.value)} inputMode="numeric" className="mt-1 w-full border border-ink/15 px-3 py-3" />
          {buscandoCep ? <span className="text-xs text-ink/50">Buscando CEP…</span> : null}
        </label>
        <label className="block text-sm sm:col-span-2">
          Rua / avenida
          <input value={endereco.logradouro} onChange={(event) => setEndereco((a) => ({ ...a, logradouro: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
        </label>
        <label className="block text-sm">
          Número
          <input value={endereco.numero} onChange={(event) => setEndereco((a) => ({ ...a, numero: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
        </label>
        <label className="block text-sm">
          Complemento
          <input value={endereco.complemento} onChange={(event) => setEndereco((a) => ({ ...a, complemento: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
        </label>
        <label className="block text-sm sm:col-span-2">
          Bairro
          <input value={endereco.bairro} onChange={(event) => setEndereco((a) => ({ ...a, bairro: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
        </label>
        <label className="block text-sm">
          Cidade
          <input value={endereco.cidade} onChange={(event) => setEndereco((a) => ({ ...a, cidade: event.target.value }))} className="mt-1 w-full border border-ink/15 px-3 py-3" />
        </label>
        <label className="block text-sm">
          UF
          <input value={endereco.estado} onChange={(event) => setEndereco((a) => ({ ...a, estado: event.target.value.slice(0, 2).toUpperCase() }))} className="mt-1 w-full border border-ink/15 px-3 py-3" maxLength={2} />
        </label>
      </div>
      <Button type="submit" disabled={enviando}>{enviando ? "Salvando…" : "Salvar dados de entrega"}</Button>
    </form>
  );
}

function CartaoPedido({
  pedido,
  ocupado,
  onCancelar,
  onTrocarPagamento,
  onAbrirPagamento,
}: {
  pedido: PedidoCliente;
  ocupado: boolean;
  onCancelar: (pedido: PedidoCliente) => void;
  onTrocarPagamento: (pedido: PedidoCliente, forma: "pix" | "cartao") => void;
  onAbrirPagamento: (pedido: PedidoCliente) => void;
}) {
  const formaAtual =
    pedido.pagamento?.formaPagamento ??
    (pedido.pagamento?.pixUrl ? "pix" : pedido.pagamento?.cartaoUrl ? "cartao" : null);
  const outraForma: "pix" | "cartao" | null = formaAtual === "pix" ? "cartao" : formaAtual === "cartao" ? "pix" : null;
  const baseProdutos = baseItensPedido(pedido);

  const aguardando = pedido.pagamento?.status === "AGUARDANDO";

  return (
    <article className={aguardando ? "rounded-sm border border-forest/35 bg-white p-5" : "rounded-sm border border-ink/10 bg-white p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg">{formatLongDate(pedido.dataEntrega.slice(0, 10))}</h3>
          <p className={aguardando ? "text-sm font-medium text-forest" : "text-sm text-ink/55"}>{statusPedido(pedido)}</p>
        </div>
        {aguardando && pedido.pagamento?.total != null ? (
          <p className="text-lg font-medium tabular-nums">{reais(pedido.pagamento.total)}</p>
        ) : null}
      </div>
      {formaAtual && aguardando ? (
        <p className="mt-1 text-sm text-ink/70">
          {formaAtual === "pix" ? "Pix · sem taxa" : "Cartão · inclui +5%"}
        </p>
      ) : null}
      <ul className="mt-3 space-y-1 text-sm">
        {pedido.itens.map((item) => {
          const peso = pesoDoItem(item.nome, item.peso);
          const linha = item.preco != null ? item.preco * item.quantidade : null;
          return (
            <li key={`${pedido.id}-${item.nome}`} className="flex justify-between gap-3">
              <span>
                {item.quantidade}× {nomeSemPeso(item.nome)}
                {peso ? ` · ${peso}` : ""}
              </span>
              {linha != null ? <span className="shrink-0 tabular-nums text-ink/70">{reais(linha)}</span> : null}
            </li>
          );
        })}
      </ul>
      {baseProdutos > 0 && !aguardando ? (
        <p className="mt-2 text-xs text-ink/50">Produtos {reais(baseProdutos)}</p>
      ) : null}
      {aguardando || podeCancelarPedido(pedido) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {aguardando ? (
            <button type="button" className="bg-forest px-4 py-2.5 text-sm text-paper disabled:opacity-50" disabled={ocupado} onClick={() => onAbrirPagamento(pedido)}>
              {formaAtual === "cartao" || (!formaAtual && pedido.pagamento?.cartaoUrl)
                ? pedido.pagamento?.cartaoUrl
                  ? "Pagar no cartão"
                  : "Abrir pagamento"
                : pedido.pagamento?.pixUrl
                  ? "Pagar com Pix"
                  : "Abrir pagamento"}
            </button>
          ) : null}
          {podeTrocarPagamento(pedido) && outraForma ? (
            <button
              type="button"
              className="border border-ink/15 px-3 py-2 text-sm disabled:opacity-50"
              disabled={ocupado}
              onClick={() => onTrocarPagamento(pedido, outraForma)}
            >
              {outraForma === "pix"
                ? `Trocar para Pix (${reais(baseProdutos)})`
                : `Trocar para cartão (${reais(totalNoCartao(baseProdutos))})`}
            </button>
          ) : null}
          {podeCancelarPedido(pedido) ? (
            <button type="button" className="border border-ink/15 px-3 py-2 text-sm text-red-800 disabled:opacity-50" disabled={ocupado} onClick={() => onCancelar(pedido)}>
              Cancelar
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PedidosCliente({
  pedidos,
  verHistorico,
  onHistorico,
  onLoja,
  onAtualizar,
  onPagamento,
}: {
  pedidos: PedidoCliente[];
  verHistorico: boolean;
  onHistorico: () => void;
  onLoja: () => void;
  onAtualizar: () => void | Promise<void>;
  onPagamento: (pagamento: PedidoPagamento & { pedidoId: string }) => void;
}) {
  const [ocupadoId, setOcupadoId] = useState("");
  const ocupadoRef = useRef(false);
  const hoje = hojeManaus();
  const programados = pedidos
    .filter((pedido) => pedido.programado ?? (pedido.dataEntrega.slice(0, 10) >= hoje && pedido.status !== "CANCELADO"))
    .sort((a, b) => {
      const aPay = a.pagamento?.status === "AGUARDANDO" ? 0 : 1;
      const bPay = b.pagamento?.status === "AGUARDANDO" ? 0 : 1;
      if (aPay !== bPay) return aPay - bPay;
      return a.dataEntrega.localeCompare(b.dataEntrega);
    });
  const historico = pedidos
    .filter((pedido) => !(pedido.programado ?? (pedido.dataEntrega.slice(0, 10) >= hoje && pedido.status !== "CANCELADO")))
    .sort((a, b) => b.dataEntrega.localeCompare(a.dataEntrega));

  const cancelar = async (pedido: PedidoCliente) => {
    if (ocupadoRef.current) return;
    const quando = formatLongDate(pedido.dataEntrega.slice(0, 10));
    if (
      !window.confirm(
        `Cancelar o pedido de ${quando}?\n\nA cobrança em aberto deixa de valer e o estoque volta para a loja.`,
      )
    ) {
      return;
    }
    ocupadoRef.current = true;
    setOcupadoId(pedido.id);
    try {
      await portalApi.cancelarPedido(pedido.id);
      toast.success("Pedido cancelado. Cobrança invalidada.");
      await onAtualizar();
    } catch (error) {
      toast.error(mensagem(error) || "Não foi possível cancelar.");
    } finally {
      ocupadoRef.current = false;
      setOcupadoId("");
    }
  };

  const trocarPagamento = async (pedido: PedidoCliente, forma: "pix" | "cartao") => {
    if (ocupadoRef.current) return;
    const base = baseItensPedido(pedido);
    const atual = pedido.pagamento?.total ?? base;
    const novo = totalNaForma(base, forma);
    const ok = window.confirm(
      forma === "cartao"
        ? `Trocar para cartão?\n\nDe ${reais(atual)} para ${reais(novo)} (produtos + taxa de 5%).\nA cobrança Pix atual deixa de valer.`
        : `Trocar para Pix?\n\nDe ${reais(atual)} para ${reais(novo)} (sem taxa de cartão).\nA cobrança no cartão atual deixa de valer.`,
    );
    if (!ok) return;
    ocupadoRef.current = true;
    setOcupadoId(pedido.id);
    toast.message(forma === "pix" ? "Gerando Pix…" : "Gerando link do cartão (+5%)…");
    try {
      const cobranca = await portalApi.alterarFormaPagamento(pedido.id, forma);
      const formaOk = cobranca.formaPagamento ?? forma;
      const url = formaOk === "cartao" ? cobranca.cartaoUrl : cobranca.pixUrl;
      const baseItens = base;
      const esperado = totalNaForma(baseItens, formaOk);
      // Não misturar forma nem valor (ex.: Pix com taxa de cartão).
      if (
        formaOk !== forma ||
        (forma === "cartao" && cobranca.pixUrl && !cobranca.cartaoUrl) ||
        (forma === "pix" && cobranca.cartaoUrl && !cobranca.pixUrl) ||
        (baseItens > 0 && cobranca.total != null && Math.abs(cobranca.total - esperado) > 0.02)
      ) {
        toast.error("A troca não confirmou forma/valor corretos. Atualize a página e tente de novo.");
        await onAtualizar();
        return;
      }
      toast.success(
        cobranca.mensagem ||
          (formaOk === "pix" ? "Agora é Pix." : `Agora é cartão · ${reais(cobranca.total ?? 0)} (com taxa de 5%).`),
      );
      await onAtualizar();
      onPagamento({
        status: cobranca.status,
        pixUrl: formaOk === "pix" ? cobranca.pixUrl : null,
        cartaoUrl: formaOk === "cartao" ? cobranca.cartaoUrl : null,
        total: cobranca.total,
        formaPagamento: formaOk,
        pedidoId: pedido.id,
        linkPendente: !url,
      });
      if (!url) toast.message("Cobrança criada. O link ainda está sendo liberado — use Buscar link em instantes.");
    } catch (error) {
      toast.error(mensagem(error) || "Não foi possível alterar o pagamento.");
      await onAtualizar().catch(() => undefined);
    } finally {
      ocupadoRef.current = false;
      setOcupadoId("");
    }
  };

  const abrirPagamento = (pedido: PedidoCliente) => {
    if (!pedido.pagamento) return;
    const forma =
      pedido.pagamento.formaPagamento ??
      (pedido.pagamento.pixUrl ? "pix" : pedido.pagamento.cartaoUrl ? "cartao" : null);
    // Abre o modal; o cliente escolhe o botão de pagar (evita popup bloqueado / confusão).
    onPagamento({
      ...pedido.pagamento,
      pixUrl: forma === "pix" ? pedido.pagamento.pixUrl : null,
      cartaoUrl: forma === "cartao" ? pedido.pagamento.cartaoUrl : null,
      formaPagamento: forma,
      pedidoId: pedido.id,
      linkPendente: !(forma === "cartao" ? pedido.pagamento.cartaoUrl : pedido.pagamento.pixUrl),
    });
  };

  return (
    <section className="mt-8 space-y-4">
      <h2 className="display-head text-3xl">Meus pedidos</h2>
      <p className="text-sm text-ink/60">
        Aqui você acompanha entregas, paga Pix/cartão, troca a forma de pagamento ou cancela enquanto estiver em aberto.
      </p>
      {programados.some((p) => p.pagamento?.status === "AGUARDANDO") ? (
        <p className="border border-forest/25 bg-forest/5 px-4 py-3 text-sm text-ink">
          Há pedido aguardando pagamento abaixo. Conclua para liberar a entrega.
        </p>
      ) : null}
      {programados.length === 0 ? (
        <div className="space-y-3 rounded-sm border border-dashed border-ink/20 bg-white/60 p-6">
          <p className="text-ink/70">Nenhum pedido em aberto.</p>
          <Button type="button" onClick={onLoja}>Ir para a loja</Button>
        </div>
      ) : null}
      {programados.map((pedido) => (
        <CartaoPedido
          key={pedido.id}
          pedido={pedido}
          ocupado={ocupadoId === pedido.id}
          onCancelar={(item) => void cancelar(item)}
          onTrocarPagamento={(item, forma) => void trocarPagamento(item, forma)}
          onAbrirPagamento={abrirPagamento}
        />
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" className="border border-ink/15 px-3 py-2 text-sm" onClick={onHistorico}>
          {verHistorico ? "Ocultar entregas anteriores" : "Ver entregas anteriores"}
        </button>
        {programados.length > 0 ? (
          <button type="button" className="text-sm text-forest" onClick={onLoja}>Fazer outro pedido</button>
        ) : null}
      </div>
      {verHistorico ? (
        <div className="space-y-3">
          <h2 className="display-head text-2xl">Entregas anteriores</h2>
          {historico.length === 0 ? <p className="text-ink/60">Nenhuma entrega anterior neste período.</p> : null}
          {historico.map((pedido) => (
            <CartaoPedido
              key={pedido.id}
              pedido={pedido}
              ocupado={ocupadoId === pedido.id}
              onCancelar={(item) => void cancelar(item)}
              onTrocarPagamento={(item, forma) => void trocarPagamento(item, forma)}
              onAbrirPagamento={abrirPagamento}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CartaoPagamento({
  titulo,
  baixandoDoc,
  onBaixar,
}: {
  titulo: TituloCliente;
  baixandoDoc: string;
  onBaixar: (id: string, tipo: "boleto" | "nota") => void;
}) {
  return (
    <article className="rounded-sm border border-ink/10 bg-white p-5">
      <h3 className="text-lg">{titulo.descricao || "Pagamento"}</h3>
      <p className="mt-1 text-sm text-ink/60">
        {titulo.vencimento ? `Vence ${formatLongDate(titulo.vencimento.slice(0, 10))}` : "Sem vencimento"}
        {titulo.pagamento ? ` · pago ${formatLongDate(titulo.pagamento.slice(0, 10))}` : ""}
      </p>
      <p className="mt-2">{titulo.emAberto > 0 ? reais(titulo.emAberto) : reais(titulo.valor)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="border border-ink/15 px-3 py-2 text-sm disabled:opacity-50"
          disabled={baixandoDoc === `boleto:${titulo.id}`}
          onClick={() => onBaixar(titulo.id, "boleto")}
        >
          Baixar boleto
        </button>
        <button
          type="button"
          className="border border-ink/15 px-3 py-2 text-sm disabled:opacity-50"
          disabled={baixandoDoc === `nota:${titulo.id}`}
          onClick={() => onBaixar(titulo.id, "nota")}
        >
          Baixar nota fiscal
        </button>
      </div>
    </article>
  );
}

function Pagamentos({
  titulos,
  aviso,
  verHistorico,
  baixandoDoc,
  onHistorico,
  onBaixar,
}: {
  titulos: TituloCliente[];
  aviso: string;
  verHistorico: boolean;
  baixandoDoc: string;
  onHistorico: () => void;
  onBaixar: (id: string, tipo: "boleto" | "nota") => void;
}) {
  const hoje = hojeManaus();
  const emAtraso = titulos
    .filter((titulo) => tituloEmAtraso(titulo, hoje))
    .sort((a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? ""));
  const idsAtraso = new Set(emAtraso.map((titulo) => titulo.id));
  const aVencer = titulos
    .filter((titulo) => titulo.emAberto > 0.009 && !idsAtraso.has(titulo.id))
    .sort((a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? ""));
  const historico = titulos
    .filter((titulo) => titulo.emAberto <= 0.009)
    .sort((a, b) => (b.pagamento ?? b.vencimento ?? "").localeCompare(a.pagamento ?? a.vencimento ?? ""));

  return (
    <section className="mt-8 space-y-8">
      {aviso ? <p className="text-sm text-ink/70">{aviso}</p> : null}
      <div className="space-y-3">
        <h2 className="display-head text-3xl">Em atraso</h2>
        {emAtraso.length === 0 ? <p className="text-ink/60">Nenhum pagamento em atraso.</p> : null}
        {emAtraso.map((titulo) => (
          <CartaoPagamento key={titulo.id} titulo={titulo} baixandoDoc={baixandoDoc} onBaixar={onBaixar} />
        ))}
      </div>
      <div className="space-y-3">
        <h2 className="display-head text-3xl">A vencer</h2>
        {aVencer.length === 0 ? <p className="text-ink/60">Nenhum pagamento a vencer.</p> : null}
        {aVencer.map((titulo) => (
          <CartaoPagamento key={titulo.id} titulo={titulo} baixandoDoc={baixandoDoc} onBaixar={onBaixar} />
        ))}
      </div>
      <button type="button" className="border border-ink/15 px-3 py-2 text-sm" onClick={onHistorico}>
        {verHistorico ? "Ocultar histórico" : "Ver histórico"}
      </button>
      {verHistorico ? (
        <div className="space-y-3">
          <h2 className="display-head text-3xl">Histórico</h2>
          {historico.length === 0 ? <p className="text-ink/60">Nenhum pagamento quitado neste período.</p> : null}
          {historico.map((titulo) => (
            <CartaoPagamento key={titulo.id} titulo={titulo} baixandoDoc={baixandoDoc} onBaixar={onBaixar} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

type CadastroEquipe = {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  cidade: string;
  estado: string;
  status: string;
  erro: string | null;
};

type FiltroLojaEquipe = "todos" | "ativos" | "inativos";
type AlertaCatalogo = "todos" | "semPreco" | "semFoto" | "estoqueZero" | "exclusivos";
type AbaEquipe = "catalogo" | "cadastros" | "ferramentas";

type RascunhoProduto = {
  grupo: string;
  preco: string;
  estoque: string;
  descricao: string;
  aplicacao: string;
  naLoja: boolean;
  exclusivo: boolean;
};

function rascunhoDe(produto: ProdutoEquipe): RascunhoProduto {
  return {
    grupo: normalizarGrupo(produto.grupo),
    preco: produto.preco?.toString() ?? "",
    estoque: produto.estoque == null ? "" : String(produto.estoque),
    descricao: produto.descricao,
    aplicacao: produto.aplicacao,
    naLoja: produto.naLoja,
    exclusivo: produto.exclusivo,
  };
}

function estoqueIgual(a: string, b: number | null) {
  const va = a.trim() === "" ? null : Number(a.replace(",", "."));
  if (va == null && b == null) return true;
  if (va == null || b == null) return false;
  return Math.abs(va - b) < 0.0005;
}

function rascunhoSujo(produto: ProdutoEquipe, rascunho: RascunhoProduto) {
  const precoNum = Number(rascunho.preco.replace(",", "."));
  const precoBase = produto.preco ?? NaN;
  return (
    normalizarGrupo(rascunho.grupo) !== normalizarGrupo(produto.grupo) ||
    rascunho.descricao !== produto.descricao ||
    rascunho.aplicacao !== produto.aplicacao ||
    rascunho.naLoja !== produto.naLoja ||
    rascunho.exclusivo !== produto.exclusivo ||
    !estoqueIgual(rascunho.estoque, produto.estoque) ||
    !(Number.isFinite(precoNum) && Number.isFinite(precoBase) && Math.abs(precoNum - precoBase) < 0.005)
  );
}

function kpisCatalogo(produtos: ProdutoEquipe[], cadastros: CadastroEquipe[]) {
  return {
    total: produtos.length,
    ativos: produtos.filter((p) => p.naLoja).length,
    inativos: produtos.filter((p) => !p.naLoja).length,
    semPreco: produtos.filter((p) => p.preco == null || p.preco <= 0).length,
    semFoto: produtos.filter((p) => !p.imagemUrl).length,
    estoqueZero: produtos.filter((p) => p.estoque === 0).length,
    exclusivos: produtos.filter((p) => p.exclusivo).length,
    cadastrosPendentes: cadastros.filter((c) => c.status !== "ENVIADO").length,
  };
}

function PainelEquipe({
  nome,
  produtos,
  cadastros,
  onSair,
  onAtualizar,
  onSalvar,
  onFoto,
  onCadastros,
}: {
  nome: string;
  produtos: ProdutoEquipe[];
  cadastros: CadastroEquipe[];
  onSair: () => void;
  onAtualizar: () => Promise<void>;
  onSalvar: (
    produto: ProdutoEquipe,
    patch: {
      naLoja?: boolean;
      exclusivo?: boolean;
      preco?: number;
      imagemUrl?: string | null;
      descricao?: string;
      aplicacao?: string;
      estoque?: number | null;
      grupo?: string;
    },
  ) => Promise<void>;
  onFoto: (produto: ProdutoEquipe, imagem: string) => Promise<string>;
  onCadastros: (lista: CadastroEquipe[]) => void;
}) {
  const [aba, setAba] = useState<AbaEquipe>("catalogo");
  const [grupoFiltro, setGrupoFiltro] = useState("Tudo");
  const [lojaFiltro, setLojaFiltro] = useState<FiltroLojaEquipe>("todos");
  const [alertaFiltro, setAlertaFiltro] = useState<AlertaCatalogo>("todos");
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [emailConvite, setEmailConvite] = useState("");
  const [linksConvite, setLinksConvite] = useState<Array<{ nome: string; email: string; link: string }>>([]);
  const [nomesClasse, setNomesClasse] = useState<Record<string, string>>({});
  const [rascunhos, setRascunhos] = useState<Record<string, RascunhoProduto>>({});

  const kpis = useMemo(() => kpisCatalogo(produtos, cadastros), [produtos, cadastros]);
  const gruposDisponiveis = useMemo(() => {
    const presentes = new Set(
      produtos.map((p) => normalizarGrupo(rascunhos[p.id]?.grupo ?? p.grupo)),
    );
    const ordenados = ORDEM_GRUPOS.filter((g) => presentes.has(g));
    const extras = [...presentes].filter((g) => !ORDEM_GRUPOS.includes(g)).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [...ordenados, ...extras];
  }, [produtos, rascunhos]);
  const classesParaSelect = useMemo(() => {
    const base = new Set([...ORDEM_GRUPOS, ...gruposDisponiveis]);
    for (const rascunho of Object.values(rascunhos)) {
      const g = normalizarGrupo(rascunho.grupo);
      if (g) base.add(g);
    }
    return [...base].sort((a, b) => {
      const ia = ORDEM_GRUPOS.indexOf(a);
      const ib = ORDEM_GRUPOS.indexOf(b);
      const oa = ia === -1 ? 99 : ia;
      const ob = ib === -1 ? 99 : ib;
      if (oa !== ob) return oa - ob;
      return a.localeCompare(b, "pt-BR");
    });
  }, [gruposDisponiveis, rascunhos]);

  useEffect(() => {
    setRascunhos((atual) => {
      const proximo: Record<string, RascunhoProduto> = {};
      for (const produto of produtos) {
        const existente = atual[produto.id];
        proximo[produto.id] = existente && rascunhoSujo(produto, existente) ? existente : rascunhoDe(produto);
      }
      return proximo;
    });
  }, [produtos]);

  useEffect(() => {
    setNomesClasse((atual) => {
      const proximo = { ...atual };
      for (const classe of gruposDisponiveis) {
        if (proximo[classe] == null) proximo[classe] = classe;
      }
      return proximo;
    });
  }, [gruposDisponiveis]);

  const alterados = useMemo(
    () => produtos.filter((produto) => {
      const rascunho = rascunhos[produto.id];
      return rascunho ? rascunhoSujo(produto, rascunho) : false;
    }),
    [produtos, rascunhos],
  );

  const atualizarRascunho = (id: string, patch: Partial<RascunhoProduto>) => {
    setRascunhos((atual) => {
      const base = atual[id] ?? rascunhoDe(produtos.find((p) => p.id === id)!);
      return { ...atual, [id]: { ...base, ...patch } };
    });
  };

  const descartarAlteracoes = () => {
    setRascunhos(Object.fromEntries(produtos.map((produto) => [produto.id, rascunhoDe(produto)])));
    toast.message("Alterações descartadas.");
  };

  const salvarTudo = async () => {
    if (ocupado || alterados.length === 0) return;
    const payloads: Array<{ id: string; nome: string; body: Parameters<typeof portalApi.salvarProduto>[1] }> = [];
    for (const produto of alterados) {
      const rascunho = rascunhos[produto.id];
      if (!rascunho) continue;
      const grupo = normalizarGrupo(rascunho.grupo);
      if (grupo.length < 2) {
        toast.error(`“${produto.nome}”: informe uma classe válida.`);
        return;
      }
      const preco = Number(rascunho.preco.replace(",", "."));
      if (!Number.isFinite(preco) || preco <= 0) {
        toast.error(`“${produto.nome}”: informe um preço maior que zero.`);
        return;
      }
      const estoque = rascunho.estoque.trim() === "" ? null : Number(rascunho.estoque.replace(",", "."));
      if (estoque != null && (!Number.isFinite(estoque) || estoque < 0)) {
        toast.error(`“${produto.nome}”: estoque inválido.`);
        return;
      }
      payloads.push({
        id: produto.id,
        nome: produto.nome,
        body: {
          grupo,
          preco,
          estoque,
          descricao: rascunho.descricao,
          aplicacao: rascunho.aplicacao,
          naLoja: rascunho.naLoja,
          exclusivo: rascunho.exclusivo,
        },
      });
    }
    setOcupado(true);
    let ok = 0;
    const falhas: string[] = [];
    for (const item of payloads) {
      try {
        await portalApi.salvarProduto(item.id, item.body);
        ok += 1;
      } catch (error) {
        falhas.push(`${item.nome}: ${mensagem(error)}`);
      }
    }
    try {
      await onAtualizar();
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setOcupado(false);
    }
    if (ok > 0) toast.success(ok === 1 ? "1 produto salvo." : `${ok} produtos salvos.`);
    if (falhas.length > 0) toast.error(falhas.slice(0, 2).join(" · "));
  };

  const renomearClasse = async (de: string) => {
    if (ocupado) return;
    const para = (nomesClasse[de] ?? "").trim().replace(/\s+/g, " ");
    if (para.length < 2) {
      toast.error("Informe o novo nome da classe.");
      return;
    }
    if (para === de) {
      toast.message("O nome é o mesmo.");
      return;
    }
    if (!window.confirm(`Renomear a classe “${de}” para “${para}” em todos os produtos?`)) return;
    setOcupado(true);
    try {
      const resposta = await portalApi.renomearGrupo(de, para);
      toast.success(`${resposta.atualizados} produto(s) atualizados para “${resposta.para}”.`);
      setGrupoFiltro((atual) => (atual === de ? resposta.para : atual));
      setNomesClasse((atual) => {
        const proximo = { ...atual };
        delete proximo[de];
        proximo[resposta.para] = resposta.para;
        return proximo;
      });
      await onAtualizar();
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setOcupado(false);
    }
  };

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return produtos
      .filter((p) => {
        const rascunho = rascunhos[p.id];
        const grupo = normalizarGrupo(rascunho?.grupo ?? p.grupo);
        const naLoja = rascunho?.naLoja ?? p.naLoja;
        const exclusivo = rascunho?.exclusivo ?? p.exclusivo;
        if (grupoFiltro !== "Tudo" && grupo !== grupoFiltro) return false;
        if (lojaFiltro === "ativos" && !naLoja) return false;
        if (lojaFiltro === "inativos" && naLoja) return false;
        if (alertaFiltro === "semPreco") {
          const preco = rascunho ? Number(rascunho.preco.replace(",", ".")) : p.preco;
          if (!(preco == null || !Number.isFinite(preco) || preco <= 0)) return false;
        }
        if (alertaFiltro === "semFoto" && p.imagemUrl) return false;
        if (alertaFiltro === "estoqueZero" && p.estoque !== 0) return false;
        if (alertaFiltro === "exclusivos" && !exclusivo) return false;
        if (termo) {
          return (
            p.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
            grupo.toLocaleLowerCase("pt-BR").includes(termo) ||
            (p.categoria ?? "").toLocaleLowerCase("pt-BR").includes(termo)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const ga = ORDEM_GRUPOS.indexOf(normalizarGrupo(rascunhos[a.id]?.grupo ?? a.grupo));
        const gb = ORDEM_GRUPOS.indexOf(normalizarGrupo(rascunhos[b.id]?.grupo ?? b.grupo));
        const oa = ga === -1 ? 99 : ga;
        const ob = gb === -1 ? 99 : gb;
        if (oa !== ob) return oa - ob;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [produtos, rascunhos, grupoFiltro, lojaFiltro, alertaFiltro, busca]);

  const cadastrosPendentes = useMemo(
    () => cadastros.filter((item) => item.status !== "ENVIADO"),
    [cadastros],
  );

  const aplicarKpi = (tipo: keyof ReturnType<typeof kpisCatalogo>) => {
    setAba(tipo === "cadastrosPendentes" ? "cadastros" : "catalogo");
    setBusca("");
    setGrupoFiltro("Tudo");
    if (tipo === "ativos") {
      setLojaFiltro("ativos");
      setAlertaFiltro("todos");
    } else if (tipo === "inativos") {
      setLojaFiltro("inativos");
      setAlertaFiltro("todos");
    } else if (tipo === "semPreco") {
      setLojaFiltro("todos");
      setAlertaFiltro("semPreco");
    } else if (tipo === "semFoto") {
      setLojaFiltro("todos");
      setAlertaFiltro("semFoto");
    } else if (tipo === "estoqueZero") {
      setLojaFiltro("todos");
      setAlertaFiltro("estoqueZero");
    } else if (tipo === "exclusivos") {
      setLojaFiltro("todos");
      setAlertaFiltro("exclusivos");
    } else if (tipo === "total") {
      setLojaFiltro("todos");
      setAlertaFiltro("todos");
    }
  };

  const liberarTodos = async () => {
    if (ocupado) return;
    if (!window.confirm("Colocar todos os produtos elegíveis na loja?")) return;
    setOcupado(true);
    try {
      const resposta = await portalApi.liberarProdutos();
      toast.success(resposta.atualizados > 0 ? `${resposta.atualizados} produtos liberados na loja.` : "Nenhum produto novo para liberar.");
      await onAtualizar();
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setOcupado(false);
    }
  };

  const gerarConvites = async (redefinir = false) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      const resposta = await portalApi.convites({
        email: emailConvite.trim() || undefined,
        redefinir,
      });
      setLinksConvite(resposta.criados);
      if (resposta.criados.length > 0) {
        toast.success(`${resposta.criados.length} convite(s) gerado(s).`);
      } else {
        toast.message("Nenhum convite novo. Veja os ignorados.");
      }
      if (resposta.ignorados.length > 0) {
        toast.message(`${resposta.ignorados.length} ignorado(s): ${resposta.ignorados.map((i) => i.motivo).slice(0, 2).join("; ")}`);
      }
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <p className="text-sm font-medium text-ink">{nome}</p>
          <p className="text-xs text-ink/55">Administração da loja e do catálogo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={ocupado}
            onClick={() => {
              void onAtualizar()
                .then(() => toast.success("Painel atualizado."))
                .catch((error) => toast.error(mensagem(error)));
            }}
          >
            Atualizar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onSair}>
            Sair da equipe
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["total", "Produtos", kpis.total],
            ["ativos", "Ativos no site", kpis.ativos],
            ["inativos", "Inativos", kpis.inativos],
            ["cadastrosPendentes", "Cadastros pendentes", kpis.cadastrosPendentes],
            ["semPreco", "Sem preço", kpis.semPreco],
            ["semFoto", "Sem foto", kpis.semFoto],
            ["estoqueZero", "Estoque zerado", kpis.estoqueZero],
            ["exclusivos", "Exclusivos", kpis.exclusivos],
          ] as const
        ).map(([chave, rotulo, valor]) => {
          const destaque =
            (chave === "ativos" && lojaFiltro === "ativos" && alertaFiltro === "todos" && aba === "catalogo") ||
            (chave === "inativos" && lojaFiltro === "inativos" && alertaFiltro === "todos" && aba === "catalogo") ||
            (chave === "semPreco" && alertaFiltro === "semPreco") ||
            (chave === "semFoto" && alertaFiltro === "semFoto") ||
            (chave === "estoqueZero" && alertaFiltro === "estoqueZero") ||
            (chave === "exclusivos" && alertaFiltro === "exclusivos") ||
            (chave === "total" && lojaFiltro === "todos" && alertaFiltro === "todos" && aba === "catalogo") ||
            (chave === "cadastrosPendentes" && aba === "cadastros");
          const alerta = (chave === "semPreco" || chave === "semFoto" || chave === "estoqueZero" || chave === "cadastrosPendentes") && valor > 0;
          return (
            <button
              key={chave}
              type="button"
              onClick={() => aplicarKpi(chave)}
              className={
                destaque
                  ? "border border-forest bg-forest/5 px-4 py-3 text-left"
                  : alerta
                    ? "border border-amber-700/25 bg-amber-50/60 px-4 py-3 text-left"
                    : "border border-ink/10 bg-white px-4 py-3 text-left"
              }
            >
              <p className="display-head text-2xl leading-none tabular-nums">{valor}</p>
              <p className="mt-2 text-sm text-ink/70">{rotulo}</p>
            </button>
          );
        })}
      </div>

      <nav className="flex flex-wrap gap-2">
        {(
          [
            ["catalogo", "Catálogo"],
            ["cadastros", kpis.cadastrosPendentes > 0 ? `Cadastros (${kpis.cadastrosPendentes})` : "Cadastros"],
            ["ferramentas", "Ferramentas"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            className={aba === id ? "bg-forest px-3 py-2 text-sm text-paper" : "border border-ink/15 px-3 py-2 text-sm"}
            onClick={() => setAba(id)}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      {aba === "catalogo" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-sm border border-ink/10 bg-white p-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="block min-w-0 flex-1 text-sm">
              Buscar produto
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Nome, classe ou categoria"
                className="mt-1 w-full border border-ink/15 px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["todos", "Todos"],
                  ["ativos", "Ativos no site"],
                  ["inativos", "Inativos"],
                ] as const
              ).map(([id, rotulo]) => (
                <button
                  key={id}
                  type="button"
                  className={lojaFiltro === id ? "bg-forest px-3 py-2 text-sm text-paper" : "border border-ink/15 px-3 py-2 text-sm"}
                  onClick={() => setLojaFiltro(id)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <button type="button" className={grupoFiltro === "Tudo" ? "text-forest" : "text-ink/55"} onClick={() => setGrupoFiltro("Tudo")}>
              Todas as classes
            </button>
            {gruposDisponiveis.map((item) => (
              <button
                key={item}
                type="button"
                className={grupoFiltro === item ? "text-forest" : "text-ink/55"}
                onClick={() => setGrupoFiltro(item)}
              >
                {item}
                <span className="ml-1 text-ink/40">
                  ({produtos.filter((p) => normalizarGrupo(p.grupo) === item && (lojaFiltro === "ativos" ? p.naLoja : lojaFiltro === "inativos" ? !p.naLoja : true)).length})
                </span>
              </button>
            ))}
          </div>

          {alertaFiltro !== "todos" ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink/60">
                Filtro ativo:{" "}
                {alertaFiltro === "semPreco"
                  ? "sem preço"
                  : alertaFiltro === "semFoto"
                    ? "sem foto"
                    : alertaFiltro === "estoqueZero"
                      ? "estoque zerado"
                      : "exclusivos"}
              </span>
              <button type="button" className="text-forest" onClick={() => setAlertaFiltro("todos")}>
                Limpar
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/55">
              {filtrados.length} de {produtos.length} produto{produtos.length === 1 ? "" : "s"}
              {alterados.length > 0 ? ` · ${alterados.length} com alteração` : ""}
            </p>
            {alterados.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="border border-ink/15 px-3 py-2 text-sm" disabled={ocupado} onClick={descartarAlteracoes}>
                  Descartar
                </button>
                <Button type="button" disabled={ocupado} onClick={() => void salvarTudo()}>
                  {ocupado ? "Salvando…" : `Salvar tudo (${alterados.length})`}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-ink/45">Edite os campos e salve tudo de uma vez.</p>
            )}
          </div>

          {filtrados.length === 0 ? (
            <p className="rounded-sm border border-dashed border-ink/20 px-4 py-8 text-center text-sm text-ink/60">
              Nenhum produto com esses filtros.
            </p>
          ) : (
            <div className="space-y-3">
              {filtrados.map((produto) => {
                const rascunho = rascunhos[produto.id] ?? rascunhoDe(produto);
                return (
                  <ProdutoEquipeCard
                    key={produto.id}
                    produto={produto}
                    rascunho={rascunho}
                    sujo={rascunhoSujo(produto, rascunho)}
                    classes={classesParaSelect}
                    onChange={(patch) => atualizarRascunho(produto.id, patch)}
                    onFoto={onFoto}
                  />
                );
              })}
            </div>
          )}

          {alterados.length > 0 ? (
            <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 border border-forest/30 bg-paper/95 p-3 shadow-lg backdrop-blur">
              <p className="text-sm text-ink/70">
                {alterados.length === 1 ? "1 produto alterado" : `${alterados.length} produtos alterados`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="border border-ink/15 px-3 py-2 text-sm" disabled={ocupado} onClick={descartarAlteracoes}>
                  Descartar
                </button>
                <Button type="button" disabled={ocupado} onClick={() => void salvarTudo()}>
                  {ocupado ? "Salvando…" : "Salvar tudo"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {aba === "cadastros" ? (
        <div className="space-y-4">
          <p className="text-sm text-ink/65">Empresas que pediram cadastro e ainda precisam ser enviadas ao Conta Azul.</p>
          {cadastrosPendentes.length === 0 ? (
            <p className="rounded-sm border border-dashed border-ink/20 px-4 py-8 text-center text-sm text-ink/60">
              Nenhum cadastro pendente.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {cadastrosPendentes.map((item) => (
                <li key={item.id} className="rounded-sm border border-ink/10 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-ink/60">
                        {item.cnpj} · {item.cidade}/{item.estado} · {item.email}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-ink/45">Status: {item.status}</p>
                      {item.erro ? <p className="mt-1 text-red-800">{item.erro}</p> : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={ocupado}
                      onClick={() => {
                        setOcupado(true);
                        void portalApi
                          .enviarCadastro(item.id)
                          .then(() => portalApi.cadastros())
                          .then((lista) => {
                            onCadastros(lista.cadastros);
                            toast.success("Cadastro reenviado.");
                          })
                          .catch((error) => toast.error(mensagem(error)))
                          .finally(() => setOcupado(false));
                      }}
                    >
                      Enviar de novo
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {aba === "ferramentas" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-sm border border-ink/10 bg-white p-5">
            <h3 className="font-medium">Vitrine</h3>
            <p className="text-sm text-ink/65">
              Libera em massa produtos elegíveis para aparecerem na loja. Útil após sincronizar o catálogo.
            </p>
            <p className="text-sm text-ink/55">
              Agora: {kpis.ativos} ativos · {kpis.inativos} fora do site
            </p>
            <Button type="button" disabled={ocupado} onClick={() => void liberarTodos()}>
              Liberar produtos na loja
            </Button>
          </div>
          <div className="space-y-3 rounded-sm border border-ink/10 bg-white p-5">
            <h3 className="font-medium">Convites de empresa</h3>
            <p className="text-sm text-ink/65">
              Gera link para o cliente criar a senha. Deixe o e-mail vazio para processar a fila, ou informe um e-mail específico.
            </p>
            <Campo label="E-mail (opcional)" value={emailConvite} onChange={setEmailConvite} type="email" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={ocupado} onClick={() => void gerarConvites(false)}>
                Gerar convites
              </Button>
              <Button type="button" variant="outline" disabled={ocupado} onClick={() => void gerarConvites(true)}>
                Redefinir senha
              </Button>
            </div>
            {linksConvite.length > 0 ? (
              <ul className="space-y-2 border-t border-ink/10 pt-3 text-sm">
                {linksConvite.map((item) => (
                  <li key={`${item.email}-${item.link}`} className="break-all">
                    <strong>{item.nome}</strong> · {item.email}
                    <br />
                    <a href={item.link} className="text-forest" target="_blank" rel="noreferrer">
                      {item.link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="space-y-3 rounded-sm border border-ink/10 bg-white p-5 lg:col-span-2">
            <h3 className="font-medium">Classes de produto</h3>
            <p className="text-sm text-ink/65">
              Edite o nome da classe para renomear todos os produtos dela na loja. Para classificar um item individual, use o campo Classe no catálogo.
            </p>
            <div className="space-y-3">
              {gruposDisponiveis.map((classe) => {
                const itens = produtos.filter((p) => normalizarGrupo(p.grupo) === classe);
                const ativos = itens.filter((p) => p.naLoja).length;
                const rascunho = nomesClasse[classe] ?? classe;
                const mudou = rascunho.trim() !== classe;
                return (
                  <div key={classe} className="grid gap-2 border border-ink/10 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <label className="block text-sm">
                      Nome da classe
                      <input
                        value={rascunho}
                        onChange={(event) =>
                          setNomesClasse((atual) => ({ ...atual, [classe]: event.target.value }))
                        }
                        className="mt-1 w-full border border-ink/15 px-3 py-2"
                      />
                      <span className="mt-1 block text-xs text-ink/50">
                        {ativos}/{itens.length} no site · atual: {classe}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" disabled={ocupado || !mudou} onClick={() => void renomearClasse(classe)}>
                        Salvar nome
                      </Button>
                      <button
                        type="button"
                        className="border border-ink/15 px-3 py-2 text-sm"
                        onClick={() => {
                          setAba("catalogo");
                          setGrupoFiltro(classe);
                          setLojaFiltro("todos");
                          setAlertaFiltro("todos");
                        }}
                      >
                        Ver produtos
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProdutoEquipeCard({
  produto,
  rascunho,
  sujo,
  classes,
  onChange,
  onFoto,
}: {
  produto: ProdutoEquipe;
  rascunho: RascunhoProduto;
  sujo: boolean;
  classes: string[];
  onChange: (patch: Partial<RascunhoProduto>) => void;
  onFoto: (produto: ProdutoEquipe, imagem: string) => Promise<string>;
}) {
  const [foto, setFoto] = useState(produto.imagemUrl ?? "");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const grupo = normalizarGrupo(rascunho.grupo);
  const classeNaLista = classes.includes(grupo);
  const [modoOutra, setModoOutra] = useState(!classeNaLista);
  const peso = pesoDoItem(produto.nome, produto.peso, produto.unidade);

  useEffect(() => {
    setFoto(produto.imagemUrl ?? "");
  }, [produto.id, produto.imagemUrl]);

  useEffect(() => {
    setModoOutra(!classes.includes(normalizarGrupo(rascunho.grupo)));
  }, [produto.id, rascunho.grupo, classes]);

  return (
    <article
      className={
        sujo
          ? "space-y-3 rounded-sm border border-forest/40 bg-white p-4"
          : rascunho.naLoja
            ? "space-y-3 rounded-sm border border-ink/10 bg-white p-4"
            : "space-y-3 rounded-sm border border-dashed border-ink/20 bg-ink/[0.02] p-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-ink/45">{grupo || "Sem classe"}</p>
            <span className={rascunho.naLoja ? "bg-forest/10 px-2 py-0.5 text-[11px] font-medium text-forest" : "bg-ink/10 px-2 py-0.5 text-[11px] font-medium text-ink/60"}>
              {rascunho.naLoja ? "Ativo no site" : "Inativo"}
            </span>
            {sujo ? <span className="bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">Não salvo</span> : null}
            {rascunho.exclusivo ? <span className="bg-ink/5 px-2 py-0.5 text-[11px] text-ink/60">Exclusivo</span> : null}
            {produto.estoque === 0 ? <span className="bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">Estoque 0</span> : null}
            {!produto.imagemUrl ? <span className="bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">Sem foto</span> : null}
          </div>
          <h3 className="mt-1 font-medium">{nomeSemPeso(produto.nome)}</h3>
          {peso ? <p className="mt-1 text-xs font-medium text-forest">Peso {peso}</p> : null}
          {rascunho.exclusivo ? <p className="mt-1 text-xs text-ink/55">Só aparece para quem tem este produto na regra comercial.</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ naLoja: !rascunho.naLoja })}>
            {rascunho.naLoja ? "Tirar da loja" : "Colocar na loja"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ exclusivo: !rascunho.exclusivo })}>
            {rascunho.exclusivo ? "Visível para todos" : "Exclusivo"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm md:col-span-2">
          Classe
          <select
            value={modoOutra ? "__outra__" : grupo}
            onChange={(event) => {
              const valor = event.target.value;
              if (valor === "__outra__") {
                setModoOutra(true);
                return;
              }
              setModoOutra(false);
              onChange({ grupo: valor });
            }}
            className="mt-1 w-full border border-ink/15 bg-white px-2 py-2"
          >
            {classes.map((classe) => (
              <option key={classe} value={classe}>
                {classe}
              </option>
            ))}
            <option value="__outra__">Outra classe…</option>
          </select>
        </label>
        {modoOutra ? (
          <label className="text-sm md:col-span-2">
            Nome da classe
            <input
              value={rascunho.grupo}
              onChange={(event) => onChange({ grupo: event.target.value })}
              placeholder="Ex.: Temperos"
              className="mt-1 w-full border border-ink/15 px-2 py-2"
            />
          </label>
        ) : null}
        <label className="text-sm">
          Preço de tabela
          <input value={rascunho.preco} onChange={(event) => onChange({ preco: event.target.value })} className="mt-1 w-full border border-ink/15 px-2 py-2" />
        </label>
        <label className="text-sm">
          Estoque
          <input
            value={rascunho.estoque}
            onChange={(event) => onChange({ estoque: event.target.value })}
            placeholder="vazio = sem limite"
            className="mt-1 w-full border border-ink/15 px-2 py-2"
          />
        </label>
        <div className="text-sm md:col-span-2">
          <span>Foto</span>
          <div className="mt-1 flex items-center gap-3">
            {foto ? <img src={foto} alt="" className="h-16 w-12 bg-ink/5 object-cover" /> : null}
            <label className={`inline-flex cursor-pointer items-center border border-ink/20 px-3 py-2 text-sm ${enviandoFoto ? "pointer-events-none opacity-60" : ""}`}>
              {enviandoFoto ? "Enviando foto..." : "Escolher foto"}
              <input
                type="file"
                accept="image/*,.heic,.heif,.jfif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif"
                className="sr-only"
                disabled={enviandoFoto}
                onChange={(event) => {
                  const arquivo = event.target.files?.[0];
                  event.target.value = "";
                  if (!arquivo) return;
                  const anterior = foto;
                  const previa = URL.createObjectURL(arquivo);
                  setFoto(previa);
                  setEnviandoFoto(true);
                  void arquivoParaJpeg(arquivo)
                    .then((imagem) => onFoto(produto, imagem))
                    .then((url) => {
                      const destino = new URL(url, window.location.origin);
                      destino.searchParams.set("v", String(Date.now()));
                      setFoto(`${destino.pathname}${destino.search}`);
                    })
                    .catch((error) => {
                      setFoto(anterior);
                      const texto = error instanceof Error && error.message ? error.message : "Não foi possível usar essa foto.";
                      toast.error(texto);
                    })
                    .finally(() => {
                      URL.revokeObjectURL(previa);
                      setEnviandoFoto(false);
                    });
                }}
              />
            </label>
          </div>
        </div>
        <label className="text-sm md:col-span-2">
          Característica
          <textarea value={rascunho.descricao} onChange={(event) => onChange({ descricao: event.target.value })} rows={2} className="mt-1 w-full border border-ink/15 px-2 py-2" />
        </label>
        <label className="text-sm md:col-span-2">
          Aplicação
          <textarea value={rascunho.aplicacao} onChange={(event) => onChange({ aplicacao: event.target.value })} rows={2} className="mt-1 w-full border border-ink/15 px-2 py-2" />
        </label>
      </div>
    </article>
  );
}
