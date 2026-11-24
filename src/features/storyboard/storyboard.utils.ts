import type { ClipAnalysis } from '../audio/offline-analysis'
import type { TemplateId, TypeSettings, VisualSettings } from '../project/project.types'
import type {
  HookSettings,
  HookType,
  SceneKeyframe,
  SceneMotion,
  SceneRole,
  SceneTransition,
  StoryboardConfig,
  StoryboardScene,
} from './storyboard.types'

export interface HookPreset {
  label: string
  text: string
  layoutId: TemplateId
  transition: SceneTransition
  motion: SceneMotion
  intensity: number
}

export const HOOK_PRESETS: Record<HookType, HookPreset> = {
  emotional: {
    label: 'Emocional',
    text: 'SOMEWHERE BETWEEN DREAMING AND WAKING',
    layoutId: 'void',
    transition: 'fade',
    motion: 'slow',
    intensity: 0.8,
  },
  curiosity: {
    label: 'Curiosidade',
    text: 'WHAT DOES THIS MELODY REMIND YOU OF?',
    layoutId: 'void',
    transition: 'fade',
    motion: 'slow',
    intensity: 0.85,
  },
  'audio-first': {
    label: 'Áudio primeiro',
    text: '',
    layoutId: 'mirage',
    transition: 'fade',
    motion: 'build',
    intensity: 0.9,
  },
  'pattern-interrupt': {
    label: 'Interrupção de padrão',
    text: 'WAIT FOR IT.',
    layoutId: 't3',
    transition: 'flash',
    motion: 'pulse',
    intensity: 0.95,
  },
  'production-reveal': {
    label: 'Revelação de produção',
    text: 'MADE IN THE QUIET HOURS.',
    layoutId: 't4',
    transition: 'fade',
    motion: 'slow',
    intensity: 0.85,
  },
}

export const DEFAULT_HOOK: HookSettings = { type: 'emotional', text: HOOK_PRESETS.emotional.text }

export const HOOK_OPTIONS = (Object.keys(HOOK_PRESETS) as HookType[]).map((value) => ({
  value,
  label: HOOK_PRESETS[value].label,
}))

export const TRANSITION_OPTIONS: Array<{ value: SceneTransition; label: string }> = [
  { value: 'cut', label: 'Corte' },
  { value: 'fade', label: 'Fade' },
  { value: 'flash', label: 'Flash' },
]

export const MOTION_OPTIONS: Array<{ value: SceneMotion; label: string }> = [
  { value: 'slow', label: 'Lento' },
  { value: 'pulse', label: 'Pulso' },
  { value: 'build', label: 'Construção' },
]

export const ROLE_LABELS: Record<SceneRole, string> = {
  hook: 'Hook',
  reveal: 'Revelação',
  development: 'Desenvolvimento',
  peak: 'Pico',
  payoff: 'Fechamento',
}

interface SceneSpec {
  role: SceneRole
  layoutId: TemplateId
  transition: SceneTransition
  motion: SceneMotion
  text: string
  showText: boolean
  seconds: number
  intensity?: number
}

interface SceneBlueprint {
  role: SceneRole
  layoutId: TemplateId
  transition: SceneTransition
  motion: SceneMotion
  seconds: number
}

const PRESET_BLUEPRINTS: Record<15 | 30, SceneBlueprint[]> = {
  15: [
    { role: 'hook', layoutId: 'void', transition: 'fade', motion: 'slow', seconds: 2 },
    { role: 'reveal', layoutId: 'mirage', transition: 'fade', motion: 'slow', seconds: 3 },
    { role: 'development', layoutId: 'spectrum', transition: 'cut', motion: 'pulse', seconds: 5 },
    { role: 'peak', layoutId: 't3', transition: 'flash', motion: 'pulse', seconds: 3 },
    { role: 'payoff', layoutId: 't5', transition: 'fade', motion: 'slow', seconds: 2 },
  ],
  30: [
    { role: 'hook', layoutId: 'void', transition: 'fade', motion: 'slow', seconds: 3 },
    { role: 'reveal', layoutId: 'mirage', transition: 'fade', motion: 'slow', seconds: 5 },
    { role: 'development', layoutId: 'spectrum', transition: 'cut', motion: 'pulse', seconds: 8 },
    { role: 'development', layoutId: 'afterimage', transition: 'cut', motion: 'slow', seconds: 7 },
    { role: 'peak', layoutId: 't3', transition: 'flash', motion: 'pulse', seconds: 4 },
    { role: 'payoff', layoutId: 't5', transition: 'fade', motion: 'slow', seconds: 3 },
  ],
}

let sceneSeq = 0

function nextSceneId(): string {
  sceneSeq += 1
  return `scene-${Date.now().toString(36)}-${sceneSeq}`
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)
const round3 = (value: number): number => Math.round(value * 1000) / 1000

/** Envelope de intensidade ao longo da cena (0–1 no tempo, multiplicador na saída). */
export function motionKeyframes(motion: SceneMotion): SceneKeyframe[] {
  if (motion === 'pulse') {
    return [
      { at: 0, intensity: 0.7 },
      { at: 0.2, intensity: 1 },
      { at: 0.35, intensity: 0.75 },
      { at: 0.5, intensity: 1 },
      { at: 0.65, intensity: 0.75 },
      { at: 0.8, intensity: 1 },
      { at: 1, intensity: 0.7 },
    ]
  }
  if (motion === 'build') {
    return [
      { at: 0, intensity: 0.85 },
      { at: 1, intensity: 1 },
    ]
  }
  return [
    { at: 0, intensity: 0.9 },
    { at: 1, intensity: 0.9 },
  ]
}

function keyframeEnvelope(keyframes: SceneKeyframe[], progress: number): number {
  if (!keyframes.length) return 1
  if (progress <= keyframes[0].at) return keyframes[0].intensity
  for (let i = 1; i < keyframes.length; i += 1) {
    const prev = keyframes[i - 1]
    const next = keyframes[i]
    if (progress <= next.at) {
      const span = Math.max(0.0001, next.at - prev.at)
      const mix = (progress - prev.at) / span
      return prev.intensity + (next.intensity - prev.intensity) * mix
    }
  }
  return keyframes[keyframes.length - 1].intensity
}

const MOTION_PROFILES: Record<SceneMotion, Record<'intensity' | 'bass' | 'glow' | 'camera' | 'particles', [number, number]>> = {
  slow: {
    intensity: [0.9, 0.9],
    bass: [0.8, 0.8],
    glow: [0.9, 0.9],
    camera: [0.55, 0.55],
    particles: [0.9, 0.9],
  },
  pulse: {
    intensity: [1.1, 1.1],
    bass: [1.35, 1.35],
    glow: [1.1, 1.1],
    camera: [0.8, 0.8],
    particles: [1, 1],
  },
  build: {
    intensity: [0.8, 1.3],
    bass: [0.9, 1.3],
    glow: [0.9, 1.2],
    camera: [0.6, 1.3],
    particles: [0.8, 1.2],
  },
}

function scaleRange(range: [number, number], progress: number): number {
  return range[0] + (range[1] - range[0]) * progress
}

/** Aplica perfil de movimento, intensidade da cena e keyframes sobre a config base. */
export function effectiveVisual(
  visual: VisualSettings,
  scene: StoryboardScene,
  sceneTime: number,
  sceneDuration: number,
): VisualSettings {
  const progress = clamp(sceneDuration > 0 ? sceneTime / sceneDuration : 0, 0, 1)
  const profile = MOTION_PROFILES[scene.motion]
  const envelope = keyframeEnvelope(scene.keyframes, progress) * clamp(scene.audioIntensity, 0.1, 1.5)
  return {
    ...visual,
    intensity: clamp(visual.intensity * scaleRange(profile.intensity, progress) * envelope, 0, 1),
    particleCount: clamp(visual.particleCount * scaleRange(profile.particles, progress) * envelope, 0, 1),
    bassForce: clamp(visual.bassForce * scaleRange(profile.bass, progress) * envelope, 0, 1),
    glow: clamp(visual.glow * scaleRange(profile.glow, progress) * envelope, 0, 1),
    cameraSpeed: clamp(visual.cameraSpeed * scaleRange(profile.camera, progress) * envelope, 0, 1),
  }
}

/** Texto da cena entra como tagline; sem texto da cena, usa a frase global do projeto. */
export function effectiveType(type: TypeSettings, scene: StoryboardScene): TypeSettings {
  if (!scene.showText) return type.showTagline ? { ...type, showTagline: false } : type
  const text = scene.text.trim() || type.tagline
  return { ...type, tagline: text, showTagline: text.length > 0 }
}

function materialize(specs: SceneSpec[], total: number): StoryboardScene[] {
  const safeTotal = Math.max(1, total)
  let cursor = 0
  const scenes = specs
    .filter((spec) => spec.seconds > 0.3)
    .map((spec) => {
      const start = round3(cursor)
      cursor += spec.seconds
      return {
        id: nextSceneId(),
        role: spec.role,
        start,
        end: round3(cursor),
        layoutId: spec.layoutId,
        visualStyleId: 'album' as const,
        transition: spec.transition,
        motion: spec.motion,
        text: spec.text,
        showText: spec.showText,
        audioIntensity: spec.intensity ?? 1,
        keyframes: motionKeyframes(spec.motion),
      }
    })
  return scaleScenesToDuration(scenes, safeTotal)
}

/** Preset narrativo de 15 s ou 30 s, esticado/encolhido para a duração real do trecho. */
export function createStoryboardPreset(
  kind: 15 | 30,
  hook: HookSettings,
  duration: number = kind,
): StoryboardScene[] {
  const preset = HOOK_PRESETS[hook.type]
  const specs: SceneSpec[] = PRESET_BLUEPRINTS[kind].map((blueprint, index) => {
    if (index > 0) return { ...blueprint, text: '', showText: false }
    return {
      ...blueprint,
      layoutId: preset.layoutId,
      transition: preset.transition,
      motion: preset.motion,
      text: hook.text,
      showText: hook.text.trim().length > 0,
      intensity: preset.intensity,
    }
  })
  return materialize(specs, duration)
}

export function createDefaultStoryboard(): StoryboardConfig {
  return {
    enabled: false,
    source: 'preset',
    scenes: createStoryboardPreset(30, DEFAULT_HOOK, 30),
    hook: { ...DEFAULT_HOOK },
  }
}

/** Primeira cena (hook) acompanha o tipo/frase escolhidos. */
export function applyHookToScenes(scenes: StoryboardScene[], hook: HookSettings): StoryboardScene[] {
  if (!scenes.length) return scenes
  const preset = HOOK_PRESETS[hook.type]
  return scenes.map((scene, index) => {
    if (index > 0) return scene
    return {
      ...scene,
      role: 'hook',
      layoutId: preset.layoutId,
      transition: preset.transition,
      motion: preset.motion,
      text: hook.text,
      showText: hook.text.trim().length > 0,
      keyframes: motionKeyframes(preset.motion),
      audioIntensity: preset.intensity,
    }
  })
}

export function findSceneAt(scenes: StoryboardScene[], time: number): StoryboardScene | null {
  if (!scenes.length) return null
  if (time < scenes[0].start) return scenes[0]
  for (const scene of scenes) {
    if (time >= scene.start && time < scene.end) return scene
  }
  return scenes[scenes.length - 1]
}

function reflow(scenes: StoryboardScene[], durations: number[], total: number): StoryboardScene[] {
  let cursor = 0
  return scenes.map((scene, index) => {
    const start = round3(cursor)
    cursor += durations[index]
    const end = index === scenes.length - 1 ? round3(total) : round3(cursor)
    return { ...scene, start, end: Math.max(start + 0.01, end) }
  })
}

/** Re-escala a sequência inteira para preencher exatamente a duração do trecho. */
export function scaleScenesToDuration(scenes: StoryboardScene[], total: number): StoryboardScene[] {
  if (!scenes.length) return scenes
  const safeTotal = Math.max(0.5, total)
  const current = scenes[scenes.length - 1].end
  const durations = scenes.map((scene) =>
    current > 0 ? Math.max(0.01, scene.end - scene.start) * (safeTotal / current) : safeTotal / scenes.length,
  )
  return reflow(scenes, durations, safeTotal)
}

/** Distribui um total entre pesos, garantindo um piso mínimo por item. */
function distribute(total: number, weights: number[], min: number): number[] {
  const n = weights.length
  if (n === 0) return []
  const locked = new Array<boolean>(n).fill(false)
  const result = new Array<number>(n).fill(min)

  for (let pass = 0; pass < n; pass += 1) {
    const unlocked: number[] = []
    for (let i = 0; i < n; i += 1) if (!locked[i]) unlocked.push(i)
    if (!unlocked.length) break
    const lockedCount = n - unlocked.length
    const remaining = total - min * lockedCount
    const weightSum = unlocked.reduce((sum, index) => sum + weights[index], 0)
    let changed = false
    for (const index of unlocked) {
      const share = weightSum > 0 ? (remaining * weights[index]) / weightSum : remaining / unlocked.length
      if (share < min - 1e-9) {
        locked[index] = true
        changed = true
      }
    }
    if (!changed) break
  }

  const unlocked: number[] = []
  for (let i = 0; i < n; i += 1) if (!locked[i]) unlocked.push(i)
  const lockedCount = n - unlocked.length
  const remaining = total - min * lockedCount
  const weightSum = unlocked.reduce((sum, index) => sum + weights[index], 0)
  for (const index of unlocked) {
    result[index] = weightSum > 0 ? (remaining * weights[index]) / weightSum : remaining / unlocked.length
  }
  // Corrige resíduo de arredondamento no último item livre.
  const last = unlocked[unlocked.length - 1]
  if (last !== undefined) result[last] += total - result.reduce((sum, value) => sum + value, 0)
  return result
}

/** Redimensiona uma cena mantendo o total e o piso de 0,5 s nas demais. */
export function resizeScene(
  scenes: StoryboardScene[],
  id: string,
  seconds: number,
  total: number,
): StoryboardScene[] {
  const index = scenes.findIndex((scene) => scene.id === id)
  if (index < 0) return scenes
  if (scenes.length === 1) return reflow(scenes, [Math.max(0.5, total)], total)

  const min = 0.5
  const max = Math.max(min, total - min * (scenes.length - 1))
  const target = clamp(seconds, min, max)
  const oldDurations = scenes.map((scene) => Math.max(0.01, scene.end - scene.start))
  const others = distribute(
    total - target,
    oldDurations.filter((_, sceneIndex) => sceneIndex !== index),
    min,
  )
  let otherIndex = 0
  const durations = oldDurations.map((_, sceneIndex) => (sceneIndex === index ? target : others[otherIndex++]))
  return reflow(scenes, durations, total)
}

/** Insere uma cena (nova/duplicada) retirando o tempo das demais proporcionalmente. */
export function insertScene(
  scenes: StoryboardScene[],
  index: number,
  scene: StoryboardScene,
  total: number,
): StoryboardScene[] {
  if (!scenes.length) return reflow([scene], [Math.max(0.5, total)], total)
  const desired = clamp(scene.end - scene.start || 2, 0.5, Math.max(0.5, total - 0.5 * scenes.length))
  const oldDurations = scenes.map((item) => Math.max(0.01, item.end - item.start))
  const others = distribute(total - desired, oldDurations, 0.5)
  const base = [...scenes]
  base.splice(index, 0, scene)
  const durations = [...others]
  durations.splice(index, 0, desired)
  return reflow(base, durations, total)
}

export function removeScene(scenes: StoryboardScene[], id: string, total: number): StoryboardScene[] {
  if (scenes.length <= 1) return scenes
  const remaining = scenes.filter((scene) => scene.id !== id)
  return scaleScenesToDuration(remaining, total)
}

export function moveScene(
  scenes: StoryboardScene[],
  id: string,
  direction: -1 | 1,
  total: number,
): StoryboardScene[] {
  const index = scenes.findIndex((scene) => scene.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= scenes.length) return scenes
  const durations = scenes.map((scene) => Math.max(0.01, scene.end - scene.start))
  const next = [...scenes]
  ;[next[index], next[target]] = [next[target], next[index]]
  const nextDurations = [...durations]
  ;[nextDurations[index], nextDurations[target]] = [nextDurations[target], nextDurations[index]]
  return reflow(next, nextDurations, total)
}

/**
 * Monta um storyboard a partir da análise real: hook no primeiro onset,
 * pico ancorado no último evento forte e fechamento limpo no CTA.
 */
export function buildAutoStoryboard(
  analysis: ClipAnalysis,
  duration: number,
  hook: HookSettings,
): StoryboardScene[] {
  const total = Math.max(1, duration)
  const preset = HOOK_PRESETS[hook.type]
  const hookEnd = round3(clamp(analysis.onsetTime + 1.2, 1.2, Math.min(5, total * 0.3)))
  const payoffSpan = clamp(total * 0.1, 1.5, 3)
  const payoffStart = round3(Math.max(hookEnd + 1, total - payoffSpan))
  const peakSpan = clamp(total * 0.15, 2, 5)

  const strong = [...analysis.events]
    .filter((event) => event.time >= payoffStart - peakSpan && event.time < payoffStart)
    .sort((a, b) => b.strength - a.strength)[0]
  const peakStart = round3(
    strong
      ? clamp(strong.time - 1, payoffStart - peakSpan, payoffStart - 1)
      : payoffStart - peakSpan,
  )

  const revealEnd = round3(
    Math.min(Math.max(hookEnd + 0.4, hookEnd + 3), Math.max(hookEnd + 0.5, peakStart - 0.5)),
  )
  const gap = peakStart - revealEnd

  const specs: SceneSpec[] = [
    {
      role: 'hook',
      layoutId: preset.layoutId,
      transition: preset.transition,
      motion: preset.motion,
      text: hook.text,
      showText: hook.text.trim().length > 0,
      seconds: hookEnd,
      intensity: preset.intensity,
    },
  ]

  if (revealEnd - hookEnd > 0.4) {
    specs.push({
      role: 'reveal',
      layoutId: 'mirage',
      transition: 'fade',
      motion: 'slow',
      text: '',
      showText: false,
      seconds: revealEnd - hookEnd,
    })
  }

  if (gap > 0.8) {
    if (gap >= 6.5) {
      const mid = revealEnd + gap / 2
      specs.push(
        {
          role: 'development',
          layoutId: 'spectrum',
          transition: 'cut',
          motion: 'pulse',
          text: '',
          showText: false,
          seconds: mid - revealEnd,
        },
        {
          role: 'development',
          layoutId: 'afterimage',
          transition: 'cut',
          motion: 'slow',
          text: '',
          showText: false,
          seconds: peakStart - mid,
        },
      )
    } else {
      specs.push({
        role: 'development',
        layoutId: 'spectrum',
        transition: 'cut',
        motion: 'pulse',
        text: '',
        showText: false,
        seconds: gap,
      })
    }
  }

  specs.push(
    {
      role: 'peak',
      layoutId: 't3',
      transition: 'flash',
      motion: 'pulse',
      text: '',
      showText: false,
      seconds: Math.max(0.3, payoffStart - peakStart),
    },
    {
      role: 'payoff',
      layoutId: 't5',
      transition: 'fade',
      motion: 'slow',
      text: '',
      showText: false,
      seconds: Math.max(0.3, total - payoffStart),
    },
  )

  return materialize(specs, total)
}
