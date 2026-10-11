import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  portalApi,
  PortalError,
  type ClienteSessao,
  type EquipeSessao,
  type PedidoCliente,
  type ProdutoEquipe,
  type ProdutoLoja,
  type TituloCliente,
} from "@/lib/pedidos/api";
import { formatLongDate } from "@/lib/pedidos/rules";

type Aba = "produtos" | "encomenda" | "pedidos" | "financeiro" | "equipe";

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mensagem(error: unknown) {
  return error instanceof PortalError ? error.message : "Não foi possível concluir agora.";
}

export default function PedidosPage() {
  const convite = useMemo(() => new URLSearchParams(window.location.search).get("convite") ?? "", []);
  const [aba, setAba] = useState<Aba>("produtos");
  const [carregando, setCarregando] = useState(true);
  const [cliente, setCliente] = useState<ClienteSessao | null>(null);
  const [equipe, setEquipe] = useState<EquipeSessao | null>(null);
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [modoEquipe, setModoEquipe] = useState(false);
  const [datas, setDatas] = useState<string[]>([]);
  const [minimo, setMinimo] = useState(300);
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [catalogo, setCatalogo] = useState<ProdutoLoja[]>([]);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [titulos, setTitulos] = useState<TituloCliente[]>([]);
  const [totais, setTotais] = useState({ recebido: 0, emAberto: 0, emAtraso: 0 });
  const [avisoFinanceiro, setAvisoFinanceiro] = useState("");
  const [produtosEquipe, setProdutosEquipe] = useState<ProdutoEquipe[]>([]);
  const [convites, setConvites] = useState<Array<{ nome: string; email: string; link: string }>>([]);
  const [enviando, setEnviando] = useState(false);

  const total = catalogo.reduce((soma, produto) => soma + produto.preco * (carrinho[produto.id] ?? 0), 0);
  const emAtraso = totais.emAtraso > 0;

  async function carregarLoja() {
    const [lista, agenda, historico, financeiro] = await Promise.all([
      portalApi.catalogo(),
      portalApi.regras(),
      portalApi.pedidos(),
      portalApi.financeiro(),
    ]);
    setCatalogo(lista.itens);
    setDatas(agenda.datas);
    setMinimo(agenda.minimoReais);
    setDataEntrega((atual) => atual || agenda.datas[0] || "");
    setPedidos(historico.pedidos);
    setTitulos(financeiro.titulos);
    setTotais(financeiro.totais);
    setAvisoFinanceiro(financeiro.aviso ?? "");
  }

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const sessao = await portalApi.sessao();
        if (!ativo) return;
        setCliente(sessao.cliente);
        setEquipe(sessao.equipe);
        if (sessao.equipe && !sessao.cliente) {
          setAba("equipe");
          const lista = await portalApi.equipeProdutos();
          if (!ativo) return;
          setProdutosEquipe(lista.produtos);
        }
        if (sessao.cliente) await carregarLoja();
        else {
          const regras = await portalApi.regras();
          if (!ativo) return;
          setDatas(regras.datas);
          setMinimo(regras.minimoReais);
          setDataEntrega(regras.datas[0] ?? "");
        }
      } catch (error) {
        if (ativo) toast.error(mensagem(error));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const definirQtd = (id: string, qtd: number) => {
    setCarrinho((atual) => {
      const proximo = { ...atual };
      if (qtd <= 0) delete proximo[id];
      else proximo[id] = Math.min(9999, qtd);
      return proximo;
    });
  };

  const entrar = async () => {
    setEnviando(true);
    try {
      if (modoEquipe) {
        const resposta = await portalApi.equipeEntrar(email, senha);
        setEquipe(resposta.equipe);
        setAba("equipe");
        const lista = await portalApi.equipeProdutos();
        setProdutosEquipe(lista.produtos);
        toast.success("Acesso da equipe aberto.");
      } else {
        const resposta = await portalApi.entrar(cnpj, senha);
        setCliente(resposta.cliente);
        setSenha("");
        await carregarLoja();
        toast.success("Entrada confirmada.");
      }
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const criarSenha = async () => {
    if (senha.length < 10) {
      toast.error("A senha precisa ter pelo menos 10 caracteres.");
      return;
    }
    if (senha !== senha2) {
      toast.error("As duas senhas precisam ser iguais.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await portalApi.ativar(convite, senha);
      setCliente(resposta.cliente);
      setSenha("");
      setSenha2("");
      window.history.replaceState({}, "", "/pedidos");
      await carregarLoja();
      toast.success("Senha criada. Esta conta é só da sua empresa.");
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const lancar = async () => {
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
      await carregarLoja();
      setAba("pedidos");
      toast.success("Pedido lançado na programação da fazenda.");
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const abrirEquipe = async () => {
    setAba("equipe");
    if (produtosEquipe.length > 0) return;
    try {
      const lista = await portalApi.equipeProdutos();
      setProdutosEquipe(lista.produtos);
    } catch (error) {
      toast.error(mensagem(error));
    }
  };

  const salvarProduto = async (produto: ProdutoEquipe, patch: { naLoja?: boolean; preco?: number; imagemUrl?: string | null }) => {
    try {
      const salvo = await portalApi.salvarProduto(produto.id, patch);
      setProdutosEquipe((atual) =>
        atual.map((item) => (item.id === produto.id ? { ...item, ...salvo } : item)),
      );
      toast.success("Produto atualizado.");
    } catch (error) {
      toast.error(mensagem(error));
    }
  };

  const gerarConvites = async () => {
    setEnviando(true);
    try {
      const resposta = await portalApi.convites();
      setConvites(resposta.criados);
      toast.success(
        resposta.criados.length
          ? `${resposta.criados.length} convites prontos. Copie e envie a cada cliente. O link aparece só agora.`
          : "Nenhum convite novo. Quem já tem senha não entra de novo nesta lista.",
      );
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setEnviando(false);
    }
  };

  const abas: Array<[Aba, string]> = [
    ["produtos", "Produtos"],
    ["encomenda", "Encomenda"],
    ["pedidos", "Meus pedidos"],
    ["financeiro", "Boletos e notas"],
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader variant="subpage" />
      <main className="container pb-20 pt-28">
        <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-forest">Pedidos B2B</p>
        <h1 className="display-head mt-3 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-ink">
          Cada cliente entra na própria conta.
        </h1>
        <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink/75">
          Os produtos e os pagamentos vêm do Conta Azul. O pedido entra na programação da fazenda.
          Entrega em dia útil, com 2 dias úteis de antecedência, e mínimo de {reais(minimo)}.
          {datas[0] ? ` A primeira data é ${formatLongDate(datas[0])}.` : ""}
        </p>

        {carregando ? <p className="mt-8 text-ink/60">Carregando a conta...</p> : null}

        {!carregando && !cliente && convite ? (
          <form
            className="mt-8 max-w-md space-y-4 rounded-sm border border-ink/10 bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void criarSenha();
            }}
          >
            <h2 className="text-xl">Crie a senha da sua empresa</h2>
            <p className="text-sm text-ink/65">
              O cadastro já existe. Esta senha vale só para este convite e não abre a conta de outro cliente.
            </p>
            <label className="block text-sm">
              Senha
              <input
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="mt-1 w-full border border-ink/15 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Repita a senha
              <input
                type="password"
                autoComplete="new-password"
                value={senha2}
                onChange={(event) => setSenha2(event.target.value)}
                className="mt-1 w-full border border-ink/15 px-3 py-2"
              />
            </label>
            <Button type="submit" disabled={enviando}>
              Criar senha e entrar
            </Button>
          </form>
        ) : null}

        {!carregando && !cliente && !convite && !equipe ? (
          <form
            className="mt-8 max-w-md space-y-4 rounded-sm border border-ink/10 bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void entrar();
            }}
          >
            <h2 className="text-xl">{modoEquipe ? "Equipe da fazenda" : "Entrar"}</h2>
            <label className="block text-sm">
              {modoEquipe ? "E-mail" : "CNPJ"}
              <input
                type={modoEquipe ? "email" : "text"}
                inputMode={modoEquipe ? "email" : "numeric"}
                autoComplete="username"
                value={modoEquipe ? email : cnpj}
                onChange={(event) => (modoEquipe ? setEmail(event.target.value) : setCnpj(event.target.value))}
                className="mt-1 w-full border border-ink/15 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Senha
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="mt-1 w-full border border-ink/15 px-3 py-2"
              />
            </label>
            {modoEquipe ? null : (
              <p className="text-sm text-ink/60">A senha inicial são os 5 primeiros dígitos do CNPJ. Dá para trocar em Pedidos.</p>
            )}
            <Button type="submit" disabled={enviando}>
              Entrar
            </Button>
            <button
              type="button"
              className="block text-sm text-forest underline"
              onClick={() => setModoEquipe((atual) => !atual)}
            >
              {modoEquipe ? "Sou cliente" : "Sou da equipe"}
            </button>
          </form>
        ) : null}

        {cliente ? (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink/70">
                {cliente.nome}
                {cliente.cnpj ? ` · ${cliente.cnpj}` : ""}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void portalApi.sair().finally(() => {
                    setCliente(null);
                    setCarrinho({});
                    setCatalogo([]);
                    setPedidos([]);
                    setTitulos([]);
                  });
                }}
              >
                Sair
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {abas.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAba(id)}
                  className={`rounded-full px-4 py-2 text-sm ${aba === id ? "bg-forest text-paper" : "bg-ink/5 text-ink"}`}
                >
                  {label}
                </button>
              ))}
              {equipe ? (
                <button
                  type="button"
                  onClick={() => void abrirEquipe()}
                  className={`rounded-full px-4 py-2 text-sm ${aba === "equipe" ? "bg-forest text-paper" : "bg-ink/5 text-ink"}`}
                >
                  Loja da equipe
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        {cliente && aba === "produtos" ? (
          <section className="mt-8 grid gap-6 md:grid-cols-3">
            {catalogo.length === 0 ? (
              <p className="text-ink/60">Nenhum produto liberado na loja. A equipe marca isso depois da sincronização do Conta Azul.</p>
            ) : null}
            {catalogo.map((produto) => {
              const qtd = carrinho[produto.id] ?? 0;
              return (
                <article key={produto.id} className="overflow-hidden rounded-sm border border-ink/10 bg-white">
                  {produto.imagemUrl ? (
                    <img src={produto.imagemUrl} alt="" className="h-52 w-full object-cover" />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-ink/5 text-sm text-ink/40">Sem foto</div>
                  )}
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ink/45">{produto.categoria || "Cultivo"}</p>
                        <h2 className="text-lg font-medium">{produto.nome}</h2>
                      </div>
                      <p className="text-sm font-medium">
                        {reais(produto.preco)}
                        <span className="block text-xs font-normal text-ink/50">/{produto.unidade}</span>
                      </p>
                    </div>
                    {produto.precoEspecial ? <p className="text-sm text-forest">Preço da sua conta</p> : null}
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => definirQtd(produto.id, qtd - 1)}>
                        −
                      </Button>
                      <span className="w-8 text-center tabular-nums">{qtd}</span>
                      <Button type="button" size="sm" onClick={() => definirQtd(produto.id, qtd + 1)}>
                        +
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        {cliente && aba === "encomenda" ? (
          <section className="mt-8 max-w-xl space-y-4">
            <p className="text-lg">Total {reais(total)}</p>
            {total < minimo ? <p className="text-sm text-ink/65">Faltam {reais(minimo - total)} para a entrega.</p> : null}
            {emAtraso ? (
              <p className="text-sm text-red-800">Há pagamento em atraso. O lançamento fica bloqueado até a regularização.</p>
            ) : null}
            <label className="block text-sm">
              Data de entrega
              <select
                value={dataEntrega}
                onChange={(event) => setDataEntrega(event.target.value)}
                className="mt-1 w-full border border-ink/15 bg-white px-3 py-2"
              >
                {datas.map((data) => (
                  <option key={data} value={data}>
                    {formatLongDate(data)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Observação
              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                className="mt-1 w-full border border-ink/15 px-3 py-2"
                rows={3}
              />
            </label>
            <ul className="space-y-1 text-sm">
              {catalogo
                .filter((produto) => (carrinho[produto.id] ?? 0) > 0)
                .map((produto) => (
                  <li key={produto.id}>
                    {carrinho[produto.id]} {produto.unidade} · {produto.nome}
                  </li>
                ))}
            </ul>
            <Button type="button" disabled={enviando || emAtraso} onClick={() => void lancar()}>
              Lançar pedido
            </Button>
          </section>
        ) : null}

        {cliente && aba === "pedidos" ? (
          <section className="mt-8 space-y-4">
            <form
              className="max-w-md space-y-3 rounded-sm border border-ink/10 bg-white p-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (senhaNova.length < 6) {
                  toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
                  return;
                }
                if (senhaNova !== senha2) {
                  toast.error("As duas senhas novas precisam ser iguais.");
                  return;
                }
                setEnviando(true);
                void portalApi
                  .alterarSenha(senhaAtual, senhaNova)
                  .then(() => {
                    setSenhaAtual("");
                    setSenhaNova("");
                    setSenha2("");
                    toast.success("Senha alterada. No próximo acesso use a senha nova.");
                  })
                  .catch((error) => toast.error(mensagem(error)))
                  .finally(() => setEnviando(false));
              }}
            >
              <h2 className="text-lg">Senha desta conta</h2>
              <p className="text-sm text-ink/60">
                Se ainda não trocou, a senha atual são os 5 primeiros dígitos do CNPJ.
              </p>
              <label className="block text-sm">
                Senha atual
                <input
                  type="password"
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                  className="mt-1 w-full border border-ink/15 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Nova senha
                <input
                  type="password"
                  autoComplete="new-password"
                  value={senhaNova}
                  onChange={(event) => setSenhaNova(event.target.value)}
                  className="mt-1 w-full border border-ink/15 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Repita a nova senha
                <input
                  type="password"
                  autoComplete="new-password"
                  value={senha2}
                  onChange={(event) => setSenha2(event.target.value)}
                  className="mt-1 w-full border border-ink/15 px-3 py-2"
                />
              </label>
              <Button type="submit" disabled={enviando}>
                Alterar senha
              </Button>
            </form>
            {pedidos.length === 0 ? <p className="text-ink/60">Nenhum pedido desta conta ainda.</p> : null}
            {pedidos.map((pedido) => (
              <article key={pedido.id} className="rounded-sm border border-ink/10 bg-white p-5">
                <h2 className="text-lg">{formatLongDate(pedido.dataEntrega.slice(0, 10))}</h2>
                <p className="text-sm text-ink/55">{pedido.status}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {pedido.itens.map((item) => (
                    <li key={`${pedido.id}-${item.nome}`}>
                      {item.quantidade} · {item.nome}
                      {item.preco != null ? ` · ${reais(item.preco)}` : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        {cliente && aba === "financeiro" ? (
          <section className="mt-8 space-y-4">
            <p className="text-sm text-ink/70">
              Recebido {reais(totais.recebido)} · Em aberto {reais(totais.emAberto)} · Em atraso {reais(totais.emAtraso)}
            </p>
            {avisoFinanceiro ? <p className="text-sm text-ink/60">{avisoFinanceiro}</p> : null}
            {titulos.length === 0 ? <p className="text-ink/60">Nenhum título neste período.</p> : null}
            {titulos.map((titulo) => (
              <article key={titulo.id} className="rounded-sm border border-ink/10 bg-white p-5 text-sm">
                <h2 className="text-base">{titulo.descricao || titulo.referencia || "Título"}</h2>
                <p className="text-ink/60">
                  {titulo.status}
                  {titulo.vencimento ? ` · vence ${titulo.vencimento.slice(0, 10)}` : ""}
                  {titulo.pagamento ? ` · pago ${titulo.pagamento.slice(0, 10)}` : ""}
                </p>
                <p>
                  {reais(titulo.valor)}
                  {titulo.emAberto > 0 ? ` · aberto ${reais(titulo.emAberto)}` : ""}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        {aba === "equipe" && equipe ? (
          <section className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink/70">Equipe: {equipe.nome}. Novos itens nascem no Conta Azul. Aqui você libera, tira da loja, ajusta preço e foto.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void portalApi.equipeSair().finally(() => {
                    setEquipe(null);
                    setAba("produtos");
                  });
                }}
              >
                Sair da equipe
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={enviando}
                onClick={() => {
                  setEnviando(true);
                  void portalApi
                    .liberarProdutos()
                    .then(async (resposta) => {
                      const lista = await portalApi.equipeProdutos();
                      setProdutosEquipe(lista.produtos);
                      toast.success(`${resposta.atualizados} produtos com preço ficaram disponíveis na loja.`);
                    })
                    .catch((error) => toast.error(mensagem(error)))
                    .finally(() => setEnviando(false));
                }}
              >
                Colocar na loja os produtos que já têm preço
              </Button>
              <Button type="button" disabled={enviando} onClick={() => void gerarConvites()}>
                Gerar convites de quem ainda não tem senha
              </Button>
            </div>
            {convites.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {convites.map((item) => (
                  <li key={item.email} className="break-all rounded-sm border border-ink/10 bg-white p-3">
                    <strong>{item.nome}</strong> · {item.email}
                    <div>{item.link}</div>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="space-y-3">
              {produtosEquipe.map((produto) => (
                <ProdutoEquipeCard key={produto.id} produto={produto} onSave={salvarProduto} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function ProdutoEquipeCard({
  produto,
  onSave,
}: {
  produto: ProdutoEquipe;
  onSave: (produto: ProdutoEquipe, patch: { naLoja?: boolean; preco?: number; imagemUrl?: string | null }) => Promise<void>;
}) {
  const [preco, setPreco] = useState(produto.preco?.toString() ?? "");
  const [foto, setFoto] = useState(produto.imagemUrl ?? "");

  return (
    <article className="grid gap-3 rounded-sm border border-ink/10 bg-white p-4 md:grid-cols-[1fr_8rem_1fr_auto]">
      <div>
        <h3 className="font-medium">{produto.nome}</h3>
        <p className="text-xs text-ink/50">{produto.categoria || "Sem categoria"} · {produto.unidade}</p>
      </div>
      <label className="text-sm">
        Preço
        <input
          value={preco}
          onChange={(event) => setPreco(event.target.value)}
          className="mt-1 w-full border border-ink/15 px-2 py-1"
        />
      </label>
      <label className="text-sm">
        Foto (https)
        <input
          value={foto}
          onChange={(event) => setFoto(event.target.value)}
          className="mt-1 w-full border border-ink/15 px-2 py-1"
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onSave(produto, { naLoja: !produto.naLoja })}
        >
          {produto.naLoja ? "Tirar da loja" : "Colocar na loja"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            const valor = Number(preco.replace(",", "."));
            if (!Number.isFinite(valor) || valor <= 0) {
              toast.error("Informe um preço maior que zero.");
              return;
            }
            void onSave(produto, { preco: valor, imagemUrl: foto.trim() || null });
          }}
        >
          Salvar
        </Button>
      </div>
    </article>
  );
}
