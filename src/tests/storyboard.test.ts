import { describe, expect, it } from 'vitest'
import type { ClipAnalysis } from '../features/audio/offline-analysis'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import type { StoryboardScene } from '../features/storyboard/storyboard.types'
import {
  DEFAULT_HOOK,
  HOOK_PRESETS,
  buildAutoStoryboard,
  createStoryboardPreset,
  effectiveType,
  effectiveVisual,
  findSceneAt,
  insertScene,
  moveScene,
  removeScene,
  resizeScene,
} from '../features/storyboard/storyboard.utils'

function expectCoverage(scenes: StoryboardScene[], total: number): void {
  expect(scenes.length).toBeGreaterThan(0)
  expect(scenes[0].start).toBe(0)
  for (let index = 1; index < scenes.length; index += 1) {
    expect(scenes[index].start).toBeCloseTo(scenes[index - 1].end, 3)
    expect(scenes[index].end).toBeGreaterThan(scenes[index].start)
  }
  expect(scenes[scenes.length - 1].end).toBeCloseTo(total, 3)
}

describe('storyboard presets', () => {
  it('cobre exatamente 15 s, 30 s e 45 s com papéis narrativos', () => {
    for (const kind of [15, 30, 45] as const) {
      const scenes = createStoryboardPreset(kind, DEFAULT_HOOK, kind)
      expectCoverage(scenes, kind)
      expect(scenes[0].role).toBe('hook')
      expect(scenes.some((scene) => scene.role === 'peak')).toBe(true)
      expect(scenes.some((scene) => scene.role === 'payoff')).toBe(true)
      expect(scenes[0].text).toBe(DEFAULT_HOOK.text)
      expect(scenes[0].showText).toBe(true)
    }
  })

  it('estica o preset para a duração real do trecho', () => {
    const scenes = createStoryboardPreset(30, DEFAULT_HOOK, 12)
    expectCoverage(scenes, 12)
    expect(scenes[0].end).toBeLessThan(3)
  })

  it('hook audio-first não mostra frase e curiosity usa VOID', () => {
    const audioFirst = createStoryboardPreset(15, { type: 'audio-first', text: '' }, 15)
    expect(audioFirst[0].showText).toBe(false)
    expect(audioFirst[0].layoutId).toBe('mirage')

    const curiosity = createStoryboardPreset(15, { type: 'curiosity', text: HOOK_PRESETS.curiosity.text }, 15)
    expect(curiosity[0].layoutId).toBe('void')
    expect(curiosity[0].text).toBe(HOOK_PRESETS.curiosity.text)
  })
})

describe('storyboard editing', () => {
  it('redimensionar uma cena mantém cobertura e piso de 0,5 s', () => {
    const scenes = createStoryboardPreset(30, DEFAULT_HOOK, 30)
    const resized = resizeScene(scenes, scenes[0].id, 5, 30)
    expectCoverage(resized, 30)
    expect(resized[0].end).toBeCloseTo(5, 3)
    for (const scene of resized) expect(scene.end - scene.start).toBeGreaterThanOrEqual(0.49)
  })

  it('adicionar, remover e mover cenas recalcula a timeline', () => {
    const scenes = createStoryboardPreset(15, DEFAULT_HOOK, 15)
    const extra: StoryboardScene = {
      ...scenes[0],
      id: 'extra',
      role: 'development',
      text: '',
      showText: false,
      start: 0,
      end: 2,
    }
    const inserted = insertScene(scenes, 2, extra, 15)
    expectCoverage(inserted, 15)
    expect(inserted).toHaveLength(scenes.length + 1)
    expect(inserted[2].id).toBe('extra')

    const removed = removeScene(inserted, 'extra', 15)
    expectCoverage(removed, 15)
    expect(removed).toHaveLength(scenes.length)

    const moved = moveScene(scenes, scenes[1].id, -1, 15)
    expectCoverage(moved, 15)
    expect(moved[0].id).toBe(scenes[1].id)
    expect(moved[1].id).toBe(scenes[0].id)
  })

  it('findSceneAt cobre início, fim e fora da faixa', () => {
    const scenes = createStoryboardPreset(15, DEFAULT_HOOK, 15)
    expect(findSceneAt(scenes, -1)?.id).toBe(scenes[0].id)
    expect(findSceneAt(scenes, 0)?.id).toBe(scenes[0].id)
    expect(findSceneAt(scenes, 14.99)?.id).toBe(scenes[scenes.length - 1].id)
    expect(findSceneAt(scenes, 15)?.id).toBe(scenes[scenes.length - 1].id)
  })
})

describe('storyboard rendering helpers', () => {
  it('effectiveVisual aplica perfil/intensidade e mantém valores em 0–1', () => {
    const scene = createStoryboardPreset(15, DEFAULT_HOOK, 15)[2]
    const visual = effectiveVisual(DEFAULT_PROJECT.visual, scene, 0.4, scene.end - scene.start)
    for (const key of ['intensity', 'particleCount', 'bassForce', 'glow', 'cameraSpeed'] as const) {
      expect(visual[key]).toBeGreaterThanOrEqual(0)
      expect(visual[key]).toBeLessThanOrEqual(1)
    }
  })

  it('effectiveType respeita mostrar/ocultar frase da cena', () => {
    const scenes = createStoryboardPreset(15, DEFAULT_HOOK, 15)
    const hidden = effectiveType(DEFAULT_PROJECT.type, { ...scenes[1], showText: false })
    expect(hidden.showTagline).toBe(false)

    const visible = effectiveType(DEFAULT_PROJECT.type, { ...scenes[1], showText: true, text: 'MEMORY' })
    expect(visible.showTagline).toBe(true)
    expect(visible.tagline).toBe('MEMORY')
  })
})

describe('auto storyboard', () => {
  it('usa onset real, pico e fechamento cobrindo o trecho', () => {
    const analysis: ClipAnalysis = {
      duration: 20,
      energy: [0, 0.2, 0.8, 1, 0.6],
      events: [{ time: 15, strength: 1 }],
      peakTime: 15,
      onsetTime: 2,
    }
    const scenes = buildAutoStoryboard(analysis, 20, DEFAULT_HOOK)
    expectCoverage(scenes, 20)
    expect(scenes[0].role).toBe('hook')
    expect(scenes[0].text).toBe(DEFAULT_HOOK.text)
    expect(scenes[0].end).toBeGreaterThan(1)
    expect(scenes.some((scene) => scene.role === 'peak')).toBe(true)
    expect(scenes[scenes.length - 1].role).toBe('payoff')
    expect(scenes[scenes.length - 1].end).toBeCloseTo(20, 3)
  })
})
