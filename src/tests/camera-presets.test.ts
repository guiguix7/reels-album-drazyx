import { describe, expect, it } from 'vitest'
import { cameraPose } from '../features/visualizer/camera-presets'

describe('camera presets', () => {
  it('auto preserva a câmera do template', () => {
    expect(cameraPose('auto', 0.5, 10, 1)).toBeNull()
  })

  it('dolly in aproxima ao longo do trecho e respeita a intensidade', () => {
    const start = cameraPose('dolly-in', 0, 0, 1)
    const end = cameraPose('dolly-in', 1, 0, 1)
    expect(start?.z).toBe(10)
    expect(end?.z).toBeLessThan(10)
    expect(cameraPose('dolly-in', 1, 0, 0.5)?.z).toBeGreaterThan(end?.z ?? 0)
  })

  it('pan e tilt são determinísticos e centralizados no meio', () => {
    expect(cameraPose('pan', 0.5, 0, 1)).toEqual({ x: 0, y: 0, z: 10 })
    expect(cameraPose('tilt', 0.5, 0, 1)).toEqual({ x: 0, y: 0, z: 10 })
  })

  it('orbit passa pelo centro nos extremos', () => {
    expect(cameraPose('orbit', 0, 0, 1)?.z).toBeCloseTo(8.8, 5)
    expect(cameraPose('orbit', 1, 0, 1)?.z).toBeCloseTo(8.8, 5)
  })
})
