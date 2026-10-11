import { useEffect, useMemo, useState } from "react";
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

function statusPedido(status: string) {
  if (status === "PENDENTE") return "Aguardando aprovação";
  if (status === "PRONTO") return "Separado";
  if (status === "ENTREGUE") return "Entregue";
  if (status === "CANCELADO") return "Cancelado";
  return "Em andamento";
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
  const [totais, setTotais] = useState({ recebido: 0, emAberto: 0, emAtraso: 0 });
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

  const total = catalogo.reduce((soma, produto) => soma + produto.preco * (carrinho[produto.id] ?? 0), 0);
  const grupos = ORDEM_GRUPOS.filter((item) => catalogo.some((produto) => produto.grupo === item));
  const visiveis = catalogo.filter((produto) => grupo === "Tudo" || produto.grupo === grupo);

  useEffect(() => {
    localStorage.setItem("fazendas.pedido", JSON.stringify(carrinho));
  }, [carrinho]);

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
    setTotais(financeiro.totais);
    setEmAtraso(financeiro.totais.emAtraso > 0);
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
    patch: { naLoja?: boolean; preco?: number; imagemUrl?: string | null; descricao?: string; aplicacao?: string; estoque?: number | null },
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
          {cliente ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-ink/70">{cliente.nome}</span>
              <button type="button" className={vista === "pedidos" ? "text-forest" : "text-ink/70"} onClick={() => setVista("pedidos")}>Meus pedidos</button>
              <button type="button" className={vista === "pagamentos" ? "text-forest" : "text-ink/70"} onClick={() => setVista("pagamentos")}>Pagamentos</button>
              <button type="button" className={vista === "conta" ? "text-forest" : "text-ink/70"} onClick={() => setVista("conta")}>Conta</button>
              {equipe ? <button type="button" className="text-ink/70" onClick={() => setVista("equipe")}>Loja</button> : null}
              <button
                type="button"
                className="text-ink/70"
                onClick={() => {
                  void portalApi.sair().finally(() => {
                    setCliente(null);
                    setPedidos([]);
                    setTitulos([]);
                    setVista("loja");
                    void carregarVitrine();
                  });
                }}
              >
                Sair
              </button>
            </div>
          ) : (
            vista === "equipe" ? null : (
            <div className="flex gap-4 text-sm">
              <button type="button" className="text-ink/70" onClick={() => { setVista("loja"); setModoEquipe(false); }}>Entrar</button>
              <button type="button" className="text-forest" onClick={() => setVista("cadastro")}>Cadastrar empresa</button>
            </div>
            )
          )}
        </div>

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
          <section className="mt-8 space-y-4">
            {pedidos.length === 0 ? <p className="text-ink/60">Nenhum pedido desta conta ainda.</p> : null}
            {pedidos.map((pedido) => (
              <article key={pedido.id} className="rounded-sm border border-ink/10 bg-white p-5">
                <h2 className="text-lg">{formatLongDate(pedido.dataEntrega.slice(0, 10))}</h2>
                <p className="text-sm text-ink/55">{statusPedido(pedido.status)}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {pedido.itens.map((item) => (
                    <li key={`${pedido.id}-${item.nome}`}>{item.quantidade} · {item.nome}{item.preco != null ? ` · ${reais(item.preco)}` : ""}</li>
                  ))}
                </ul>
              </article>
            ))}
            <button type="button" className="text-sm text-forest" onClick={() => setVista("loja")}>Voltar aos produtos</button>
          </section>
        ) : null}

        {vista === "pagamentos" && cliente ? (
          <section className="mt-8 space-y-4">
            <p className="text-sm text-ink/70">Recebido {reais(totais.recebido)} · Em aberto {reais(totais.emAberto)} · Em atraso {reais(totais.emAtraso)}</p>
            {titulos.length === 0 ? <p className="text-ink/60">Nenhum pagamento neste período.</p> : null}
            {titulos.map((titulo) => (
              <article key={titulo.id} className="rounded-sm border border-ink/10 bg-white p-5 text-sm">
                <h2 className="text-base">{titulo.descricao || "Pagamento"}</h2>
                <p className="text-ink/60">
                  {titulo.vencimento ? `Vence ${formatLongDate(titulo.vencimento.slice(0, 10))}` : ""}
                  {titulo.pagamento ? ` · pago ${formatLongDate(titulo.pagamento.slice(0, 10))}` : ""}
                </p>
                <p>{reais(titulo.valor)}{titulo.emAberto > 0 ? ` · aberto ${reais(titulo.emAberto)}` : ""}</p>
              </article>
            ))}
          </section>
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
                    <ProdutoEquipeCard key={produto.id} produto={produto} onSave={salvarProduto} />
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
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <p className="text-2xl font-medium tabular-nums">{reais(total)}</p>
              {total === 0 ? <p className="text-sm text-ink/55">Escolha a quantidade nos produtos.</p> : null}
              {total > 0 && total < minimo ? <p className="text-sm text-ink/65">Faltam {reais(minimo - total)} para a entrega.</p> : null}
              {emAtraso && cliente ? <p className="text-sm text-red-800">Há um pagamento em atraso nesta conta. O pedido fica bloqueado até a regularização.</p> : null}
              <ul className="space-y-3 text-sm">
                {catalogo.filter((produto) => (carrinho[produto.id] ?? 0) > 0).map((produto) => {
                  const qtd = carrinho[produto.id] ?? 0;
                  const noTeto = produto.estoque != null && qtd >= produto.estoque;
                  return (
                    <li key={produto.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{produto.nome}</p>
                        <p className="text-xs text-ink/50">{reais(produto.preco * qtd)}</p>
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
        className="h-32 w-full object-cover"
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
            {reais(produto.preco)}
            <span className="ml-1 text-xs font-normal text-ink/50">/{produto.unidade}</span>
          </p>
          {produto.precoEspecial ? <p className="text-[0.65rem] text-forest">Sua conta</p> : null}
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

function ProdutoEquipeCard({
  produto,
  onSave,
}: {
  produto: ProdutoEquipe;
  onSave: (produto: ProdutoEquipe, patch: { naLoja?: boolean; preco?: number; imagemUrl?: string | null; descricao?: string; aplicacao?: string; estoque?: number | null }) => Promise<void>;
}) {
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
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => onSave(produto, { naLoja: !produto.naLoja })}>
          {produto.naLoja ? "Tirar da loja" : "Colocar na loja"}
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">Preço<input value={preco} onChange={(event) => setPreco(event.target.value)} className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
        <label className="text-sm">Estoque<input value={estoque} onChange={(event) => setEstoque(event.target.value)} placeholder="vazio = sem limite" className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
        <label className="text-sm md:col-span-2">Foto<input value={foto} onChange={(event) => setFoto(event.target.value)} className="mt-1 w-full border border-ink/15 px-2 py-2" /></label>
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
          void onSave(produto, { preco: valor, imagemUrl: foto.trim() || null, descricao, aplicacao, estoque: quantidade });
        }}
      >
        Salvar
      </Button>
    </article>
  );
}
