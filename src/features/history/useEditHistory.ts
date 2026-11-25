import { useEffect, useSyncExternalStore } from 'react'
import {
  getHistoryState,
  getHistoryVersion,
  redoEdit,
  startEditHistory,
  subscribeHistory,
  undoEdit,
} from './edit-history'

function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

export function useEditHistory(): {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
} {
  useSyncExternalStore(subscribeHistory, getHistoryVersion, getHistoryVersion)
  const state = getHistoryState()

  useEffect(() => startEditHistory(), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || isTextTarget(event.target)) return
      if (event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) redoEdit()
      else undoEdit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return { undo: undoEdit, redo: redoEdit, canUndo: state.canUndo, canRedo: state.canRedo }
}
