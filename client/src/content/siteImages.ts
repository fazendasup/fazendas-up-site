export type SiteImageKey =
  | "hero"
  | "technologyStep1"
  | "technologyStep2"
  | "technologyStep3"
  | "technologyStep4"
  | "cultivosMicroverdes"
  | "cultivosSalanova"
  | "cultivosFlores"
  | "forChefs"
  | "manifesto"
  | "manifestoTrack";

/** Primeiro env não vazio entre candidatos (compat com variáveis antigas). */
function firstEnv(...candidates: Array<string | undefined>): string | undefined {
  for (const c of candidates) {
    const t = c?.trim();
    if (t) return t;
  }
  return undefined;
}

const fallbackImages: Record<SiteImageKey, string> = {
  hero: "/uploads/IMG_4300.jpg",
  technologyStep1: "/uploads/DSC_0229.jpg",
  technologyStep2: "/uploads/IMG_0073.jpg",
  technologyStep3: "/uploads/IMG_6915.jpg",
  technologyStep4: "/uploads/DSC_9912.jpg",
  /* Cultivos: chaves herdadas do código — salanova = hortaliças folhosas; flores = saladas prontas */
  cultivosMicroverdes: "/uploads/DSC_7134.jpg",
  /** Cap. Produtos — Nº02 Hortaliças folhosas */
  cultivosSalanova: "/uploads/IMG_7964.jpg",
  cultivosFlores: "/uploads/prato_15.jpg",
  forChefs: "/uploads/prato_16.jpg",
  manifesto: "/uploads/amazonia_aerea_dark.jpg",
  manifestoTrack: "/uploads/IMG_6915.jpg",
};

/**
 * Opcionalmente sobrescreva qualquer imagem via variaveis VITE_IMG_* no .env:
 * - VITE_IMG_HERO
 * - VITE_IMG_TECH_STEP1 … VITE_IMG_TECH_STEP4 (capitulo Tecnologia, um ficheiro por passo)
 * - Legado: VITE_IMG_TECH_PRIMARY → step 1; VITE_IMG_TECH_SECONDARY → step 2; VITE_IMG_TECH_STEP4 → step 4
 * - VITE_IMG_CULTIVOS_MICROVERDES, VITE_IMG_CULTIVOS_SALANOVA, VITE_IMG_CULTIVOS_FLORES
 * - VITE_IMG_FOR_CHEFS, VITE_IMG_MANIFESTO, VITE_IMG_MANIFESTO_TRACK
 *
 * Dica: coloque seus arquivos em client/public/uploads e use /uploads/nome.jpg
 */
const imageOverrides: Partial<Record<SiteImageKey, string | undefined>> = {
  hero: import.meta.env.VITE_IMG_HERO,
  technologyStep1: firstEnv(
    import.meta.env.VITE_IMG_TECH_STEP1,
    import.meta.env.VITE_IMG_TECH_PRIMARY
  ),
  technologyStep2: firstEnv(
    import.meta.env.VITE_IMG_TECH_STEP2,
    import.meta.env.VITE_IMG_TECH_SECONDARY
  ),
  technologyStep3: firstEnv(import.meta.env.VITE_IMG_TECH_STEP3),
  technologyStep4: firstEnv(import.meta.env.VITE_IMG_TECH_STEP4),
  cultivosMicroverdes: import.meta.env.VITE_IMG_CULTIVOS_MICROVERDES,
  cultivosSalanova: import.meta.env.VITE_IMG_CULTIVOS_SALANOVA,
  cultivosFlores: import.meta.env.VITE_IMG_CULTIVOS_FLORES,
  forChefs: import.meta.env.VITE_IMG_FOR_CHEFS,
  manifesto: import.meta.env.VITE_IMG_MANIFESTO,
  manifestoTrack: import.meta.env.VITE_IMG_MANIFESTO_TRACK,
};

/** Bust de cache no browser após trocar ficheiros em /public/uploads (incrementar ao mudar o asset). */
const ASSET_BUST = "6";

function withBustForKeys(url: string, key: SiteImageKey) {
  if (key !== "manifesto" && key !== "manifestoTrack") return url;
  return appendImageCacheBust(url);
}

/** Aplica a qualquer `src` local de manifesto (incl. fallbacks onError). */
export function appendImageCacheBust(href: string) {
  const u = href.trim();
  if (!u) return u;
  if (new RegExp(`[?&]b=${ASSET_BUST}($|&)`).test(u)) return u;
  const join = u.includes("?") ? "&" : "?";
  return `${u}${join}b=${ASSET_BUST}`;
}

export function getSiteImage(key: SiteImageKey): string {
  const override = imageOverrides[key]?.trim();
  const raw = override && override.length > 0 ? override : fallbackImages[key];
  return withBustForKeys(raw, key);
}
