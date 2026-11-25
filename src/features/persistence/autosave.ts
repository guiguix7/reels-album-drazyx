import type { ProjectConfig } from '../project/project.types'
import { mergeProjectConfig } from './project-io'

const KEY = 'drazyx:autosave:v1'

export interface AutosaveSnapshot {
  name: string
  savedAt: string
  config: ProjectConfig
}

export function loadAutosave(): AutosaveSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { name?: unknown; savedAt?: unknown; config?: unknown }
    if (!parsed || typeof parsed.config !== 'object' || parsed.config === null) return null
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Meu projeto',
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      config: mergeProjectConfig(parsed.config as Partial<ProjectConfig>),
    }
  } catch {
    return null
  }
}

/** Autosave é best-effort: quota/private mode não pode quebrar o editor. */
export function writeAutosave(name: string, config: ProjectConfig): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const savedAt = new Date().toISOString()
    localStorage.setItem(KEY, JSON.stringify({ name, savedAt, config }))
    return savedAt
  } catch {
    return null
  }
}

export function clearAutosave(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage indisponível */
  }
}
