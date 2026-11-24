import type { VisualSettings } from '../../project/project.types'
import { MOTION_PROFILES } from './motion.profiles'
import type { MotionInput, MotionProfileId } from './motion.types'

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

/** Hash determinístico (FNV-1a) para derivar seeds de strings/números. */
export function hashSeed(parts: Array<string | number>): number {
  let hash = 0x811c9dc5
  const text = parts.join('|')
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** PRNG determinístico (mulberry32): mesma seed → mesma sequência. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Ruído suave e determinístico no tempo: interpola dois valores do PRNG,
 * então a cena pode "respirar" sem tremulação (diferente de sortear por frame).
 */
export function seededNoise(seed: number, time: number): number {
  const floor = Math.floor(time)
  const frac = time - floor
  const random = createRandom(hashSeed([seed, floor]))
  const a = random()
  const b = random()
  const smooth = frac * frac * (3 - 2 * frac)
  return a + (b - a) * smooth
}

const lerp = (from: number, to: number, progress: number): number => from + (to - from) * progress

/**
 * Aplica o perfil de movimento sobre os parâmetros base. O resultado é sempre
 * limitado a 0–1 e não escreve no estado do projeto (função pura).
 */
export function applyMotionProfile(
  visual: VisualSettings,
  profileId: MotionProfileId,
  input: MotionInput,
): VisualSettings {
  const profile = MOTION_PROFILES[profileId] ?? MOTION_PROFILES.dream
  const progress = clamp01(input.progress)
  const noise = seededNoise(input.seed, progress * 4) - 0.5
  const jitter = 1 + noise * 2 * profile.jitter
  const kick = 1 + input.transient * profile.transientKick * 0.35

  const scale = (range: readonly [number, number]): number => lerp(range[0], range[1], progress)

  return {
    ...visual,
    motionProfile: profileId,
    intensity: clamp01(visual.intensity * scale(profile.intensity) * jitter * kick),
    particleCount: clamp01(visual.particleCount * scale(profile.particleCount)),
    bassForce: clamp01(visual.bassForce * scale(profile.bassForce)),
    glow: clamp01(visual.glow * scale(profile.glow) * jitter * kick),
    cameraSpeed: clamp01(visual.cameraSpeed * scale(profile.cameraSpeed)),
    // Energia global mantém a cena viva em trechos silenciosos (nunca zero).
    grain: clamp01(visual.grain + input.energy * 0.02),
  }
}

/**
 * Fator de fechamento do loop visual: 0 durante o trecho, sobe no último 8%
 * e chega a 1 no fim. Não promete loop de áudio, só continuidade de cena.
 */
export function loopBlend(progress: number, enabled: boolean): number {
  if (!enabled) return 0
  const p = clamp01(progress)
  if (p <= 0.92) return 0
  if (p >= 1) return 1
  return clamp01((p - 0.92) / 0.08)
}

/** Interpola os parâmetros visuais de volta ao estado inicial do trecho. */
export function applyVisualLoop(current: VisualSettings, opening: VisualSettings, mix: number): VisualSettings {
  if (mix <= 0) return current
  const t = clamp01(mix)
  return {
    ...current,
    intensity: lerp(current.intensity, opening.intensity, t),
    glow: lerp(current.glow, opening.glow, t),
    cameraSpeed: lerp(current.cameraSpeed, opening.cameraSpeed, t),
    particleCount: lerp(current.particleCount, opening.particleCount, t),
    bassForce: lerp(current.bassForce, opening.bassForce, t),
  }
}
