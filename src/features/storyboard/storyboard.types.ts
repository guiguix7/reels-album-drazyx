import type { TemplateId } from '../project/project.types'

/** Papel narrativo de uma cena no storyboard. */
export type SceneRole = 'hook' | 'reveal' | 'development' | 'peak' | 'payoff'

/** Transição na entrada da cena. */
export type SceneTransition = 'cut' | 'fade' | 'flash'

/** Perfil de movimento aplicado aos parâmetros visuais da cena. */
export type SceneMotion = 'slow' | 'pulse' | 'build'

/** Estratégias de hook dos primeiros segundos. */
export type HookType = 'emotional' | 'curiosity' | 'audio-first' | 'pattern-interrupt' | 'production-reveal'

/** Direção de cor da cena: paleta da capa ou violeta Drazyx. */
export type VisualStyleId = 'album' | 'violet'

export interface SceneKeyframe {
  /** Posição normalizada dentro da cena (0–1). */
  at: number
  /** Multiplicador de intensidade (0–1.5). */
  intensity: number
}

export interface StoryboardScene {
  id: string
  role: SceneRole
  start: number
  end: number
  layoutId: TemplateId
  visualStyleId: VisualStyleId
  transition: SceneTransition
  motion: SceneMotion
  text: string
  showText: boolean
  /** Multiplicador de reação ao áudio (0.3–1). */
  audioIntensity: number
  keyframes: SceneKeyframe[]
}

export interface HookSettings {
  type: HookType
  text: string
}

export interface StoryboardConfig {
  enabled: boolean
  source: 'preset' | 'auto' | 'manual'
  scenes: StoryboardScene[]
  hook: HookSettings
}
