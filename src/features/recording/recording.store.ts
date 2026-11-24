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
}

interface RecorderStore {
  status: RecorderStatus
  statusMessage: string | null
  error: string | null
  preview: RecordedPreview | null
  setStatus: (status: RecorderStatus, statusMessage?: string | null) => void
  setError: (error: string) => void
  setResult: (result: RecorderResult, fileName: string) => void
  reset: () => void
}

export const useRecorderStore = create<RecorderStore>((set, get) => ({
  status: 'idle',
  statusMessage: null,
  error: null,
  preview: null,
  setStatus: (status, statusMessage = null) =>
    set({ status, statusMessage, error: status === 'error' ? get().error : null }),
  setError: (error) => set({ status: 'error', error }),
  setResult: (result, fileName) => {
    const previous = get().preview
    if (previous) URL.revokeObjectURL(previous.url)
    set({
      status: 'done',
      preview: {
        url: URL.createObjectURL(result.blob),
        fileName,
        mimeType: result.mimeType,
        extension: result.extension,
        sizeBytes: result.blob.size,
        width: result.width,
        height: result.height,
        durationSeconds: result.durationSeconds,
      },
    })
  },
  reset: () => {
    const previous = get().preview
    if (previous) URL.revokeObjectURL(previous.url)
    set({ status: 'idle', statusMessage: null, error: null, preview: null })
  },
}))
