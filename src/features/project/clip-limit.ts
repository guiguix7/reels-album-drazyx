import { MAX_CLIP_SECONDS } from './project.defaults'
import type { ProjectConfig } from './project.types'

/** Limite real do trecho: 45 s no social; faixa inteira no music video. */
export function getMaxClipSeconds(
  config: Pick<ProjectConfig, 'productionMode'>,
  audioDuration: number | null,
): number {
  if (config.productionMode === 'full') return audioDuration ?? Number.POSITIVE_INFINITY
  return Math.min(MAX_CLIP_SECONDS, audioDuration ?? MAX_CLIP_SECONDS)
}

export function isFullVideo(config: Pick<ProjectConfig, 'productionMode'>): boolean {
  return config.productionMode === 'full'
}
