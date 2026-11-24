/** Contratos do motion engine — perfis de movimento por cena/trecho. */

export type MotionProfileId =
  | 'dream'
  | 'pulse'
  | 'cinematic'
  | 'fragment'
  | 'organic'
  | 'intense'
  | 'minimal'

/** Faixa [início, fim] aplicada ao longo do progresso do trecho (0–1). */
export type MotionRange = readonly [number, number]

export interface MotionProfileDefinition {
  id: MotionProfileId
  label: string
  description: string
  /** Multiplicadores sobre os parâmetros do projeto. */
  intensity: MotionRange
  bassForce: MotionRange
  glow: MotionRange
  cameraSpeed: MotionRange
  particleCount: MotionRange
  /** Impacto de um transiente no brilho/intensidade (0–1). */
  transientKick: number
  /** Amplitude do ruído determinístico por seed (0–1). */
  jitter: number
  /** Perfis com fechamento suave são os mais indicados para loop visual. */
  loopSafe: boolean
}

export interface MotionInput {
  /** Progresso do trecho selecionado (0–1, clampado). */
  progress: number
  /** Semente determinística (trecho + layout). */
  seed: number
  /** Energia global do frame (0–1). */
  energy: number
  /** Envelope de transiente (0–1). */
  transient: number
}
