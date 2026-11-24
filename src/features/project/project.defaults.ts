import type { PaletteSettings, ProjectConfig, TemplateId } from './project.types'
import { createDefaultStoryboard } from '../storyboard/storyboard.utils'

/** Nome do produto centralizado — alterável aqui. */
export const APP_NAME = 'DRAZYX VISUALIZER STUDIO'

/** Limite de duração de divulgação (Reels/Shorts/TikTok). */
export const MAX_CLIP_SECONDS = 30
export const MIN_CLIP_SECONDS = 5

export const VISUAL_LIMITS = {
  intensity: { min: 0, max: 1, step: 0.01 },
  particleCount: { min: 0, max: 1, step: 0.01 },
  bassForce: { min: 0, max: 1, step: 0.01 },
  glow: { min: 0, max: 1, step: 0.01 },
  grain: { min: 0, max: 1, step: 0.01 },
  cameraSpeed: { min: 0, max: 1, step: 0.01 },
  typeScale: { min: 0.6, max: 1.4, step: 0.01 },
  tracking: { min: -2, max: 24, step: 1 },
  clipDuration: { min: MIN_CLIP_SECONDS, max: MAX_CLIP_SECONDS, step: 0.5 },
} as const

export const TEMPLATE_IDS: TemplateId[] = ['mirage', 'afterimage', 'void', 'spectrum', 't3', 't4', 't5']

/** Paleta padrão quando não há capa (identidade Drazyx). */
export const DEFAULT_PALETTE: PaletteSettings = {
  mode: 'auto',
  accent: '#b84dff',
  secondary: '#6b4a9f',
  glow: '#cf8aff',
}

/** Preset inicial: primeiro lançamento Drazyx. */
export const DEFAULT_PROJECT: ProjectConfig = {
  aspectRatio: '9:16',
  quality: 'full',
  fps: 30,
  templateId: 'mirage',
  palette: { ...DEFAULT_PALETTE },
  clipStart: 0,
  clipDuration: MAX_CLIP_SECONDS,
  visual: {
    intensity: 0.72,
    particleCount: 0.6,
    bassForce: 0.65,
    glow: 0.55,
    grain: 0.35,
    cameraSpeed: 0.45,
    glitch: 'low',
  },
  type: {
    artistName: 'DRAZYX',
    trackTitle: 'WAKE UP (SLOWED + REVERB)',
    albumTitle: 'MY MIRAGE (WAKE UP REMIXES)',
    ctaText: 'LISTEN NOW · LINK IN BIO',
    tagline: 'SOMEWHERE BETWEEN DREAMING AND WAKING',
    showArtist: true,
    showTrack: true,
    showAlbum: true,
    showCta: true,
    showTagline: true,
    scale: 1,
    tracking: 6,
  },
  storyboard: createDefaultStoryboard(),
}

/** Valores padrão de cena por template — usado no botão "restaurar preset". */
export const TEMPLATE_DEFAULT_VISUAL: Record<TemplateId, ProjectConfig['visual']> = {
  mirage: DEFAULT_PROJECT.visual,
  afterimage: { ...DEFAULT_PROJECT.visual, intensity: 0.8, particleCount: 0.35, cameraSpeed: 0.5, glitch: 'low' },
  void: { ...DEFAULT_PROJECT.visual, intensity: 0.5, particleCount: 0.15, glow: 0.3, grain: 0.5, cameraSpeed: 0.25, glitch: 'off' },
  spectrum: { ...DEFAULT_PROJECT.visual, intensity: 0.85, particleCount: 0.3, bassForce: 0.75, glow: 0.5, cameraSpeed: 0.3, glitch: 'low' },
  t3: { ...DEFAULT_PROJECT.visual, intensity: 0.7, particleCount: 0.4, glow: 0.4, cameraSpeed: 0.3, glitch: 'low' },
  t4: { ...DEFAULT_PROJECT.visual, intensity: 0.7, particleCount: 0.35, glow: 0.4, cameraSpeed: 0.3, glitch: 'low' },
  t5: { ...DEFAULT_PROJECT.visual, intensity: 0.6, particleCount: 0.3, glow: 0.35, cameraSpeed: 0.25, glitch: 'low' },
}
