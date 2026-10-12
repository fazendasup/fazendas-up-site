import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { portalApi, type CadastroConta, type ContaPortal } from "@/lib/pedidos/api";

function mensagem(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir agora.";
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

function formatarCpf(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function quando(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString("pt-BR", { timeZone: "America/Manaus", dateStyle: "short", timeStyle: "short" });
}

const vazio: CadastroConta = {
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
  cidade: "",
  estado: "",
  inscricaoEstadual: "",
};

export function ContaCliente({ onMinimo }: { onMinimo: (valor: number) => void }) {
  const [conta, setConta] = useState<ContaPortal | null>(null);
  const [cadastro, setCadastro] = useState<CadastroConta>(vazio);
  const [enviando, setEnviando] = useState(false);
  const [nomeAceite, setNomeAceite] = useState("");
  const [cpfAceite, setCpfAceite] = useState("");
  const [emailAceite, setEmailAceite] = useState("");
  const [liEAceito, setLiEAceito] = useState(false);

  const carregar = async () => {
    const dados = await portalApi.conta();
    setConta(dados);
    setCadastro(dados.cadastro);
    setEmailAceite((atual) => atual || dados.cadastro.email);
    onMinimo(dados.minimoReais);
  };

  useEffect(() => {
    void carregar().catch((error) => toast.error(mensagem(error)));
    // A conta é lida uma vez ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alterar(parcial: Partial<CadastroConta>) {
    setCadastro((atual) => ({ ...atual, ...parcial }));
  }

  return (
    <div className="mt-8 max-w-3xl space-y-8">
      <form
        className="grid gap-4 rounded-sm border border-ink/10 bg-white p-6 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setEnviando(true);
          void portalApi
            .salvarConta(cadastro)
            .then((salvo) => {
              setConta(salvo);
              setCadastro(salvo.cadastro);
              onMinimo(salvo.minimoReais);
              if (salvo.aviso) toast.message(salvo.aviso);
              else toast.success("Cadastro atualizado.");
            })
            .catch((error) => toast.error(mensagem(error)))
            .finally(() => setEnviando(false));
        }}
      >
        <h2 className="display-head text-2xl sm:col-span-2">Dados da empresa</h2>
        <p className="text-sm text-ink/60 sm:col-span-2">A alteração segue para o cadastro financeiro da fazenda.</p>
        <Campo label="Razão social" value={cadastro.nome} onChange={(nome) => alterar({ nome })} />
        <Campo label="Nome fantasia" value={cadastro.nomeFantasia} onChange={(nomeFantasia) => alterar({ nomeFantasia })} />
        <Campo label="CNPJ" value={cadastro.cnpj} onChange={() => undefined} readOnly />
        <Campo label="Inscrição estadual" value={cadastro.inscricaoEstadual} onChange={(inscricaoEstadual) => alterar({ inscricaoEstadual })} />
        <Campo label="E-mail" value={cadastro.email} onChange={(email) => alterar({ email })} type="email" />
        <Campo label="Telefone" value={cadastro.telefone} onChange={(telefone) => alterar({ telefone })} inputMode="tel" />
        <Campo label="Pessoa de contato" value={cadastro.contato} onChange={(contato) => alterar({ contato })} />
        <Campo label="CEP" value={cadastro.cep} onChange={(cep) => alterar({ cep })} inputMode="numeric" />
        <Campo label="Logradouro" value={cadastro.logradouro} onChange={(logradouro) => alterar({ logradouro })} />
        <Campo label="Número" value={cadastro.numero} onChange={(numero) => alterar({ numero })} />
        <Campo label="Complemento" value={cadastro.complemento} onChange={(complemento) => alterar({ complemento })} />
        <Campo label="Bairro" value={cadastro.bairro} onChange={(bairro) => alterar({ bairro })} />
        <Campo label="Cidade" value={cadastro.cidade} onChange={(cidade) => alterar({ cidade })} />
        <Campo label="Estado" value={cadastro.estado} onChange={(estado) => alterar({ estado: estado.slice(0, 2).toUpperCase() })} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={enviando}>Salvar dados</Button>
        </div>
      </form>

      {conta?.contrato ? (
        <section className="space-y-4 rounded-sm border border-ink/10 bg-white p-6">
          <h2 className="display-head text-2xl">Contrato de fornecimento recorrente</h2>
          <p className="text-sm text-ink/65">
            {conta.contrato.status === "ACEITO"
              ? "O mínimo de cada entrega recorrente é R$ 150. O pedido avulso, sem este contrato, permanece em R$ 300."
              : "O contrato abaixo está pronto para aceite. Sem o aceite, o pedido mínimo continua R$ 300. Com o aceite, cada entrega recorrente passa a R$ 150."}
          </p>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap border border-ink/10 bg-ink/[0.02] p-4 text-sm leading-relaxed">{conta.contrato.texto}</pre>
          {conta.contrato.aceite ? (
            <div className="space-y-1 text-sm">
              <p>Aceito em {quando(conta.contrato.aceite.aceitoEm)}, horário de Manaus.</p>
              <p>Quem aceitou: {conta.contrato.aceite.representanteNome}, CPF {formatarCpf(conta.contrato.aceite.representanteCpf)}.</p>
              <p>E-mail: {conta.contrato.aceite.representanteEmail}</p>
              <p className="text-ink/55">Versão {conta.contrato.versao}. O registro guarda também o endereço de rede e o navegador usados no aceite.</p>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!liEAceito) {
                  toast.error("Confirme que leu e aceita o contrato.");
                  return;
                }
                setEnviando(true);
                void portalApi
                  .aceitarContrato({
                    representanteNome: nomeAceite,
                    representanteCpf: cpfAceite,
                    representanteEmail: emailAceite,
                    liEAceito: true,
                  })
                  .then((salvo) => {
                    setConta(salvo);
                    onMinimo(salvo.minimoReais);
                    toast.success("Contrato aceito. A entrega recorrente passa a valer a partir de R$ 150.");
                  })
                  .catch((error) => toast.error(mensagem(error)))
                  .finally(() => setEnviando(false));
              }}
            >
              <Campo label="Nome de quem aceita" value={nomeAceite} onChange={setNomeAceite} />
              <Campo label="CPF de quem aceita" value={formatarCpf(cpfAceite)} onChange={setCpfAceite} inputMode="numeric" />
              <Campo label="E-mail de quem aceita" value={emailAceite} onChange={setEmailAceite} type="email" />
              <label className="flex items-start gap-2 text-sm sm:col-span-2">
                <input type="checkbox" className="mt-1" checked={liEAceito} onChange={(event) => setLiEAceito(event.target.checked)} />
                <span>Li o contrato de fornecimento recorrente e aceito os termos, inclusive o prazo de 24 horas antes do envio.</span>
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={enviando || !liEAceito}>Aceitar contrato</Button>
              </div>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
