import type { AspectRatioId, OutputQuality, PlatformId, ProjectConfig } from '../project/project.types'

/** Perfis de plataforma: só configuração de export, sem alegar API ou upload. */
export interface PlatformProfile {
  id: Exclude<PlatformId, 'custom'>
  label: string
  aspectRatio: AspectRatioId
  quality: OutputQuality
  fps: 30 | 60
  maxSeconds: number
  ctaText: string
  note: string
}

export const PLATFORM_PROFILES: Record<Exclude<PlatformId, 'custom'>, PlatformProfile> = {
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    aspectRatio: '9:16',
    quality: 'full',
    fps: 30,
    maxSeconds: 30,
    ctaText: 'OUÇA COMPLETO · LINK NA BIO',
    note: '9:16 · 1080×1920 · até 30 s. Safe areas cobertas pela UI do app.',
  },
  reels: {
    id: 'reels',
    label: 'Reels',
    aspectRatio: '9:16',
    quality: 'full',
    fps: 30,
    maxSeconds: 30,
    ctaText: 'OUÇA NO SPOTIFY · LINK NA BIO',
    note: '9:16 · 1080×1920 · até 30 s. Evite texto nos 12% superiores e 16% inferiores.',
  },
  shorts: {
    id: 'shorts',
    label: 'Shorts',
    aspectRatio: '9:16',
    quality: 'full',
    fps: 30,
    maxSeconds: 30,
    ctaText: 'FAÇA PARTE · LINK NA BIO',
    note: '9:16 · 1080×1920 · até 30 s. Título curto melhora a leitura no feed.',
  },
}

export const PLATFORM_OPTIONS: Array<{ value: PlatformId; label: string }> = [
  { value: 'custom', label: 'Livre' },
  ...(Object.keys(PLATFORM_PROFILES) as Array<Exclude<PlatformId, 'custom'>>).map((id) => ({
    value: id as PlatformId,
    label: PLATFORM_PROFILES[id].label,
  })),
]

/** Aplica o perfil ao projeto sem tocar em áudio, capa ou storyboard. */
export function applyPlatformToConfig(config: ProjectConfig, id: PlatformId): ProjectConfig {
  if (id === 'custom') return { ...config, platform: 'custom' }
  const profile = PLATFORM_PROFILES[id]
  return {
    ...config,
    platform: id,
    aspectRatio: profile.aspectRatio,
    quality: profile.quality,
    fps: profile.fps,
    type: { ...config.type, ctaText: profile.ctaText, showCta: true },
  }
}
