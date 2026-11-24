import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { buildExportManifest } from '../features/persistence/manifest.types'

describe('export manifest', () => {
  it('registra o contexto real do export', () => {
    const manifest = buildExportManifest({
      config: {
        ...DEFAULT_PROJECT,
        platform: 'tiktok',
        templateId: 't5',
        visual: { ...DEFAULT_PROJECT.visual, motionProfile: 'pulse' },
        storyboard: {
          ...DEFAULT_PROJECT.storyboard,
          enabled: true,
          scenes: DEFAULT_PROJECT.storyboard.scenes.map((scene, index) => ({
            ...scene,
            layoutId: index === 0 ? 'void' : 't5',
          })),
        },
      },
      fileName: 'Drazyx_Wake-Up_30s_Visualizer.webm',
      mimeType: 'video/webm',
      sizeBytes: 2048,
      width: 1080,
      height: 1920,
      durationSeconds: 29.9,
      recordedAt: new Date('2026-11-24T12:00:00Z'),
    })
    expect(manifest.platform).toBe('tiktok')
    expect(manifest.layoutId).toBe('t5')
    expect(manifest.layoutSequence).toEqual(Array.from(new Set(manifest.layoutSequence)))
    expect(manifest.layoutSequence.length).toBeGreaterThan(1)
    expect(manifest.motionProfile).toBe('pulse')
    expect(manifest.hook).toBe(DEFAULT_PROJECT.storyboard.hook.type)
    expect(manifest.recordedAt).toBe('2026-11-24T12:00:00.000Z')
    expect(manifest.id.startsWith('export-')).toBe(true)
  })

  it('usa o layout único quando o storyboard está desligado', () => {
    const manifest = buildExportManifest({
      config: { ...DEFAULT_PROJECT, storyboard: { ...DEFAULT_PROJECT.storyboard, enabled: false } },
      fileName: 'x.webm',
      mimeType: 'video/webm',
      sizeBytes: 1,
      width: 720,
      height: 1280,
      durationSeconds: 5,
    })
    expect(manifest.layoutSequence).toEqual([DEFAULT_PROJECT.templateId])
  })
})
