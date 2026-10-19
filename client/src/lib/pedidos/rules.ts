/** Regras comerciais da Fazendas Up para encomenda B2B. */

export const MIN_ORDER_CENTS = 30_000;
export const LEAD_BUSINESS_DAYS = 2;
export const TIMEZONE = "America/Manaus";

/** Feriados nacionais e de Manaus/AM usados no calendário de entrega. */
const HOLIDAYS = new Set([
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-04-03",
  "2026-04-21",
  "2026-05-01",
  "2026-06-04",
  "2026-09-05",
  "2026-09-07",
  "2026-10-12",
  "2026-10-24",
  "2026-11-02",
  "2026-11-15",
  "2026-12-25",
  "2027-01-01",
  "2027-02-08",
  "2027-02-09",
  "2027-03-26",
  "2027-04-21",
  "2027-05-01",
  "2027-05-27",
  "2027-09-05",
  "2027-09-07",
  "2027-10-12",
  "2027-10-24",
  "2027-11-02",
  "2027-11-15",
  "2027-12-25",
]);

export function todayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function weekdayUtc(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isBusinessDay(ymd: string): boolean {
  const day = weekdayUtc(ymd);
  if (day === 0 || day === 6) return false;
  return !HOLIDAYS.has(ymd);
}

export function nextBusinessDay(ymd: string): string {
  let cursor = ymd;
  for (let i = 0; i < 21 && !isBusinessDay(cursor); i += 1) {
    cursor = addCalendarDays(cursor, 1);
  }
  return cursor;
}

/** Soma dias úteis depois da data informada. A própria data não conta. */
export function addBusinessDays(ymd: string, businessDays: number): string {
  let cursor = ymd;
  let left = businessDays;
  while (left > 0) {
    cursor = addCalendarDays(cursor, 1);
    if (isBusinessDay(cursor)) left -= 1;
  }
  return cursor;
}

/**
 * Entrega só a partir de 2 dias úteis (48h em dia útil).
 * Fim de semana e feriado não contam e não recebem entrega.
 */
export function earliestDeliveryYmd(now = new Date()): string {
  const today = todayYmd(now);
  const start = isBusinessDay(today) ? today : nextBusinessDay(today);
  return addBusinessDays(start, LEAD_BUSINESS_DAYS);
}

export function upcomingDeliveryDates(now = new Date(), count = 12): string[] {
  const dates: string[] = [];
  let cursor = earliestDeliveryYmd(now);
  while (dates.length < count) {
    if (isBusinessDay(cursor)) dates.push(cursor);
    cursor = addCalendarDays(cursor, 1);
  }
  return dates;
}

export function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatLongDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string, factors: number[]) => {
    const total = factors.reduce((sum, factor, index) => sum + Number(base[index]) * factor, 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(cnpj.slice(0, 12) + String(d1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${d1}${d2}`);
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) sum += Number(base[i]) * (factor - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return calc(cpf.slice(0, 9), 10) === Number(cpf[9]) && calc(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Formata CPF ou CNPJ conforme o tamanho digitado. */
export function formatDocumento(value: string): string {
  const digits = onlyDigits(value);
  return digits.length <= 11 ? formatCpf(digits) : formatCnpj(digits);
}
