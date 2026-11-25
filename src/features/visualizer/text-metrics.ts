import { VIEW_HEIGHT } from './visual.types'

/**
 * Largura máxima do texto em unidades de mundo. Em 16:9 a largura do palco é
 * muito maior que a altura; sem o limite, títulos e metadados crescem junto e
 * colidem com a capa. 60% da altura mantém a hierarquia das três proporções.
 */
export const MAX_TEXT_WORLD_WIDTH = VIEW_HEIGHT * 0.6

export function capTextWidth(worldWidth: number): number {
  if (!Number.isFinite(worldWidth) || worldWidth <= 0) return 0
  return Math.min(worldWidth, MAX_TEXT_WORLD_WIDTH)
}
