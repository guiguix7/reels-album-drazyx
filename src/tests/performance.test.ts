import { describe, expect, it } from 'vitest'
import { AdaptiveResolution, FrameBudgetMonitor, RENDER_PROFILES } from '../features/visualizer/performance'

describe('frame budget', () => {
  it('calcula média e fps ignorando deltas inválidos', () => {
    const monitor = new FrameBudgetMonitor(4)
    monitor.push(0.02)
    monitor.push(0.02)
    monitor.push(Number.NaN)
    monitor.push(-1)
    monitor.push(0)
    expect(monitor.averageMs).toBeCloseTo(20, 5)
    expect(monitor.fps).toBeCloseTo(50, 5)
    for (let i = 0; i < 4; i += 1) monitor.push(0.016)
    expect(monitor.filled).toBe(true)
    monitor.reset()
    expect(monitor.averageMs).toBe(0)
  })
})

describe('adaptive resolution', () => {
  it('reduz a escala quando o frame budget estoura e recupera com folga', () => {
    const adaptive = new AdaptiveResolution({ windowSize: 4, cooldownSeconds: 0, minScale: 0.55, step: 0.15 })
    expect(adaptive.scale).toBe(1)
    for (let i = 0; i < 4; i += 1) adaptive.push(0.05)
    expect(adaptive.scale).toBeCloseTo(0.85, 5)
    for (let i = 0; i < 4; i += 1) adaptive.push(0.05)
    expect(adaptive.scale).toBeCloseTo(0.7, 5)
    for (let i = 0; i < 4; i += 1) adaptive.push(0.01)
    expect(adaptive.scale).toBeCloseTo(0.85, 5)
  })

  it('não desce abaixo do mínimo nem passa do máximo', () => {
    const adaptive = new AdaptiveResolution({ windowSize: 4, cooldownSeconds: 0, minScale: 0.55, step: 0.4 })
    for (let i = 0; i < 40; i += 1) adaptive.push(0.08)
    expect(adaptive.scale).toBeCloseTo(0.55, 5)
    adaptive.setScale(0.1)
    expect(adaptive.scale).toBeCloseTo(0.55, 5)
    adaptive.setScale(3)
    expect(adaptive.scale).toBe(1)
  })

  it('perfil de export usa resolução cheia fixa', () => {
    expect(RENDER_PROFILES.export.maxScale).toBe(1)
    expect(RENDER_PROFILES.export.minScale).toBe(1)
    expect(RENDER_PROFILES.standard.minScale).toBeLessThan(1)
  })
})
