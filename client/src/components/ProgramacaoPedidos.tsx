import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { portalApi, PortalError, type ProdutoLoja, type ProgramacaoPortal } from "@/lib/pedidos/api";
import { pesoDoProduto } from "@/lib/pedidos/peso";

const DIAS = [
  { dia: 1, curto: "Seg", nome: "Segunda" },
  { dia: 2, curto: "Ter", nome: "Terça" },
  { dia: 3, curto: "Qua", nome: "Quarta" },
  { dia: 4, curto: "Qui", nome: "Quinta" },
  { dia: 5, curto: "Sex", nome: "Sexta" },
];

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataCurta(ymd: string) {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes ?? 1) - 1, dia ?? 1)).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function mensagem(error: unknown) {
  return error instanceof PortalError ? error.message : "Não foi possível concluir agora.";
}

export function ProgramacaoPedidos({ produtos }: { produtos: ProdutoLoja[] }) {
  const [minimo, setMinimo] = useState(150);
  const [marcados, setMarcados] = useState<number[]>([]);
  const [quantidades, setQuantidades] = useState<Record<number, Record<string, number>>>({});
  const [proximas, setProximas] = useState<ProgramacaoPortal["proximas"]>([]);
  const [busca, setBusca] = useState<Record<number, string>>({});
  const [escolha, setEscolha] = useState<Record<number, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const porId = useMemo(() => new Map(produtos.map((produto) => [produto.id, produto])), [produtos]);

  const aplicar = (dados: ProgramacaoPortal) => {
    setMinimo(dados.minimoReais);
    setMarcados(dados.dias.map((dia) => dia.diaSemana));
    setQuantidades(
      Object.fromEntries(
        dados.dias.map((dia) => [
          dia.diaSemana,
          Object.fromEntries(dia.itens.map((item) => [item.produtoId, item.quantidade])),
        ]),
      ),
    );
    setProximas(dados.proximas);
  };

  useEffect(() => {
    let ativo = true;
    void portalApi
      .programacao()
      .then((dados) => {
        if (ativo) aplicar(dados);
      })
      .catch((error) => toast.error(mensagem(error)))
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const alternarDia = (dia: number) => {
    setMarcados((atual) => (atual.includes(dia) ? atual.filter((item) => item !== dia) : [...atual, dia].sort((a, b) => a - b)));
  };

  const definir = (dia: number, produtoId: string, quantidade: number) => {
    const produto = porId.get(produtoId);
    const teto = produto?.estoque == null ? 9999 : produto.estoque;
    setQuantidades((atual) => {
      const doDia = { ...(atual[dia] ?? {}) };
      if (quantidade <= 0) delete doDia[produtoId];
      else doDia[produtoId] = Math.min(teto, quantidade);
      return { ...atual, [dia]: doDia };
    });
  };

  const adicionar = (dia: number) => {
    const produtoId = escolha[dia];
    if (!produtoId) return;
    definir(dia, produtoId, (quantidades[dia]?.[produtoId] ?? 0) + 1);
    setEscolha((atual) => ({ ...atual, [dia]: "" }));
  };

  const copiar = (origem: number) => {
    const base = quantidades[origem] ?? {};
    setQuantidades((atual) => {
      const proximo = { ...atual };
      for (const dia of marcados) {
        if (dia !== origem) proximo[dia] = { ...base };
      }
      return proximo;
    });
  };

  const totalDoDia = (dia: number) =>
    Object.entries(quantidades[dia] ?? {}).reduce((soma, [id, quantidade]) => soma + (porId.get(id)?.preco ?? 0) * quantidade, 0);

  const salvar = async () => {
    if (marcados.length < 1) {
      toast.error("Escolha ao menos um dia da semana.");
      return;
    }
    const dias = marcados.map((diaSemana) => ({
      diaSemana,
      itens: Object.entries(quantidades[diaSemana] ?? {})
        .filter(([, quantidade]) => quantidade > 0)
        .map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
    }));
    if (dias.some((dia) => dia.itens.length < 1)) {
      toast.error("Cada dia marcado precisa ter ao menos um produto.");
      return;
    }
    if (dias.some((dia) => totalDoDia(dia.diaSemana) < minimo)) {
      toast.error(`Cada dia de entrega precisa chegar a ${reais(minimo)}.`);
      return;
    }
    setSalvando(true);
    try {
      const salva = await portalApi.salvarProgramacao({ dias });
      aplicar(salva);
      toast.success(
        salva.mantidas
          ? "Programação salva. Entregas já dentro de 2 dias úteis permaneceram como estavam."
          : "Programação salva. Ela se repete toda semana.",
      );
    } catch (error) {
      toast.error(mensagem(error));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <p className="mt-8 text-ink/60">Carregando a programação...</p>;

  return (
    <section className="mt-8 max-w-3xl">
      <h2 className="display-head text-3xl">Programação de pedidos</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
        Marque os dias da semana e os produtos de cada um. Os dias podem ter cardápios diferentes, e a mesma programação se repete na semana seguinte.
        Sábado, domingo e feriado de Manaus não entram na rota. Cada entrega segue o mínimo de {reais(minimo)}. Uma mudança vale para as entregas que ainda estão fora da antecedência de 2 dias úteis.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {DIAS.map((dia) => {
          const ativo = marcados.includes(dia.dia);
          return (
            <button
              key={dia.dia}
              type="button"
              className={ativo ? "bg-forest px-4 py-2 text-sm text-paper" : "border border-ink/15 px-4 py-2 text-sm"}
              onClick={() => alternarDia(dia.dia)}
            >
              {dia.nome}
            </button>
          );
        })}
      </div>
      {marcados.map((diaSemana) => {
        const dia = DIAS.find((item) => item.dia === diaSemana)!;
        const linhas = Object.entries(quantidades[diaSemana] ?? {}).filter(([, quantidade]) => quantidade > 0);
        const filtro = (busca[diaSemana] ?? "").trim().toLowerCase();
        const opcoes = produtos.filter((produto) => produto.preco != null && produto.nome.toLowerCase().includes(filtro));
        const total = totalDoDia(diaSemana);
        return (
          <div key={diaSemana} className="mt-6 border border-ink/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="display-head text-2xl">{dia.nome}</h3>
              {marcados.length > 1 ? (
                <button type="button" className="text-sm text-forest" onClick={() => copiar(diaSemana)}>
                  Usar estes produtos nos outros dias
                </button>
              ) : null}
            </div>
            <ul className="mt-4 space-y-3">
              {linhas.map(([produtoId, quantidade]) => {
                const produto = porId.get(produtoId);
                const peso = produto ? produto.peso?.trim() || pesoDoProduto(produto.nome, produto.unidade) : null;
                return (
                  <li key={produtoId} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
                    <div>
                      <p>{produto?.nome ?? "Produto"}</p>
                      <p className="text-sm text-ink/55">
                        {peso ? `Peso ${peso}` : null}
                        {peso && produto?.preco != null ? " · " : null}
                        {produto?.preco != null ? reais(produto.preco) : "Sem preço"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={quantidade}
                        onChange={(event) => definir(diaSemana, produtoId, Number(event.target.value))}
                        className="w-20 border border-ink/15 px-2 py-2"
                      />
                      <button type="button" className="text-sm text-ink/60" onClick={() => definir(diaSemana, produtoId, 0)}>
                        Tirar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={busca[diaSemana] ?? ""}
                placeholder="Buscar produto"
                onChange={(event) => setBusca((atual) => ({ ...atual, [diaSemana]: event.target.value }))}
                className="border border-ink/15 px-3 py-2"
              />
              <select
                value={escolha[diaSemana] ?? ""}
                onChange={(event) => setEscolha((atual) => ({ ...atual, [diaSemana]: event.target.value }))}
                className="border border-ink/15 bg-white px-3 py-2"
              >
                <option value="">Escolher produto</option>
                {opcoes.map((produto) => {
                  const peso = produto.peso?.trim() || pesoDoProduto(produto.nome, produto.unidade);
                  return (
                    <option key={produto.id} value={produto.id}>
                      {peso ? `${produto.nome} · ${peso}` : produto.nome}
                    </option>
                  );
                })}
              </select>
              <Button type="button" variant="outline" onClick={() => adicionar(diaSemana)}>
                Adicionar
              </Button>
            </div>
            <p className="mt-4 text-sm">
              {total >= minimo ? `Total deste dia: ${reais(total)}` : `Faltam ${reais(minimo - total)} para a entrega de ${dia.nome.toLowerCase()}.`}
            </p>
          </div>
        );
      })}
      <div className="mt-6">
        <Button type="button" disabled={salvando} onClick={() => void salvar()}>
          Salvar programação
        </Button>
      </div>
      {proximas.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-lg">Próximas entregas desta programação</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {proximas.map((entrega) => (
              <li key={entrega.data} className="flex justify-between gap-4 border-b border-ink/10 py-2">
                <span>{dataCurta(entrega.data)}</span>
                <span>{reais(entrega.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
