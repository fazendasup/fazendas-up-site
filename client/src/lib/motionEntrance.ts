/**
 * Safari/WebKit: `translateY` / `translateX` nas entradas (whileInView) aumenta scrollWidth e
 * corta texto — parece que “CSS não atualiza” porque Framer injeta transform inline por cima.
 * Em viewport estreito usamos só fade (opacity).
 */
export function motionEnterFromBelow(yPx: number, narrow: boolean) {
  return narrow
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: yPx }, whileInView: { opacity: 1, y: 0 } };
}
