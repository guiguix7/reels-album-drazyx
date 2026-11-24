import { create } from 'zustand'
import type { BatchJob, BatchJobResult, BatchJobState } from './batch.types'

interface BatchStore {
  jobs: BatchJobState[]
  running: boolean
  activeIndex: number
  error: string | null
  setJobs: (jobs: BatchJob[]) => void
  patchJob: (id: string, patch: Partial<Omit<BatchJobState, 'id'>>) => void
  setResult: (id: string, blob: Blob, meta: Omit<BatchJobResult, 'url' | 'fileName'>, fileName: string) => void
  setRunning: (running: boolean) => void
  setActiveIndex: (index: number) => void
  setError: (error: string | null) => void
  clear: () => void
}

/** Fila do Batch Creator com status por job. Nenhum dado sai do navegador. */
export const useBatchStore = create<BatchStore>((set, get) => ({
  jobs: [],
  running: false,
  activeIndex: -1,
  error: null,

  setJobs: (jobs) =>
    set({
      jobs: jobs.map((job) => ({ ...job, status: 'queued', error: null, result: null })),
      activeIndex: -1,
      error: null,
    }),

  patchJob: (id, patch) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
    })),

  setResult: (id, blob, meta, fileName) => {
    const previous = get().jobs.find((job) => job.id === id)?.result
    if (previous) URL.revokeObjectURL(previous.url)
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              status: 'done',
              error: null,
              result: { ...meta, fileName, url: URL.createObjectURL(blob) },
            }
          : job,
      ),
    }))
  },

  setRunning: (running) => set({ running }),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  setError: (error) => set({ error }),

  clear: () => {
    for (const job of get().jobs) {
      if (job.result) URL.revokeObjectURL(job.result.url)
    }
    set({ jobs: [], running: false, activeIndex: -1, error: null })
  },
}))
