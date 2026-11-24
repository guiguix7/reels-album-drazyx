/** Contratos centrais do projeto — compartilhados entre UI, áudio, visual e gravação. */

import type { StoryboardConfig } from '../storyboard/storyboard.types'

export type AspectRatioId = '9:16' | '1:1' | '16:9'
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
