/** Contratos centrais do projeto — compartilhados entre UI, áudio, visual e gravação. */

import type { StoryboardConfig } from '../storyboard/storyboard.types'
import type { MotionProfileId } from '../visualizer/motion/motion.types'

export type AspectRatioId = '9:16' | '1:1' | '16:9'
export type ProductionMode = 'social' | 'full'
export type CameraPreset = 'auto' | 'static' | 'dolly-in' | 'dolly-out' | 'pan' | 'tilt' | 'orbit' | 'drift'
export type PlatformId = 'custom' | 'tiktok' | 'reels' | 'shorts'
export type OutputQuality = 'full' | 'light'
export type GlitchLevel = 'off' | 'low' | 'medium'

/**
 * Layouts T1–T8 são composições espaciais distintas; MIRAGE/AFTERIMAGE/VOID/SPECTRUM
 * permanecem como presets/estilos artísticos selecionáveis.
 */
export type TemplateId =
  | 'mirage'
  | 'afterimage'
  | 'void'
  | 'spectrum'
  | 't1'
  | 't2'
  | 't3'
  | 't4'
  | 't5'
  | 't6'
  | 't7'
  | 't8'

export interface VisualSettings {
  /** Intensidade geral da reação audio (0–1). */
  intensity: number
  /** Quantidade de partículas (escala 0–1 → contagem por template). */
  particleCount: number
  /** Força da reação aos graves (0–1). */
  bassForce: number
  /** Intensidade de glow (0–1). */
  glow: number
  /** Grain/noise (0–1). */
  grain: number
  /** Velocidade de câmera (0–1). */
  cameraSpeed: number
  glitch: GlitchLevel
  /** Perfil de movimento que curva a reação ao áudio ao longo do trecho. */
  motionProfile: MotionProfileId
  /** Fecha a composição no início do trecho (continuidade visual, não loop de áudio). */
  loopVisual: boolean
}

/** Cores aplicadas ao Stage. 'auto' acompanha a capa; 'manual' é escolha do usuário. */
export type PaletteMode = 'auto' | 'manual'

export interface CoverPalette {
  /** Cor de destaque vibrante (barras, anéis, badge). */
  accent: string
  /** Cor secundária (fundos, elementos de apoio). */
  secondary: string
  /** Cor de brilho/texto de acento. */
  glow: string
}

export interface PaletteSettings extends CoverPalette {
  mode: PaletteMode
}

export interface TypeSettings {
  artistName: string
  trackTitle: string
  albumTitle: string
  ctaText: string
  /** Frase de abertura (storyboard 0–3 s). */
  tagline: string
  showArtist: boolean
  showTrack: boolean
  showAlbum: boolean
  showCta: boolean
  showTagline: boolean
  /** Escala tipográfica global (0.6–1.4). */
  scale: number
  /** Tracking em px @1080 de largura (−2 a 24). */
  tracking: number
}

export type CompositionElementType = 'text' | 'artwork' | 'shape' | 'waveform' | 'progress' | 'player'
export type CompositionFont = 'title' | 'ui'
export type CompositionMotion = 'none' | 'float' | 'pulse'

/**
 * Camada editável desenhada no Stage por cima do template. Coordenadas em
 * porcentagem do palco; width/height em porcentagem da largura/altura.
 */
export interface CompositionElement {
  id: string
  type: CompositionElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  color: string
  text: string
  font: CompositionFont
  /** Tamanho do texto como fração da altura do palco (1–40). */
  fontSize: number
  weight: number
  align: 'left' | 'center' | 'right'
  tracking: number
  motion: CompositionMotion
  /** Intensidade do movimento (0–100). */
  motionAmount: number
  reactive: boolean
}

export interface AudioMeta {
  fileName: string
  duration: number
  objectUrl: string
}

export interface CoverMeta {
  fileName: string
  objectUrl: string
}

export interface ProjectConfig {
  /** Social clip (limite de 45 s) ou music video com a faixa inteira. */
  productionMode: ProductionMode
  /** Câmera global sobre a composição; `auto` mantém a câmera do template. */
  cameraPreset?: CameraPreset
  cameraIntensity?: number
  /** Perfil de plataforma aplicado ao export (configuração, sem integração externa). */
  platform: PlatformId
  aspectRatio: AspectRatioId
  quality: OutputQuality
  fps: number
  templateId: TemplateId
  palette: PaletteSettings
  clipStart: number
  /** Duração alvo do trecho em segundos (padrão 30, permitido menor para teste). */
  clipDuration: number
  visual: VisualSettings
  type: TypeSettings
  storyboard: StoryboardConfig
  /** Elementos editáveis da composição; vazio preserva o template puro. */
  elements: CompositionElement[]
}

/** Dimensões de saída por proporção/qualidade. */
export function getOutputDimensions(aspect: AspectRatioId, quality: OutputQuality): { width: number; height: number } {
  const shortSide = quality === 'full' ? 1080 : 720
  switch (aspect) {
    case '9:16':
      return { width: shortSide, height: Math.round((shortSide * 16) / 9) }
    case '1:1':
      return { width: shortSide, height: shortSide }
    case '16:9':
      return { width: Math.round((shortSide * 16) / 9), height: shortSide }
  }
}

export function getClipEnd(config: Pick<ProjectConfig, 'clipStart' | 'clipDuration'>, audioDuration: number | null): number {
  const duration = audioDuration ?? Infinity
  const wanted = config.clipStart + config.clipDuration
  if (!Number.isFinite(duration)) return wanted
  return Math.min(wanted, duration)
}

export function getEffectiveClipSeconds(config: ProjectConfig, audioDuration: number | null): number {
  const end = getClipEnd(config, audioDuration)
  return Math.max(0, end - config.clipStart)
}

/**
 * Contrato único para o trecho: store, UI, storyboard e recorder não podem
 * discordar sobre o que é um range possível. O mínimo de gravação é 5 s, mas
 * a UI ainda precisa representar áudios menores sem criar um slider inválido.
 */
export function getClipReadiness(
  config: Pick<ProjectConfig, 'clipStart' | 'clipDuration'>,
  audioDuration: number | null,
  minimumSeconds = 5,
): { recordable: boolean; effective: number; maxDuration: number; reason: string | null } {
  const effective = getEffectiveClipSeconds(config as ProjectConfig, audioDuration)
  const maxDuration = audioDuration == null
    ? Infinity
    : Math.max(0, audioDuration - config.clipStart)
  if (audioDuration == null || audioDuration <= 0) {
    return { recordable: false, effective, maxDuration, reason: 'Carregue um áudio para habilitar a gravação.' }
  }
  if (effective < minimumSeconds) {
    return {
      recordable: false,
      effective,
      maxDuration,
      reason: `Este áudio permite apenas ${effective.toFixed(1)}s de trecho; o mínimo para gravar é ${minimumSeconds}s.`,
    }
  }
  return { recordable: true, effective, maxDuration, reason: null }
}
