import { create } from 'zustand'
import type { RecorderResult } from './recorder'

export type RecorderStatus = 'idle' | 'preparing' | 'recording' | 'processing' | 'done' | 'error'

export interface RecordedPreview {
  url: string
  fileName: string
  mimeType: string
  extension: string
  sizeBytes: number
  width: number
  height: number
  durationSeconds: number
  /** Avisos da validação do arquivo (vazio = passou nas checagens). */
  warnings: string[]
}

interface RecorderStore {
  status: RecorderStatus
  statusMessage: string | null
  error: string | null
  warning: string | null
  preview: RecordedPreview | null
  setStatus: (status: RecorderStatus, statusMessage?: string | null) => void
  setError: (error: string) => void
  setWarning: (warning: string | null) => void
  setResult: (result: RecorderResult, fileName: string, warnings?: string[]) => void
  reset: () => void
}

export const useRecorderStore = create<RecorderStore>((set, get) => ({
  status: 'idle',
  statusMessage: null,
  error: null,
  warning: null,
  preview: null,
  setStatus: (status, statusMessage = null) =>
    set({ status, statusMessage, error: status === 'error' ? get().error : null, warning: status === 'error' ? null : get().warning }),
  setError: (error) => set({ status: 'error', error, warning: null }),
  setWarning: (warning) => set((state) => ({
    warning: warning ?? state.warning,
    status: state.status,
  })),
  setResult: (result, fileName, warnings = []) => {
    const previous = get().preview
    if (previous) URL.revokeObjectURL(previous.url)
    set({
      status: 'done',
      warning: null,
      preview: {
        url: URL.createObjectURL(result.blob),
        fileName,
        mimeType: result.mimeType,
        extension: result.extension,
        sizeBytes: result.blob.size,
        width: result.width,
        height: result.height,
        durationSeconds: result.durationSeconds,
        warnings,
      },
    })
  },
  reset: () => {
    const previous = get().preview
    if (previous) URL.revokeObjectURL(previous.url)
    set({ status: 'idle', statusMessage: null, error: null, warning: null, preview: null })
  },
}))
