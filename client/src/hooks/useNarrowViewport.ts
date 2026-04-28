import { useEffect, useState } from "react";

/** Viewport estreito (mobile/tablet): parallax/transform em cadeia com overflow cortam texto/imagens no Safari/iOS. */
const NARROW_MAX = "(max-width: 1023px)";

export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(NARROW_MAX).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MAX);
    const next = () => setNarrow(mq.matches);
    mq.addEventListener("change", next);
    return () => mq.removeEventListener("change", next);
  }, []);

  return narrow;
}
