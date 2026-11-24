import type { PlatformId, TemplateId } from '../project/project.types'
import type { MotionProfileId } from '../visualizer/motion/motion.types'
import type { HookType } from '../storyboard/storyboard.types'

/** Métricas informadas manualmente ou por CSV — nunca coletadas automaticamente. */
export interface RetentionMetric {
  id: string
  createdAt: string
  /** Nome da variante/peça comparada. */
  label: string
  platform: PlatformId
  hook: HookType
  layoutId: TemplateId
  motionProfile: MotionProfileId
  views: number
  /** Views que passaram dos 3 segundos. */
  views3s: number
  /** Tempo médio assistido em segundos. */
  avgWatchSeconds: number
  saves: number
  shares: number
  clicks: number
  notes: string
}

export interface RetentionRates {
  holdRate: number | null
  saveRate: number | null
  shareRate: number | null
  clickRate: number | null
  /** Média ponderada por views; null sem views. */
  avgWatchSeconds: number | null
}

export interface RetentionSummary extends RetentionRates {
  variants: number
  views: number
  saves: number
  shares: number
  clicks: number
}

export interface ParsedMetricRow {
  label: string
  views: number
  views3s: number
  avgWatchSeconds: number
  saves: number
  shares: number
  clicks: number
  notes: string
}
