import { useEffect, useState } from "react";

/** Alinhado ao breakpoint Tailwind `lg` (min-width: 1024px): abaixo disso = sem trilhos desktop / mesmo critério do menu. */
const NARROW_MAX_PX = 1023;

function getLayoutWidth(): number {
  if (typeof window === "undefined") return NARROW_MAX_PX + 1;
  /** `visualViewport` reflete melhor iOS Safari / toolbars e alguns resize programáticos. */
  return window.visualViewport?.width ?? window.innerWidth;
}

/** Viewport estreito (mobile/tablet): parallax/transform em cadeia com overflow cortam texto/imagens no Safari/iOS. */
export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () => (typeof window !== "undefined" ? getLayoutWidth() <= NARROW_MAX_PX : false),
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_MAX_PX}px)`);
    const sync = () => setNarrow(getLayoutWidth() <= NARROW_MAX_PX);
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  return narrow;
}
