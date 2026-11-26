import { useCallback, useEffect, useRef } from 'react'
import { getAudioEngine } from '../audio/AudioEngine'
import { useProjectStore } from '../project/project.store'
import { getClipEnd, getClipReadiness, getOutputDimensions } from '../project/project.types'
import { MIN_CLIP_SECONDS } from '../project/project.defaults'
import { StageRecorder } from './recorder'
import { useRecorderStore } from './recording.store'
import { buildRecordingFileName } from './file-name'
import { validateRecording } from './export-validation'
import { beginVisualExport, endVisualExport } from '../visualizer/engine-registry'
import { buildExportManifest } from '../persistence/manifest.types'
import { saveExportManifest } from '../persistence/db'
import { estimateRecording } from './recording-preflight'

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`
  return `${bytes} B`
}

/**
 * Orquestra o fluxo de gravação:
 * seek no trecho → inicia MediaRecorder (canvas + áudio) → playClip com auto-stop → Blob final.
 */
export function useRecordingFlow(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): {
  startRecording: () => Promise<void>
  cancelRecording: () => Promise<void>
  recording: boolean
} {
  const recorderRef = useRef<StageRecorder | null>(null)
  if (!recorderRef.current) recorderRef.current = new StageRecorder()
  const cancelledRef = useRef(false)

  const startRecording = useCallback(async (): Promise<void> => {
    const recStore = useRecorderStore.getState()
    const project = useProjectStore.getState()
    const engine = getAudioEngine()
    const meta = engine.getMeta()
    const canvas = canvasRef.current

    if (recStore.status === 'preparing' || recStore.status === 'recording' || recStore.status === 'processing') {
      return
    }
    if (!canvas) {
      recStore.setError('O Stage não está pronto. Recarregue a página.')
      return
    }
    if (!meta.duration || project.audioStatus === 'idle' || project.audioStatus === 'error') {
      recStore.setError('Carregue um arquivo de áudio antes de gravar.')
      return
    }
    if (meta.duration <= 0) {
      recStore.setError('A duração do áudio é inválida. Tente outro arquivo.')
      return
    }

    const config = project.config
    const clipEnd = getClipEnd(config, meta.duration)
    const readiness = getClipReadiness(config, meta.duration, MIN_CLIP_SECONDS)
    if (!readiness.recordable) {
      recStore.setError(readiness.reason ?? 'O trecho selecionado não pode ser gravado.')
      return
    }
    const effective = readiness.effective

    const dims = getOutputDimensions(config.aspectRatio, config.quality)
    const navigatorDeviceMemory = (navigator as { deviceMemory?: number }).deviceMemory
    const estimate = estimateRecording(
      {
        width: dims.width,
        height: dims.height,
        fps: config.fps,
        videoBitsPerSecond: config.quality === 'full' ? 12_000_000 : 6_000_000,
        audioBitsPerSecond: 192_000,
        durationSeconds: effective,
      },
      navigatorDeviceMemory != null ? { deviceMemory: navigatorDeviceMemory } : undefined,
    )
    recStore.reset() // limpa preview anterior, se houver
    recStore.setStatus('preparing', 'Preparando gravação...')
    cancelledRef.current = false

    if (!estimate.seemsSafe && estimate.alternatives.length > 0) {
      recStore.setWarning(
        `Esta gravação pode usar muita memória (~${formatBytes(estimate.estimatedMemoryBytes)}). ` +
          `Uma alternativa mais leve: ${estimate.alternatives[0].label}.`,
      )
      recStore.setStatus('preparing', 'Preparando gravação (atenção à memória)...')
      return
    }

    const exportDims = getOutputDimensions(config.aspectRatio, config.quality)
    recorderRef.current?.setCanvasSize(exportDims.width, exportDims.height)
    // Export sempre em resolução cheia: preview adaptativo não reduz o arquivo.
    beginVisualExport()
    let audioTrack: MediaStreamTrack | null = null
    try {
      audioTrack = engine.getRecordingTrack()
      if (!audioTrack) throw new Error('track de áudio indisponível')
      if (engine.getMeta().status !== 'playing') {
        // contexto criado sob gesto: garanta resume para o áudio fluir na gravação
        await engine.ensureRunning()
      }
    } catch (err) {
      endVisualExport()
      recStore.setError(`Não foi possível preparar o áudio para gravação: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      return
    }

    const started = recorderRef.current?.start({
      canvas,
      fps: config.fps,
      audioTrack,
      videoBitsPerSecond: config.quality === 'full' ? 12_000_000 : 6_000_000,
    })
    if (!started || !started.ok) {
      endVisualExport()
      recStore.setError(started && !started.ok ? started.error : 'Falha ao iniciar a gravação.')
      return
    }

    const finish = async (): Promise<void> => {
      if (cancelledRef.current) return
      recStore.setStatus('processing', 'Finalizando arquivo...')
      try {
        const result = await recorderRef.current?.stop()
        if (cancelledRef.current) return
        if (!result || result.blob.size === 0) {
          recStore.setError('A gravação terminou sem conteúdo. Verifique se o Stage estava visível e tente novamente.')
          return
        }
        const fileName = buildRecordingFileName({
          artistName: config.type.artistName,
          trackTitle: config.type.trackTitle,
          clipSeconds: effective,
          extension: result.extension,
        })
        const warnings = validateRecording(result, {
          width: exportDims.width,
          height: exportDims.height,
          clipSeconds: effective,
        })
        recStore.setResult(result, fileName, warnings)
        // Manifest local por export (auxiliar): falha de IndexedDB não invalida o arquivo.
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
      } catch (err) {
        recStore.setError(`Falha ao finalizar a gravação: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      } finally {
        endVisualExport()
      }
    }

    recStore.setStatus('recording', 'Gravando...')
    engine.playClip(config.clipStart, clipEnd, () => {
      void finish()
    })
  }, [canvasRef])

  const cancelRecording = useCallback(async (): Promise<void> => {
    cancelledRef.current = true
    const recStore = useRecorderStore.getState()
    getAudioEngine().pause()
    await recorderRef.current?.cancel()
    endVisualExport()
    recStore.reset()
  }, [])

  // Encerra com segurança ao desmontar (evita MediaRecorder preso).
  useEffect(() => {
    const recorder = recorderRef.current
    return () => {
      if (recorder?.isActive) void recorder.cancel()
    }
  }, [])

  const recording = useRecorderStore((s) => s.status === 'recording' || s.status === 'processing')

  return { startRecording, cancelRecording, recording }
}
