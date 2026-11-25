import type { CompositionElement } from '../project/project.types'

const STORAGE_KEY = 'drazyx.composition-presets.v1'

export interface CompositionPreset {
  id: string
  name: string
  savedAt: string
  elements: CompositionElement[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidElement(value: unknown): value is CompositionElement {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number'
  )
}

export function loadCompositionPresets(): CompositionPreset[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (preset): preset is CompositionPreset =>
        isRecord(preset) &&
        typeof preset.id === 'string' &&
        typeof preset.name === 'string' &&
        Array.isArray(preset.elements) &&
        preset.elements.every(isValidElement),
    )
  } catch {
    return []
  }
}

function persist(presets: CompositionPreset[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function saveCompositionPreset(name: string, elements: CompositionElement[]): CompositionPreset[] {
  const trimmed = name.trim() || 'Composição sem nome'
  const preset: CompositionPreset = {
    id: `preset-${Date.now().toString(36)}`,
    name: trimmed,
    savedAt: new Date().toISOString(),
    elements: structuredClone(elements),
  }
  const next = [preset, ...loadCompositionPresets().filter((entry) => entry.name !== trimmed)].slice(0, 30)
  persist(next)
  return next
}

export function removeCompositionPreset(id: string): CompositionPreset[] {
  const next = loadCompositionPresets().filter((preset) => preset.id !== id)
  persist(next)
  return next
}

export function serializeComposition(name: string, elements: CompositionElement[]): string {
  return JSON.stringify(
    {
      app: 'drazyx-visualizer-studio',
      kind: 'composition',
      name: name.trim() || 'Composição',
      savedAt: new Date().toISOString(),
      elements,
    },
    null,
    2,
  )
}

export function parseCompositionFile(text: string): { name: string; elements: CompositionElement[] } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (!isRecord(raw) || !Array.isArray(raw.elements) || !raw.elements.every(isValidElement)) {
    throw new Error('Arquivo de composição inválido.')
  }
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Composição importada',
    elements: raw.elements,
  }
}
