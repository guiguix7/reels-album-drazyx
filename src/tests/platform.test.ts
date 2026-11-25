import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { applyPlatformToConfig, PLATFORM_PROFILES } from '../features/platform/platform.profiles'

describe('platform profiles', () => {
  it('aplica formato e CTA de cada plataforma', () => {
    for (const id of ['tiktok', 'reels', 'shorts'] as const) {
      const config = applyPlatformToConfig(DEFAULT_PROJECT, id)
      const profile = PLATFORM_PROFILES[id]
      expect(config.platform).toBe(id)
      expect(config.aspectRatio).toBe(profile.aspectRatio)
      expect(config.quality).toBe(profile.quality)
      expect(config.fps).toBe(profile.fps)
      expect(config.type.ctaText).toBe(profile.ctaText)
      expect(config.type.showCta).toBe(true)
    }
  })

  it('modo livre preserva o formato atual', () => {
    const wide = { ...DEFAULT_PROJECT, aspectRatio: '16:9' as const, quality: 'light' as const }
    const config = applyPlatformToConfig(wide, 'custom')
    expect(config.platform).toBe('custom')
    expect(config.aspectRatio).toBe('16:9')
    expect(config.quality).toBe('light')
  })

  it('não altera áudio, capa nem storyboard do projeto', () => {
    const config = applyPlatformToConfig(DEFAULT_PROJECT, 'shorts')
    expect(config.storyboard).toBe(DEFAULT_PROJECT.storyboard)
    expect(config.templateId).toBe(DEFAULT_PROJECT.templateId)
    expect(config.clipDuration).toBe(DEFAULT_PROJECT.clipDuration)
  })
})
