/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_ENDPOINT?: string;
  readonly VITE_ANALYTICS_WEBSITE_ID?: string;
  readonly VITE_FRONTEND_FORGE_API_KEY?: string;
  readonly VITE_FRONTEND_FORGE_API_URL?: string;
  readonly VITE_IMG_HERO?: string;
  readonly VITE_IMG_TECH_STEP1?: string;
  readonly VITE_IMG_TECH_STEP2?: string;
  readonly VITE_IMG_TECH_STEP3?: string;
  readonly VITE_IMG_TECH_STEP4?: string;
  /** Legado: equivale a STEP1 / STEP2 se estes estiverem vazios */
  readonly VITE_IMG_TECH_PRIMARY?: string;
  readonly VITE_IMG_TECH_SECONDARY?: string;
  readonly VITE_IMG_CULTIVOS_MICROVERDES?: string;
  readonly VITE_IMG_CULTIVOS_SALANOVA?: string;
  readonly VITE_IMG_CULTIVOS_FLORES?: string;
  readonly VITE_IMG_FOR_CHEFS?: string;
  readonly VITE_IMG_MANIFESTO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
