import { useSyncExternalStore } from "react";

const MIN_LG = "(min-width: 1024px)";

function matchesMinLg(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MIN_LG).matches;
}

function subscribeMinLg(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(MIN_LG);
  mq.addEventListener("change", cb);
  window.addEventListener("resize", cb);
  window.visualViewport?.addEventListener("resize", cb);
  return () => {
    mq.removeEventListener("change", cb);
    window.removeEventListener("resize", cb);
    window.visualViewport?.removeEventListener("resize", cb);
  };
}

/** Desktop editorial (lg+): trilhos, ScrollProgress, grelhas pesadas — fora do DOM em mobile. */
export function useMinLg(): boolean {
  return useSyncExternalStore(subscribeMinLg, matchesMinLg, () => false);
}
