/**
 * Safari/iOS: `translateY` / `translateX` em `whileInView` ou variants aumenta `scrollWidth`
 * e o texto/botões parecem “cortados” com `overflow-x: hidden`.
 * Só fade — sem deslocamento (translate infla scrollWidth no Safari).
 */
export function motionEnterFromBelow(_yPx?: number) {
  return { initial: { opacity: 0 }, whileInView: { opacity: 1 } };
}
