import { useCallback, useEffect, useRef } from 'react'
import { getAudioEngine } from '../audio/AudioEngine'
import { useProjectStore } from '../project/project.store'
import { getClipEnd, getOutputDimensions } from '../project/project.types'
import { MIN_CLIP_SECONDS } from '../project/project.defaults'
import { StageRecorder } from '../recording/recorder'
import { buildBatchFileName } from './batch.utils'
import { buildExportManifest } from '../persistence/manifest.types'
import { saveExportManifest } from '../persistence/db'
import { useBatchStore } from './batch.store'

const waitFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })

/**
 * Grava a fila do Batch Creator em sequência, reutilizando o mesmo pipeline do
 * botão de gravação: Stage + track de áudio real, auto-stop pelo tempo do áudio.
 * Cada job é uma configuração completa aplicada ao projeto e restaurada no fim.
 */
export function useBatchExport(canvasRef: React.RefObject<HTMLCanvasElement | null>): {
  startBatch: () => Promise<void>
  cancelBatch: () => Promise<void>
} {
  const recorderRef = useRef<StageRecorder | null>(null)
  const cancelledRef = useRef(false)
  const runningRef = useRef(false)

  const cancelBatch = useCallback(async (): Promise<void> => {
    cancelledRef.current = true
    getAudioEngine().pause()
    await recorderRef.current?.cancel()
    useBatchStore.getState().setRunning(false)
  }, [])

  const startBatch = useCallback(async (): Promise<void> => {
    const batch = useBatchStore.getState()
    const project = useProjectStore.getState()
    const canvas = canvasRef.current
    if (runningRef.current) return
    if (!batch.jobs.length) {
      batch.setError('Gere a fila antes de gravar o lote.')
      return
    }
    if (!canvas) {
      batch.setError('O Stage não está pronto. Recarregue a página.')
      return
    }
    const meta = getAudioEngine().getMeta()
    if (!meta.duration || project.audioStatus === 'idle' || project.audioStatus === 'error') {
      batch.setError('Carregue um arquivo de áudio antes de gravar o lote.')
      return
    }

    runningRef.current = true
    cancelledRef.current = false
    batch.setRunning(true)
    batch.setError(null)
    const snapshot = project.config

    try {
      await getAudioEngine().ensureRunning()
      const jobs = useBatchStore.getState().jobs
      for (let index = 0; index < jobs.length; index += 1) {
        if (cancelledRef.current) break
        const job = jobs[index]
        const store = useBatchStore.getState()
        store.setActiveIndex(index)

        // Aplica a configuração do job (layout, recipe, plataforma) e deixa o
        // Stage consumir o estado antes de capturar o canvas.
        useProjectStore.getState().setConfig(job.config)
        await waitFrame()
        await waitFrame()

        const config = useProjectStore.getState().config
        const clipEnd = getClipEnd(config, meta.duration)
        const seconds = clipEnd - config.clipStart
        if (seconds < MIN_CLIP_SECONDS) {
          store.patchJob(job.id, {
            status: 'error',
            error: `Trecho muito curto (${seconds.toFixed(1)}s). Mínimo de ${MIN_CLIP_SECONDS}s.`,
          })
          continue
        }

        const audioTrack = getAudioEngine().getRecordingTrack()
        if (!audioTrack) {
          store.patchJob(job.id, { status: 'error', error: 'Track de áudio indisponível.' })
          continue
        }

        const recorder = new StageRecorder()
        recorderRef.current = recorder
        const dims = getOutputDimensions(config.aspectRatio, config.quality)
        recorder.setCanvasSize(dims.width, dims.height)
        const started = recorder.start({
          canvas,
          fps: config.fps,
          audioTrack,
          videoBitsPerSecond: config.quality === 'full' ? 12_000_000 : 6_000_000,
        })
        if (!started.ok) {
          store.patchJob(job.id, { status: 'error', error: started.error })
          continue
        }

        store.patchJob(job.id, { status: 'recording', error: null })
        try {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, (seconds + 4) * 1000)
            getAudioEngine().playClip(config.clipStart, clipEnd, () => {
              window.clearTimeout(timer)
              resolve()
            })
          })
          getAudioEngine().pause()
          if (cancelledRef.current) {
            await recorder.cancel()
            store.patchJob(job.id, { status: 'error', error: 'Lote cancelado pelo usuário.' })
            break
          }
          store.patchJob(job.id, { status: 'processing' })
          const result = await recorder.stop()
          if (!result || result.blob.size === 0) {
            store.patchJob(job.id, { status: 'error', error: 'A gravação terminou sem conteúdo.' })
            continue
          }
          const fileName = buildBatchFileName({
            job,
            artistName: config.type.artistName,
            trackTitle: config.type.trackTitle,
            clipSeconds: seconds,
            extension: result.extension,
          })
          store.setResult(
            job.id,
            result.blob,
            {
              sizeBytes: result.blob.size,
              mimeType: result.mimeType,
              width: result.width,
              height: result.height,
              durationSeconds: result.durationSeconds,
            },
            fileName,
          )
          void saveExportManifest(
            buildExportManifest({
              config,
              fileName,
              mimeType: result.mimeType,
              sizeBytes: result.blob.size,
              width: result.width,
              height: result.height,
              durationSeconds: result.durationSeconds,
            }),
          ).catch(() => undefined)
        } catch (error) {
          await recorder.cancel()
          store.patchJob(job.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Falha ao gravar este job.',
          })
        } finally {
          recorderRef.current = null
        }
      }
    } catch (error) {
      useBatchStore
        .getState()
        .setError(error instanceof Error ? error.message : 'Falha ao iniciar o lote.')
    } finally {
      // O projeto do usuário volta exatamente como estava antes do lote.
      useProjectStore.getState().setConfig(snapshot)
      useBatchStore.getState().setRunning(false)
      useBatchStore.getState().setActiveIndex(-1)
      runningRef.current = false
    }
  }, [canvasRef])

  useEffect(() => {
    const recorder = recorderRef
    return () => {
      if (recorder.current?.isActive) void recorder.current.cancel()
    }
  }, [])

  return { startBatch, cancelBatch }
}
