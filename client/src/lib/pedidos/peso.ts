/** Espelha a regra do portal: peso no nome ou venda por kg. */
export function pesoDoProduto(nome: string, unidade?: string | null): string | null {
  const texto = nome.trim();
  if (!texto) return null;

  const comNumero = texto.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramas?)\b/i);
  if (comNumero) {
    const bruto = comNumero[1].replace(",", ".");
    const numero = Number(bruto);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    const medida = /^kg$/i.test(comNumero[2]) ? "kg" : "g";
    const valor =
      medida === "kg"
        ? numero.toLocaleString("pt-BR", { maximumFractionDigits: 3 })
        : String(Math.round(numero) === numero ? Math.round(numero) : numero);
    return `${valor} ${medida}`;
  }

  if (unidade === "kg" || /\bkg\b/i.test(texto)) return "por kg";
  return null;
}

/** Título limpo: tira o peso do nome (ele já aparece na linha “Peso …”). */
export function nomeSemPeso(nome: string): string {
  return nome
    .replace(/[-–—]?\s*\d+(?:[.,]\d+)?\s*(kg|g|gr|gramas?)\b/gi, "")
    .replace(/\s*\bkg\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-–—|,]\s*$/g, "")
    .trim() || nome.trim();
}

export function rotuloComPeso(nome: string, peso?: string | null, unidade?: string | null): string {
  const limpo = nomeSemPeso(nome);
  const resolvido = peso?.trim() || pesoDoProduto(nome, unidade);
  return resolvido ? `${limpo} · ${resolvido}` : limpo;
}
