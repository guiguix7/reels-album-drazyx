import { describe, expect, it } from 'vitest'
import { applyBrandPreset } from '../features/presets/brand-presets'
import type { BrandPreset } from '../features/presets/brand-presets'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'

const preset: BrandPreset = {
  id: 'brand-1',
  name: 'Marca',
  createdAt: '2026-11-25T00:00:00.000Z',
  palette: { mode: 'manual', accent: '#00ff00', secondary: '#001100', glow: '#00ff00' },
  visual: DEFAULT_PROJECT.visual,
  type: {
    showArtist: true,
    showTrack: false,
    showAlbum: false,
    showCta: true,
    showTagline: false,
    ctaText: 'OUÇA AGORA',
    tagline: '',
    scale: 1.2,
    tracking: 4,
  },
  templateId: 't4',
  aspectRatio: '1:1',
  cameraPreset: 'orbit',
  cameraIntensity: 1.4,
  elements: [],
}

describe('brand presets', () => {
  it('aplica marca sem trocar os dados da faixa atual', () => {
    const current = {
      ...structuredClone(DEFAULT_PROJECT),
      type: { ...DEFAULT_PROJECT.type, artistName: 'DRAZYX', trackTitle: 'Wake Up' },
    }
    const next = applyBrandPreset(current, preset)
    expect(next.palette.accent).toBe('#00ff00')
    expect(next.templateId).toBe('t4')
    expect(next.aspectRatio).toBe('1:1')
    expect(next.cameraPreset).toBe('orbit')
    expect(next.type.artistName).toBe('DRAZYX')
    expect(next.type.trackTitle).toBe('Wake Up')
    expect(next.type.ctaText).toBe('OUÇA AGORA')
  })
})
