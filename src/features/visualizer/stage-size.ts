export interface StageSize {
  width: number
  height: number
}

/**
 * Ajusta a saída do Stage ao espaço disponível preservando a razão real do
 * canvas. O CSS sozinho não resolve quando a largura é limitada e a altura
 * continua em 100% (foi a causa do 16:9 esticado).
 */
export function fitStageSize(
  dims: StageSize,
  available: StageSize,
): StageSize {
  if (dims.width <= 0 || dims.height <= 0) return { width: 0, height: 0 }
  if (available.width <= 0 || available.height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(available.width / dims.width, available.height / dims.height)
  return {
    width: Math.max(1, Math.floor(dims.width * scale)),
    height: Math.max(1, Math.floor(dims.height * scale)),
  }
}

/** Verifica se a razão do retângulo corresponde à saída (tolerância de 0,5%). */
export function hasCorrectAspect(dims: StageSize, rendered: StageSize, tolerance = 0.005): boolean {
  if (dims.width <= 0 || dims.height <= 0 || rendered.width <= 0 || rendered.height <= 0) return false
  const expected = dims.width / dims.height
  const actual = rendered.width / rendered.height
  return Math.abs(expected - actual) / expected <= tolerance
}
