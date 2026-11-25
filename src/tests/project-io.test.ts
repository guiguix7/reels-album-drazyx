import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { parseProjectFile, serializeProject } from '../features/persistence/project-io'

describe('project file', () => {
  it('exporta e importa o projeto preservando a configuração', () => {
    const config = {
      ...DEFAULT_PROJECT,
      clipStart: 8,
      clipDuration: 15,
      platform: 'reels' as const,
      templateId: 't5' as const,
      visual: { ...DEFAULT_PROJECT.visual, motionProfile: 'pulse' as const, loopVisual: true },
    }
    const text = serializeProject('Campanha', config, new Date('2026-11-24T12:00:00Z'))
    const parsed = parseProjectFile(text)
    expect(parsed.name).toBe('Campanha')
    expect(parsed.config).toEqual(config)
  })

  it('preenche defaults em arquivos antigos sem os campos novos', () => {
    const legacy = {
      app: 'drazyx-visualizer-studio',
      name: 'Antigo',
      config: {
        aspectRatio: '9:16',
        quality: 'full',
        fps: 30,
        templateId: 'mirage',
        clipStart: 0,
        clipDuration: 30,
        type: DEFAULT_PROJECT.type,
        visual: { intensity: 0.5, particleCount: 0.5, bassForce: 0.5, glow: 0.5, grain: 0.3, cameraSpeed: 0.4, glitch: 'low' },
      },
    }
    const parsed = parseProjectFile(JSON.stringify(legacy))
    expect(parsed.config.platform).toBe(DEFAULT_PROJECT.platform)
    expect(parsed.config.productionMode).toBe('social')
    expect(parsed.config.cameraPreset).toBe('auto')
    expect(parsed.config.cameraIntensity).toBe(1)
    expect(parsed.config.visual.motionProfile).toBe(DEFAULT_PROJECT.visual.motionProfile)
    expect(parsed.config.visual.loopVisual).toBe(DEFAULT_PROJECT.visual.loopVisual)
    expect(parsed.config.palette.mode).toBe(DEFAULT_PROJECT.palette.mode)
    expect(parsed.config.storyboard.scenes.length).toBeGreaterThan(0)
  })

  it('rejeita JSON inválido, projeto incompleto e arquivo de outro app', () => {
    expect(() => parseProjectFile('não é json')).toThrow(/JSON válido/)
    expect(() => parseProjectFile('{"name":"x"}')).toThrow(/configuração ausente/)
    expect(() => parseProjectFile(JSON.stringify({ app: 'outro-app', config: DEFAULT_PROJECT }))).toThrow(/não foi exportado/)
    expect(() => parseProjectFile(JSON.stringify({ config: { aspectRatio: '9:16' } }))).toThrow(/incompleto/)
  })
})
