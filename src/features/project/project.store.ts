import { create } from 'zustand'
import type { AspectRatioId, AudioMeta, CoverMeta, CoverPalette, GlitchLevel, OutputQuality, PaletteMode, ProjectConfig, TemplateId, TypeSettings, VisualSettings } from './project.types'
import { getClipEnd } from './project.types'
import { DEFAULT_PALETTE, DEFAULT_PROJECT, MAX_CLIP_SECONDS, TEMPLATE_DEFAULT_VISUAL, TEMPLATE_IDS } from './project.defaults'
import type { ClipAnalysis } from '../audio/offline-analysis'
import type { HookSettings, StoryboardScene } from '../storyboard/storyboard.types'
import {
  applyHookToScenes,
  buildAutoStoryboard,
  createStoryboardPreset,
  HOOK_PRESETS,
  insertScene as insertSceneInList,
  motionKeyframes,
  moveScene as moveSceneInList,
  removeScene as removeSceneFromList,
  resizeScene,
  scaleScenesToDuration,
} from '../storyboard/storyboard.utils'

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

interface ProjectState {
  config: ProjectConfig
  audioStatus: AudioStatus
  audioMeta: AudioMeta | null
  audioError: string | null
  coverMeta: CoverMeta | null
  /** Paleta extraída da capa (fonte para o modo automático). */
  coverPalette: CoverPalette | null

  /* ações — configuração */
  setTemplate: (id: TemplateId) => void
  setAspect: (aspect: AspectRatioId) => void
  setQuality: (quality: OutputQuality) => void
  setFps: (fps: number) => void
  setClipStart: (seconds: number, audioDuration: number | null) => void
  setClipDuration: (seconds: number, audioDuration: number | null) => void
  setVisual: (patch: Partial<VisualSettings>) => void
  setGlitch: (level: GlitchLevel) => void
  setType: (patch: Partial<TypeSettings>) => void
  setPalette: (patch: Partial<CoverPalette>) => void
  setPaletteMode: (mode: PaletteMode) => void
  setCoverPalette: (palette: CoverPalette | null) => void
  resetVisualToTemplateDefault: () => void

  /* ações — storyboard */
  setStoryboardEnabled: (enabled: boolean) => void
  applyStoryboardPreset: (kind: 15 | 30) => void
  setAutoStoryboard: (analysis: ClipAnalysis) => void
  setHook: (patch: Partial<HookSettings>) => void
  updateScene: (id: string, patch: Partial<StoryboardScene>) => void
  setSceneDuration: (id: string, seconds: number) => void
  addScene: (afterId?: string) => void
  duplicateScene: (id: string) => void
  removeScene: (id: string) => void
  moveScene: (id: string, direction: -1 | 1) => void

  /* ações — assets */
  setAudioMeta: (meta: AudioMeta) => void
  setAudioStatus: (status: AudioStatus, error?: string | null) => void
  clearAudio: () => void
  setCoverMeta: (meta: CoverMeta) => void
  clearCover: () => void
}

/** Revoga object URLs antigos ao substituir assets (evita vazamento de memória). */
function revoke(url: string | null | undefined): void {
  if (url) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* URL já revogada */
    }
  }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  config: structuredCloneSafe(DEFAULT_PROJECT),
  audioStatus: 'idle',
  audioMeta: null,
  audioError: null,
  coverMeta: null,
  coverPalette: null,

  setTemplate: (id) =>
    set((state) => {
      if (!TEMPLATE_IDS.includes(id)) return state
      return { config: { ...state.config, templateId: id } }
    }),

  setAspect: (aspect) => set((state) => ({ config: { ...state.config, aspectRatio: aspect } })),

  setQuality: (quality) => set((state) => ({ config: { ...state.config, quality } })),

  setFps: (fps) =>
    set((state) => ({ config: { ...state.config, fps: fps === 60 ? 60 : 30 } })),

  setClipStart: (seconds, audioDuration) =>
    set((state) => {
      const duration = audioDuration ?? Infinity
      const maxStart = Math.max(0, Math.min(duration, state.config.clipDuration ? duration - 1 : duration))
      const clipStart = clamp(seconds, 0, Number.isFinite(maxStart) ? maxStart : seconds)
      const end = getClipEnd({ ...state.config, clipStart }, audioDuration)
      // Duração efetiva respeita o fim da faixa.
      const clipDuration = Math.max(1, Math.min(state.config.clipDuration, end - clipStart))
      return { config: fitStoryboard({ ...state.config, clipStart, clipDuration }) }
    }),

  setClipDuration: (seconds, audioDuration) =>
    set((state) => {
      // Limite = o que resta da faixa a partir do início escolhido, até MAX_CLIP_SECONDS.
      // Não usa o fim atual: senão reduzir a duração uma vez travaria o valor para sempre.
      const maxEnd = Math.min(MAX_CLIP_SECONDS, audioDuration ?? MAX_CLIP_SECONDS)
      const available = Math.max(1, maxEnd - state.config.clipStart)
      const clipDuration = clamp(seconds, 1, available)
      return { config: fitStoryboard({ ...state.config, clipDuration }) }
    }),

  setVisual: (patch) => set((state) => ({ config: { ...state.config, visual: { ...state.config.visual, ...patch } } })),

  setGlitch: (level) => set((state) => ({ config: { ...state.config, visual: { ...state.config.visual, glitch: level } } })),

  setType: (patch) => set((state) => ({ config: { ...state.config, type: { ...state.config.type, ...patch } } })),

  /** Ajuste manual de cor: qualquer cor escolhida à mão assume o controle da paleta. */
  setPalette: (patch) =>
    set((state) => ({
      config: {
        ...state.config,
        palette: { ...state.config.palette, ...patch, mode: 'manual' },
      },
    })),

  setPaletteMode: (mode) =>
    set((state) => {
      if (mode === 'manual') {
        return { config: { ...state.config, palette: { ...state.config.palette, mode } } }
      }
      const base = state.coverPalette ?? DEFAULT_PALETTE
      return { config: { ...state.config, palette: { mode: 'auto', ...base } } }
    }),

  setCoverPalette: (palette) =>
    set((state) => {
      const next = palette
        ? state.config.palette.mode === 'auto'
          ? { mode: 'auto' as const, ...palette }
          : state.config.palette
        : state.config.palette
      return { coverPalette: palette, config: { ...state.config, palette: next } }
    }),

  resetVisualToTemplateDefault: () => {
    const id = get().config.templateId
    const defaults = TEMPLATE_DEFAULT_VISUAL[id]
    if (defaults) set((state) => ({ config: { ...state.config, visual: { ...defaults } } }))
  },

  setStoryboardEnabled: (enabled) =>
    set((state) => ({
      config: { ...state.config, storyboard: { ...state.config.storyboard, enabled } },
    })),

  applyStoryboardPreset: (kind) =>
    set((state) => ({
      config: {
        ...state.config,
        storyboard: {
          ...state.config.storyboard,
          enabled: true,
          source: 'preset',
          scenes: createStoryboardPreset(kind, state.config.storyboard.hook, state.config.clipDuration),
        },
      },
    })),

  setAutoStoryboard: (analysis) =>
    set((state) => ({
      config: {
        ...state.config,
        storyboard: {
          ...state.config.storyboard,
          enabled: true,
          source: 'auto',
          scenes: buildAutoStoryboard(analysis, state.config.clipDuration, state.config.storyboard.hook),
        },
      },
    })),

  setHook: (patch) =>
    set((state) => {
      const storyboard = state.config.storyboard
      const nextType = patch.type ?? storyboard.hook.type
      const oldDefault = HOOK_PRESETS[storyboard.hook.type].text
      const text =
        patch.text ??
        (patch.type && (storyboard.hook.text.trim() === '' || storyboard.hook.text === oldDefault)
          ? HOOK_PRESETS[nextType].text
          : storyboard.hook.text)
      const hook = { ...storyboard.hook, ...patch, text }
      return {
        config: {
          ...state.config,
          storyboard: {
            ...storyboard,
            hook,
            source: 'manual',
            scenes: applyHookToScenes(storyboard.scenes, hook),
          },
        },
      }
    }),

  updateScene: (id, patch) =>
    set((state) => {
      const storyboard = state.config.storyboard
      const first = storyboard.scenes[0]
      const syncHookText =
        patch.text !== undefined && first?.id === id && first.role === 'hook'
          ? { ...storyboard.hook, text: patch.text }
          : storyboard.hook
      return {
        config: {
          ...state.config,
          storyboard: {
            ...storyboard,
            hook: syncHookText,
            source: 'manual',
            scenes: storyboard.scenes.map((scene) => {
              if (scene.id !== id) return scene
              const next = { ...scene, ...patch }
              if (patch.motion) next.keyframes = motionKeyframes(patch.motion)
              return next
            }),
          },
        },
      }
    }),

  setSceneDuration: (id, seconds) =>
    set((state) => ({
      config: {
        ...state.config,
        storyboard: {
          ...state.config.storyboard,
          source: 'manual',
          scenes: resizeScene(state.config.storyboard.scenes, id, seconds, state.config.clipDuration),
        },
      },
    })),

  addScene: (afterId) =>
    set((state) => {
      const scenes = state.config.storyboard.scenes
      const found = afterId ? scenes.findIndex((scene) => scene.id === afterId) : -1
      const index = found >= 0 ? found + 1 : scenes.length
      const base = scenes[Math.max(0, index - 1)]
      const scene: StoryboardScene = {
        id: makeSceneId(),
        role: 'development',
        start: 0,
        end: 2,
        layoutId: base?.layoutId ?? state.config.templateId,
        visualStyleId: base?.visualStyleId ?? 'album',
        transition: 'cut',
        motion: 'slow',
        text: '',
        showText: false,
        audioIntensity: 1,
        keyframes: motionKeyframes('slow'),
      }
      return {
        config: {
          ...state.config,
          storyboard: {
            ...state.config.storyboard,
            source: 'manual',
            scenes: insertSceneInList(scenes, index, scene, state.config.clipDuration),
          },
        },
      }
    }),

  duplicateScene: (id) =>
    set((state) => {
      const scenes = state.config.storyboard.scenes
      const index = scenes.findIndex((scene) => scene.id === id)
      if (index < 0) return state
      const original = scenes[index]
      const copy: StoryboardScene = {
        ...original,
        id: makeSceneId(),
        keyframes: original.keyframes.map((keyframe) => ({ ...keyframe })),
      }
      return {
        config: {
          ...state.config,
          storyboard: {
            ...state.config.storyboard,
            source: 'manual',
            scenes: insertSceneInList(scenes, index + 1, copy, state.config.clipDuration),
          },
        },
      }
    }),

  removeScene: (id) =>
    set((state) => ({
      config: {
        ...state.config,
        storyboard: {
          ...state.config.storyboard,
          source: 'manual',
          scenes: removeSceneFromList(state.config.storyboard.scenes, id, state.config.clipDuration),
        },
      },
    })),

  moveScene: (id, direction) =>
    set((state) => ({
      config: {
        ...state.config,
        storyboard: {
          ...state.config.storyboard,
          source: 'manual',
          scenes: moveSceneInList(state.config.storyboard.scenes, id, direction, state.config.clipDuration),
        },
      },
    })),

  setAudioMeta: (meta) => {
    const previous = get().audioMeta
    revoke(previous?.objectUrl)
    set((state) => {
      const config = state.config
      const duration = Number.isFinite(meta.duration) && meta.duration > 0 ? meta.duration : 0
      if (!duration) {
        return { audioMeta: meta, audioError: null, audioStatus: 'ready' }
      }
      // Áudio novo pode ser mais curto: o trecho antigo não pode continuar fora da faixa.
      const clipStart = clamp(config.clipStart, 0, Math.max(0, duration - 1))
      const available = Math.max(1, Math.min(MAX_CLIP_SECONDS, duration - clipStart))
      const clipDuration = clamp(config.clipDuration, 1, available)
      return {
        audioMeta: meta,
        audioError: null,
        audioStatus: 'ready',
        config: fitStoryboard({ ...config, clipStart, clipDuration }),
      }
    })
  },

  setAudioStatus: (status, error = null) => set({ audioStatus: status, audioError: error ?? null }),

  clearAudio: () => {
    const previous = get().audioMeta
    revoke(previous?.objectUrl)
    const config = get().config
    set({
      audioMeta: null,
      audioStatus: 'idle',
      audioError: null,
      config: fitStoryboard({ ...config, clipStart: 0, clipDuration: MAX_CLIP_SECONDS }),
    })
  },

  setCoverMeta: (meta) => {
    const previous = get().coverMeta
    revoke(previous?.objectUrl)
    set({ coverMeta: meta })
  },

  clearCover: () => {
    const previous = get().coverMeta
    revoke(previous?.objectUrl)
    set((state) => {
      const palette = state.config.palette.mode === 'auto' ? { ...DEFAULT_PALETTE } : state.config.palette
      return { coverMeta: null, coverPalette: null, config: { ...state.config, palette } }
    })
  },
}))

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

let sceneSeq = 0

function makeSceneId(): string {
  sceneSeq += 1
  return `scene-${Date.now().toString(36)}-${sceneSeq}`
}

/** Mantém as cenas cobrindo exatamente a duração atual do trecho. */
function fitStoryboard(config: ProjectConfig): ProjectConfig {
  const scenes = config.storyboard.scenes
  if (!scenes.length) return config
  const current = scenes[scenes.length - 1].end
  if (Math.abs(current - config.clipDuration) < 0.01) return config
  return {
    ...config,
    storyboard: {
      ...config.storyboard,
      scenes: scaleScenesToDuration(scenes, config.clipDuration),
    },
  }
}

function structuredCloneSafe<T>(value: T): T {
  return typeof structuredClone === 'function' ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T)
}

/** Seletores de conveniência. */
export const selectConfig = (state: ProjectState): ProjectConfig => state.config
