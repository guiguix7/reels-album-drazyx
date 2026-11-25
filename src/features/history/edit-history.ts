import { useProjectStore } from '../project/project.store'
import type { ProjectConfig } from '../project/project.types'

const LIMIT = 40
const COALESCE_MS = 350
let past: ProjectConfig[] = []
let future: ProjectConfig[] = []
let pending: ProjectConfig | null = null
let timer: number | null = null
let applying = false
let started = false
let version = 0
const listeners = new Set<() => void>()

function emit(): void {
  version++
  listeners.forEach((listener) => listener())
}

function flushPending(): void {
  if (timer != null) {
    window.clearTimeout(timer)
    timer = null
  }
  if (!pending) return
  past.push(pending)
  if (past.length > LIMIT) past = past.slice(-LIMIT)
  pending = null
  future = []
  emit()
}

/** Histórico de snapshots apenas da configuração (sem buffers de áudio/vídeo). */
export function startEditHistory(): () => void {
  if (started) return () => undefined
  started = true
  const unsubscribe = useProjectStore.subscribe((state, previous) => {
    if (applying || state.config === previous.config) return
    if (!pending) pending = previous.config
    if (timer != null) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = null
      const snapshot = pending
      pending = null
      if (!snapshot) return
      past.push(snapshot)
      if (past.length > LIMIT) past = past.slice(-LIMIT)
      future = []
      emit()
    }, COALESCE_MS)
  })
  return () => {
    unsubscribe()
    if (timer != null) window.clearTimeout(timer)
    timer = null
    pending = null
    past = []
    future = []
    started = false
    emit()
  }
}

export function resetEditHistory(): void {
  if (timer != null) window.clearTimeout(timer)
  timer = null
  pending = null
  past = []
  future = []
  emit()
}

export function undoEdit(): boolean {
  flushPending()
  const snapshot = past.pop()
  if (!snapshot) return false
  future.push(useProjectStore.getState().config)
  applying = true
  useProjectStore.getState().setConfig(snapshot)
  applying = false
  emit()
  return true
}

export function redoEdit(): boolean {
  flushPending()
  const snapshot = future.pop()
  if (!snapshot) return false
  past.push(useProjectStore.getState().config)
  applying = true
  useProjectStore.getState().setConfig(snapshot)
  applying = false
  emit()
  return true
}

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getHistoryVersion(): number {
  return version
}

export function getHistoryState(): { canUndo: boolean; canRedo: boolean } {
  return { canUndo: past.length > 0 || pending !== null, canRedo: future.length > 0 }
}
