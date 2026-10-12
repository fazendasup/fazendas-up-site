import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  portalApi,
  PortalError,
  type CadastroEmpresa,
  type ClienteSessao,
  type EquipeSessao,
  type PedidoCliente,
  type ProdutoEquipe,
  type ProdutoLoja,
  type TituloCliente,
} from "@/lib/pedidos/api";
import { formatCnpj, formatLongDate, isValidCnpj } from "@/lib/pedidos/rules";

type Vista = "loja" | "pedidos" | "pagamentos" | "conta" | "equipe" | "cadastro";

const ORDEM_GRUPOS = ["Folhas", "Microverdes", "Ervas", "Saladas", "Flores", "Legumes", "Processados", "Molhos", "Planos", "Da fazenda"];

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

function mensagem(error: unknown) {
  const texto = error instanceof PortalError ? error.message : "Não foi possível concluir agora.";
  if (/conta azul/i.test(texto)) return "Não foi possível concluir agora. Tente de novo em instantes.";
  return texto;
}

function statusPedido(status: string, doSite = false) {
  if (status === "PENDENTE") return doSite ? "Aguardando aprovação" : "Programado";
  if (status === "PRONTO") return "Separado";
  if (status === "ENTREGUE") return "Entregue";
  if (status === "CANCELADO") return "Cancelado";
  return "Em andamento";
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

function dataCurta(ymd: string) {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes ?? 1) - 1, dia ?? 1)).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function resumoDaConta(pedidos: PedidoCliente[], titulos: TituloCliente[]) {
  const hoje = hojeManaus();
  const programados = pedidos
    .filter((pedido) => pedido.programado ?? (pedido.dataEntrega.slice(0, 10) >= hoje && pedido.status !== "CANCELADO"))
    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));
  const atrasados = titulos.filter((titulo) => tituloEmAtraso(titulo, hoje));
  const idsAtraso = new Set(atrasados.map((titulo) => titulo.id));
  const aVencer = titulos
    .filter((titulo) => titulo.emAberto > 0.009 && !idsAtraso.has(titulo.id))
    .sort((a, b) => (a.vencimento ?? "9999").localeCompare(b.vencimento ?? "9999"));
  return {
    programados: programados.length,
    proximaEntrega: programados[0]?.dataEntrega.slice(0, 10) ?? null,
    aguardando: programados.filter((pedido) => pedido.doSite && pedido.status === "PENDENTE").length,
    atraso: atrasados.length,
    valorAtraso: atrasados.reduce((soma, titulo) => soma + titulo.emAberto, 0),
    aVencer: aVencer.length,
    proximoVencimento: aVencer[0]?.vencimento?.slice(0, 10) ?? null,
    valorProximo: aVencer[0]?.emAberto ?? 0,
  };
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
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
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
  const grupos = ORDEM_GRUPOS.filter((item) => catalogo.some((produto) => produto.grupo === item));
  const visiveis = catalogo.filter((produto) => grupo === "Tudo" || produto.grupo === grupo);

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

  const lancar = async () => {
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
    if (total < minimo) {
      toast.error(`O pedido mínimo para entrega é ${reais(minimo)}.`);
      return;
    }
    setEnviando(true);
    try {
      await portalApi.criarPedido({ dataEntrega, observacoes, itens });
      setCarrinho({});
      setObservacoes("");
      await Promise.all([carregarVitrine(), carregarConta()]);
      setVista("pedidos");
      toast.success("Pedido enviado para aprovação.");
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const enviarCadastro = async () => {
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
    patch: { naLoja?: boolean; exclusivo?: boolean; preco?: number; imagemUrl?: string | null; descricao?: string; aplicacao?: string; estoque?: number | null },
  ) => {
    try {
      const salvo = await portalApi.salvarProduto(produto.id, patch);
      setProdutosEquipe((atual) => atual.map((item) => (item.id === produto.id ? { ...item, ...salvo, descricao: salvo.descricao ?? item.descricao, aplicacao: salvo.aplicacao ?? item.aplicacao } : item)));
      toast.success("Produto atualizado.");
      void carregarVitrine();
    } catch (error) {
      toast.error(mensagem(error));
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader variant="subpage" />
      <main className="container pb-24 pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display-head max-w-3xl text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.02]">
            {vista === "equipe" && !cliente ? "Acesso da equipe" : <>Da fazenda para a <em>cozinha</em>.</>}
          </h1>
          {cliente ? null : (
            vista === "equipe" ? null : (
            <div className="flex gap-4 text-sm">
              <button type="button" className="text-ink/70" onClick={() => { setVista("loja"); setModoEquipe(false); }}>Entrar</button>
              <button type="button" className="text-forest" onClick={() => setVista("cadastro")}>Cadastrar empresa</button>
            </div>
            )
          )}
        </div>
        {cliente ? (
          <div className="mt-8 border border-ink/15 bg-white px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Sua conta</p>
              <p className="display-head text-[clamp(1.6rem,3vw,2.2rem)] leading-none">{cliente.nome}</p>
            </div>
            <nav className="flex flex-wrap gap-2">
              {(
                [
                  ["loja", "Fazer pedido"],
                  ["pedidos", "Meus pedidos"],
                  ["pagamentos", "Pagamentos"],
                  ["conta", "Conta"],
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
                  Loja
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
            {contaPronta ? <IndicadoresConta pedidos={pedidos} titulos={titulos} onPedidos={() => { setVerHistoricoPedidos(false); setVista("pedidos"); }} onPagamentos={() => { setVerHistorico(false); setVista("pagamentos"); }} /> : null}
          </div>
        ) : null}

        {carregando ? <p className="mt-8 text-ink/60">Carregando os produtos...</p> : null}

        {vista === "cadastro" && !cliente ? (
          <form
            className="mt-8 grid max-w-3xl gap-4 rounded-sm border border-ink/10 bg-white p-6 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void enviarCadastro();
            }}
          >
            <h2 className="display-head text-2xl sm:col-span-2">Cadastro da empresa</h2>
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

        {vista === "pedidos" && cliente ? (
          <PedidosCliente
            pedidos={pedidos}
            verHistorico={verHistoricoPedidos}
            onHistorico={() => setVerHistoricoPedidos((atual) => !atual)}
            onLoja={() => { setVista("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        ) : null}

        {vista === "pagamentos" && cliente ? (
          <>
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
          <button type="button" className="mt-8 text-sm text-forest" onClick={() => { setVista("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Fazer pedido</button>
          </>
        ) : null}

        {vista === "conta" && cliente ? (
          <form
            className="mt-8 max-w-md space-y-3 rounded-sm border border-ink/10 bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (senhaNova.length < 6 || senhaNova !== senha2) {
                toast.error("A nova senha precisa ter pelo menos 6 caracteres e as duas precisam ser iguais.");
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
            <p className="text-sm text-ink/60">Se ainda não trocou, a senha atual são os 5 primeiros dígitos do CNPJ.</p>
            <CampoSenha label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} autoComplete="current-password" />
            <CampoSenha label="Nova senha" value={senhaNova} onChange={setSenhaNova} autoComplete="new-password" />
            <CampoSenha label="Repita a nova senha" value={senha2} onChange={setSenha2} autoComplete="new-password" />
            <Button type="submit" disabled={enviando}>Alterar senha</Button>
            <button type="button" className="text-sm text-forest" onClick={() => { setVista("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Fazer pedido</button>
          </form>
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
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink/70">{equipe.nome}</p>
                  <Button type="button" variant="outline" onClick={() => { void portalApi.equipeSair().finally(() => { setEquipe(null); setVista("loja"); }); }}>Sair da equipe</Button>
                </div>
                {cadastros.filter((item) => item.status !== "ENVIADO").length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {cadastros.filter((item) => item.status !== "ENVIADO").map((item) => (
                      <li key={item.id} className="rounded-sm border border-ink/10 bg-white p-3">
                        <strong>{item.nome}</strong> · {item.cnpj} · {item.cidade}/{item.estado}
                        {item.erro ? <p className="text-ink/60">{item.erro}</p> : null}
                        <Button type="button" size="sm" className="mt-2" onClick={() => { void portalApi.enviarCadastro(item.id).then(() => portalApi.cadastros().then((lista) => setCadastros(lista.cadastros))).catch((error) => toast.error(mensagem(error))); }}>Enviar de novo</Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="space-y-3">
                  {produtosEquipe.map((produto) => (
                    <ProdutoEquipeCard
                      key={produto.id}
                      produto={produto}
                      onSave={salvarProduto}
                      onFoto={async (item, imagem) => {
                        const salvo = await portalApi.enviarFoto(item.id, imagem);
                        setProdutosEquipe((atual) =>
                          atual.map((produto) => (produto.id === item.id ? { ...produto, imagemUrl: salvo.imagemUrl } : produto)),
                        );
                        void carregarVitrine();
                        return salvo.imagemUrl;
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : null}

        {vista === "loja" || vista === "cadastro" ? (
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
                const itens = visiveis.filter((produto) => produto.grupo === nome);
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
              {precoDaConta ? <p className="text-2xl font-medium tabular-nums">{reais(total)}</p> : <p className="text-sm text-ink/70">Entre com o CNPJ da empresa para ver os preços.</p>}
              {total === 0 && Object.values(carrinho).every((quantidade) => quantidade <= 0) ? <p className="text-sm text-ink/55">Escolha a quantidade nos produtos.</p> : null}
              {precoDaConta && total > 0 && total < minimo ? <p className="text-sm text-ink/65">Faltam {reais(minimo - total)} para a entrega.</p> : null}
              {emAtraso && cliente ? <p className="text-sm text-red-800">Há um pagamento em atraso nesta conta. O pedido fica bloqueado até a regularização.</p> : null}
              <ul className="space-y-3 text-sm">
                {catalogo.filter((produto) => (carrinho[produto.id] ?? 0) > 0).map((produto) => {
                  const qtd = carrinho[produto.id] ?? 0;
                  const noTeto = produto.estoque != null && qtd >= produto.estoque;
                  return (
                    <li key={produto.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{produto.nome}</p>
                        <p className="text-xs text-ink/50">{produto.preco != null ? reais(produto.preco * qtd) : `${qtd} ${produto.unidade}`}</p>
                      </div>
                      <button type="button" className="h-8 w-8 border border-ink/15" onClick={() => definirQtd(produto, qtd - 1)} aria-label={`Diminuir ${produto.nome}`}>−</button>
                      <span className="w-6 text-center tabular-nums">{qtd}</span>
                      <button type="button" className="h-8 w-8 border border-ink/15 disabled:opacity-40" onClick={() => definirQtd(produto, qtd + 1)} disabled={noTeto} aria-label={`Aumentar ${produto.nome}`}>+</button>
                      <button type="button" className="h-8 w-8 text-ink/55" onClick={() => definirQtd(produto, 0)} aria-label={`Excluir ${produto.nome}`}>×</button>
                    </li>
                  );
                })}
              </ul>
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
              {cliente ? (
                <Button type="button" disabled={enviando || emAtraso || total < minimo} onClick={() => void lancar()}>Enviar para aprovação</Button>
              ) : (
                <form
                  className="space-y-3 border-t border-ink/10 pt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void entrar();
                  }}
                >
                  <p className="text-sm text-ink/70">Para enviar, entre com o CNPJ da empresa.</p>
                  {modoEquipe ? <Campo label="E-mail" value={email} onChange={setEmail} type="email" /> : <Campo label="CNPJ" value={formatCnpj(cnpj)} onChange={setCnpj} inputMode="numeric" />}
                  <CampoSenha label="Senha" value={senha} onChange={setSenha} autoComplete="current-password" />
                  <Button type="submit" disabled={enviando}>Entrar</Button>
                  <button type="button" className="block text-sm text-forest" onClick={() => setVista("cadastro")}>Cadastrar empresa</button>
                </form>
              )}
            </aside>
          </section>
        ) : null}
        {vista !== "equipe" ? (
          <p className="mt-16 text-sm text-ink/40">
            <a href="/pedidos/equipe">Acesso da equipe</a>
          </p>
        ) : null}
      </main>
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
  return (
    <article className="overflow-hidden rounded-sm border border-ink/10 bg-white">
      <img
        src={produto.imagemUrl || "/uploads/IMG_7964.jpg"}
        alt=""
        className="aspect-[4/5] w-full object-cover"
        onError={(event) => {
          event.currentTarget.src = "/uploads/IMG_7964.jpg";
        }}
      />
      <div className="space-y-2 p-3">
        <h3 className="text-[0.95rem] leading-tight">{produto.nome}</h3>
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
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  inputMode?: "numeric" | "tel" | "email";
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-ink/15 bg-white px-3 py-3"
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

async function arquivoParaJpeg(arquivo: File): Promise<string> {
  const bitmap = await createImageBitmap(arquivo);
  const limite = 1400;
  const escala = Math.min(1, limite / Math.max(bitmap.width, bitmap.height));
  const largura = Math.max(1, Math.round(bitmap.width * escala));
  const altura = Math.max(1, Math.round(bitmap.height * escala));
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  const contexto = tela.getContext("2d");
  if (!contexto) throw new Error("Não foi possível ler a foto.");
  contexto.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => tela.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("Não foi possível ler a foto.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binario = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binario += String.fromCharCode(bytes[i]);
  }
  return btoa(binario);
}

function IndicadoresConta({
  pedidos,
  titulos,
  onPedidos,
  onPagamentos,
}: {
  pedidos: PedidoCliente[];
  titulos: TituloCliente[];
  onPedidos: () => void;
  onPagamentos: () => void;
}) {
  const resumo = resumoDaConta(pedidos, titulos);
  const entrega =
    resumo.proximaEntrega && resumo.aguardando
      ? `Próxima em ${dataCurta(resumo.proximaEntrega)}. ${resumo.aguardando === 1 ? "1 aguardando aprovação." : `${resumo.aguardando} aguardando aprovação.`}`
      : resumo.proximaEntrega
        ? `Próxima em ${dataCurta(resumo.proximaEntrega)}.`
        : resumo.aguardando
          ? resumo.aguardando === 1
            ? "1 aguardando aprovação."
            : `${resumo.aguardando} aguardando aprovação.`
          : "Nenhuma entrega marcada.";
  const atraso = resumo.atraso > 0 ? reais(resumo.valorAtraso) : "Nada em atraso.";
  const vencer = resumo.proximoVencimento
    ? `${reais(resumo.valorProximo)} em ${dataCurta(resumo.proximoVencimento)}.`
    : "Nenhum pagamento perto de vencer.";

  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-3">
      <Indicador valor={resumo.programados} rotulo={resumo.programados === 1 ? "entrega programada" : "entregas programadas"} detalhe={entrega} onClick={onPedidos} />
      <Indicador valor={resumo.atraso} rotulo={resumo.atraso === 1 ? "pagamento em atraso" : "pagamentos em atraso"} detalhe={atraso} destaque={resumo.atraso > 0} onClick={onPagamentos} />
      <Indicador valor={resumo.aVencer} rotulo={resumo.aVencer === 1 ? "pagamento a vencer" : "pagamentos a vencer"} detalhe={vencer} onClick={onPagamentos} />
    </div>
  );
}

function Indicador({
  valor,
  rotulo,
  detalhe,
  destaque = false,
  onClick,
}: {
  valor: number;
  rotulo: string;
  detalhe: string;
  destaque?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={destaque ? "bg-forest px-4 py-3 text-left text-paper" : "border border-ink/10 px-4 py-3 text-left"}
    >
      <p className="display-head text-3xl leading-none">{valor}</p>
      <p className="mt-2 text-sm">{rotulo}</p>
      <p className={`mt-1 text-xs ${destaque ? "text-paper/80" : "text-ink/55"}`}>{detalhe}</p>
    </button>
  );
}

function CartaoPedido({ pedido }: { pedido: PedidoCliente }) {
  return (
    <article className="rounded-sm border border-ink/10 bg-white p-5">
      <h3 className="text-lg">{formatLongDate(pedido.dataEntrega.slice(0, 10))}</h3>
      <p className="text-sm text-ink/55">{statusPedido(pedido.status, pedido.doSite)}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {pedido.itens.map((item) => (
          <li key={`${pedido.id}-${item.nome}`}>
            {item.quantidade} · {item.nome}
            {item.preco != null ? ` · ${reais(item.preco)}` : ""}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PedidosCliente({
  pedidos,
  verHistorico,
  onHistorico,
  onLoja,
}: {
  pedidos: PedidoCliente[];
  verHistorico: boolean;
  onHistorico: () => void;
  onLoja: () => void;
}) {
  const hoje = hojeManaus();
  const programados = pedidos
    .filter((pedido) => pedido.programado ?? (pedido.dataEntrega.slice(0, 10) >= hoje && pedido.status !== "CANCELADO"))
    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));
  const historico = pedidos
    .filter((pedido) => !(pedido.programado ?? (pedido.dataEntrega.slice(0, 10) >= hoje && pedido.status !== "CANCELADO")))
    .sort((a, b) => b.dataEntrega.localeCompare(a.dataEntrega));

  return (
    <section className="mt-8 space-y-4">
      <h2 className="display-head text-3xl">Entregas programadas</h2>
      {programados.length === 0 ? <p className="text-ink/60">Nenhuma entrega programada.</p> : null}
      {programados.map((pedido) => (
        <CartaoPedido key={pedido.id} pedido={pedido} />
      ))}
      <button type="button" className="border border-ink/15 px-3 py-2 text-sm" onClick={onHistorico}>
        {verHistorico ? "Ocultar entregas anteriores" : "Ver entregas anteriores"}
      </button>
      {verHistorico ? (
        <div className="space-y-3">
          <h2 className="display-head text-3xl">Entregas anteriores</h2>
          {historico.length === 0 ? <p className="text-ink/60">Nenhuma entrega anterior neste período.</p> : null}
          {historico.map((pedido) => (
            <CartaoPedido key={pedido.id} pedido={pedido} />
          ))}
        </div>
      ) : null}
      <button type="button" className="text-sm text-forest" onClick={onLoja}>Fazer pedido</button>
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

function ProdutoEquipeCard({
  produto,
  onSave,
  onFoto,
}: {
  produto: ProdutoEquipe;
  onSave: (produto: ProdutoEquipe, patch: { naLoja?: boolean; exclusivo?: boolean; preco?: number; imagemUrl?: string | null; descricao?: string; aplicacao?: string; estoque?: number | null }) => Promise<void>;
  onFoto: (produto: ProdutoEquipe, imagem: string) => Promise<string>;
}) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [preco, setPreco] = useState(produto.preco?.toString() ?? "");
  const [foto, setFoto] = useState(produto.imagemUrl ?? "");
  const [descricao, setDescricao] = useState(produto.descricao);
  const [aplicacao, setAplicacao] = useState(produto.aplicacao);
  const [estoque, setEstoque] = useState(produto.estoque == null ? "" : String(produto.estoque));

  return (
    <article className="space-y-3 rounded-sm border border-ink/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/45">{produto.grupo}</p>
          <h3 className="font-medium">{produto.nome}</h3>
          {produto.exclusivo ? <p className="mt-1 text-xs text-ink/55">Só aparece para quem tem este produto na regra comercial.</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onSave(produto, { naLoja: !produto.naLoja })}>
            {produto.naLoja ? "Tirar da loja" : "Colocar na loja"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onSave(produto, { exclusivo: !produto.exclusivo })}>
            {produto.exclusivo ? "Visível para todos" : "Exclusivo"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">Preço de tabela<input value={preco} onChange={(event) => setPreco(event.target.value)} className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
        <label className="text-sm">Estoque<input value={estoque} onChange={(event) => setEstoque(event.target.value)} placeholder="vazio = sem limite" className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
        <div className="text-sm md:col-span-2">
          <span>Foto</span>
          <div className="mt-1 flex items-center gap-3">
            {foto ? <img src={foto} alt="" className="h-16 w-12 object-cover" /> : null}
            <Button type="button" size="sm" variant="outline" onClick={() => arquivoRef.current?.click()}>
              Escolher foto
            </Button>
            <input
              ref={arquivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const arquivo = event.target.files?.[0];
                event.target.value = "";
                if (!arquivo) return;
                void arquivoParaJpeg(arquivo)
                  .then((imagem) => onFoto(produto, imagem))
                  .then((url) => setFoto(`${url}?v=${Date.now()}`))
                  .catch((error) => toast.error(mensagem(error)));
              }}
            />
          </div>
        </div>
        <label className="text-sm md:col-span-2">Característica<textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={2} className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
        <label className="text-sm md:col-span-2">Aplicação<textarea value={aplicacao} onChange={(event) => setAplicacao(event.target.value)} rows={2} className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          const valor = Number(preco.replace(",", "."));
          if (!Number.isFinite(valor) || valor <= 0) {
            toast.error("Informe um preço maior que zero.");
            return;
          }
          const quantidade = estoque.trim() === "" ? null : Number(estoque.replace(",", "."));
          if (quantidade != null && (!Number.isFinite(quantidade) || quantidade < 0)) {
            toast.error("O estoque precisa ser um número, ou ficar vazio.");
            return;
          }
          void onSave(produto, { preco: valor, descricao, aplicacao, estoque: quantidade });
        }}
      >
        Salvar
      </Button>
    </article>
  );
}
