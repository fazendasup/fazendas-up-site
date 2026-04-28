import { useSyncExternalStore } from "react";

/** Alinhado ao breakpoint Tailwind `lg` (min-width: 1024px). */
const NARROW_MAX_PX = 1023;

/** Largura útil para layout; prioriza visualViewport e clientWidth (Safari/iOS). */
export function getLayoutWidthForNarrow(): number {
  if (typeof window === "undefined") return NARROW_MAX_PX + 1;
  const vv = window.visualViewport?.width;
  if (typeof vv === "number" && vv > 0 && Number.isFinite(vv)) return Math.floor(vv);
  const cw = document.documentElement?.clientWidth;
  if (typeof cw === "number" && cw > 0 && Number.isFinite(cw)) return Math.floor(cw);
  return Math.floor(window.innerWidth);
}

function isNarrowViewport(): boolean {
  return getLayoutWidthForNarrow() <= NARROW_MAX_PX;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(`(max-width: ${NARROW_MAX_PX}px)`);
  const fire = () => onStoreChange();
  mq.addEventListener("change", fire);
  window.addEventListener("resize", fire);
  window.visualViewport?.addEventListener("resize", fire);
  return () => {
    mq.removeEventListener("change", fire);
    window.removeEventListener("resize", fire);
    window.visualViewport?.removeEventListener("resize", fire);
  };
}

/**
 * Viewport estreito: parallax/transform em cadeia com overflow cortam texto/imagens no Safari/iOS.
 * `useSyncExternalStore` mantém leitura alinhada ao paint e evita “flicker” de estado.
 */
export function useNarrowViewport(): boolean {
  return useSyncExternalStore(subscribe, isNarrowViewport, () => false);
}
