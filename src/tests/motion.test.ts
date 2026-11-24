import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import type { VisualSettings } from '../features/project/project.types'
import { MOTION_PROFILE_IDS, MOTION_PROFILES } from '../features/visualizer/motion/motion.profiles'
import {
  applyMotionProfile,
  applyVisualLoop,
  createRandom,
  hashSeed,
  loopBlend,
  seededNoise,
} from '../features/visualizer/motion/motion.utils'

const base = DEFAULT_PROJECT.visual

describe('motion profiles', () => {
  it('define os sete perfis do master prompt com ids únicos', () => {
    expect(MOTION_PROFILE_IDS).toHaveLength(7)
    expect(new Set(MOTION_PROFILE_IDS).size).toBe(7)
    for (const id of MOTION_PROFILE_IDS) {
      expect(MOTION_PROFILES[id].id).toBe(id)
      expect(MOTION_PROFILES[id].description.length).toBeGreaterThan(10)
    }
  })

  it('aplica o perfil mantendo todos os parâmetros em 0–1', () => {
    for (const id of MOTION_PROFILE_IDS) {
      for (const progress of [0, 0.5, 1]) {
        const result = applyMotionProfile(base, id, { progress, seed: 7, energy: 0.6, transient: 1 })
        for (const key of ['intensity', 'particleCount', 'bassForce', 'glow', 'cameraSpeed', 'grain'] as const) {
          expect(result[key]).toBeGreaterThanOrEqual(0)
          expect(result[key]).toBeLessThanOrEqual(1)
        }
        expect(result.motionProfile).toBe(id)
      }
    }
  })

  it('perfis diferentes produzem curvas diferentes', () => {
    const minimal = applyMotionProfile(base, 'minimal', { progress: 1, seed: 1, energy: 0, transient: 0 })
    const intense = applyMotionProfile(base, 'intense', { progress: 1, seed: 1, energy: 0, transient: 0 })
    expect(intense.bassForce).toBeGreaterThan(minimal.bassForce)
    expect(intense.cameraSpeed).toBeGreaterThan(minimal.cameraSpeed)
    expect(minimal.particleCount).toBeLessThan(intense.particleCount)
  })

  it('não muta a configuração recebida', () => {
    const snapshot: VisualSettings = { ...base }
    applyMotionProfile(base, 'fragment', { progress: 0.4, seed: 3, energy: 0.5, transient: 0.5 })
    expect(base).toEqual(snapshot)
  })
})

describe('determinismo', () => {
  it('mesma seed e mesmo tempo devolvem o mesmo frame', () => {
    const a = applyMotionProfile(base, 'organic', { progress: 0.42, seed: 1234, energy: 0.4, transient: 0.2 })
    const b = applyMotionProfile(base, 'organic', { progress: 0.42, seed: 1234, energy: 0.4, transient: 0.2 })
    expect(a).toEqual(b)
  })

  it('seeds diferentes mudam o ruído determinístico', () => {
    expect(hashSeed(['t3', 12])).toBe(hashSeed(['t3', 12]))
    expect(hashSeed(['t3', 12])).not.toBe(hashSeed(['t3', 13]))
    const a = seededNoise(10, 1.5)
    const b = seededNoise(11, 1.5)
    expect(a).not.toBeCloseTo(b, 4)
    const randomA = createRandom(9)
    const randomB = createRandom(9)
    expect([randomA(), randomA(), randomA()]).toEqual([randomB(), randomB(), randomB()])
  })
})

describe('loop visual', () => {
  it('só fecha nos últimos 8% do trecho', () => {
    expect(loopBlend(0, true)).toBe(0)
    expect(loopBlend(0.5, true)).toBe(0)
    expect(loopBlend(0.92, true)).toBe(0)
    expect(loopBlend(0.96, true)).toBeCloseTo(0.5, 5)
    expect(loopBlend(1, true)).toBe(1)
    expect(loopBlend(1, false)).toBe(0)
  })

  it('interpola os parâmetros de volta ao início do trecho', () => {
    const opening = { ...base, intensity: 0.2, glow: 0.3, cameraSpeed: 0.1, particleCount: 0.4, bassForce: 0.5 }
    const current = { ...base, intensity: 0.9, glow: 0.8, cameraSpeed: 0.7, particleCount: 0.9, bassForce: 1 }
    const half = applyVisualLoop(current, opening, 0.5)
    expect(half.intensity).toBeCloseTo(0.55, 5)
    expect(half.glow).toBeCloseTo(0.55, 5)
    expect(applyVisualLoop(current, opening, 0)).toEqual(current)
    expect(applyVisualLoop(current, opening, 1).intensity).toBeCloseTo(opening.intensity, 6)
  })
})
