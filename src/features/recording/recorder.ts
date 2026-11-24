import { checkRecordingSupport } from '../../lib/browser-capabilities'

export interface RecorderResult {
  blob: Blob
  mimeType: string
  extension: string
  durationSeconds: number
  width: number
  height: number
}

export interface RecorderStartOptions {
  canvas: HTMLCanvasElement
  fps: number
  audioTrack: MediaStreamTrack | null
  videoBitsPerSecond: number
}

/**
 * Grava o canvas do Stage + a track de áudio do Web Audio API num único MediaStream.
 * A track de áudio é CLONADA para não encerrar o MediaStreamDestination do engine
 * (track original continua válida para gravações futuras).
 */
export class StageRecorder {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stopPromise: Promise<void> | null = null
  private startAt = 0
  private width = 1080
  private height = 1920
  private active = false
  private mimeType = 'video/webm'

  get isActive(): boolean {
    return this.active
  }

  /** Fallback quando captureStream não informa dimensões. */
  setCanvasSize(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  start(options: RecorderStartOptions): { ok: true } | { ok: false; error: string } {
    if (this.active) return { ok: false, error: 'Já existe uma gravação em andamento.' }

    const support = checkRecordingSupport()
    if (!support.hasMediaRecorder) {
      return { ok: false, error: 'Este navegador não suporta MediaRecorder. Use Chrome ou Edge atualizados.' }
    }
    if (!support.hasCaptureStream) {
      return { ok: false, error: 'Este navegador não permite capturar o canvas (captureStream). Use Chrome ou Edge atualizados.' }
    }
    const preferred = support.preferred
    if (!preferred) {
      return { ok: false, error: 'Nenhum codec de vídeo suportado foi encontrado neste navegador.' }
    }
    // Sem track de áudio não existe export válido — nunca gravar vídeo mudo como sucesso.
    if (!options.audioTrack || options.audioTrack.readyState !== 'live') {
      return { ok: false, error: 'O áudio não está pronto para gravação. Toque em reproduzir e tente novamente.' }
    }

    let canvasStream: MediaStream
    try {
      canvasStream = options.canvas.captureStream(options.fps)
    } catch (err) {
      return { ok: false, error: `Falha ao capturar o canvas: ${err instanceof Error ? err.message : 'erro desconhecido'}` }
    }

    // Track de áudio clonada — a original permanece no MediaStreamDestination do engine.
    const stream = new MediaStream(canvasStream.getVideoTracks())
    try {
      stream.addTrack(options.audioTrack.clone())
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop())
      return { ok: false, error: `Falha ao anexar áudio na gravação: ${err instanceof Error ? err.message : 'erro desconhecido'}` }
    }

    const hasVideo = stream.getVideoTracks().length > 0
    if (!hasVideo) {
      stream.getTracks().forEach((t) => t.stop())
      return { ok: false, error: 'O Stage não está produzindo vídeo para capturar.' }
    }

    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: preferred.mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond,
        audioBitsPerSecond: 192_000,
      })
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop())
      return { ok: false, error: `Falha ao iniciar o MediaRecorder: ${err instanceof Error ? err.message : 'erro desconhecido'}` }
    }

    this.recorder = recorder
    this.chunks = []
    this.active = true
    this.startAt = performance.now()
    this.mimeType = preferred.mimeType
    // Dimensões reais do vídeo, quando a track informa.
    const videoTrack = stream.getVideoTracks()[0]
    const settings = videoTrack.getSettings()
    if (settings.width && settings.height) {
      this.width = settings.width
      this.height = settings.height
    }

    this.stopPromise = new Promise<void>((resolve) => {
      const finalize = (): void => {
        stream.getTracks().forEach((track) => track.stop())
        this.recorder = null
        this.stopPromise = null
        resolve()
      }
      recorder.ondataavailable = (event): void => {
        if (event.data && event.data.size > 0) this.chunks.push(event.data)
      }
      recorder.onerror = (): void => {
        finalize()
      }
      recorder.onstop = finalize
    })

    // Timeslice de 1s: chunks progressivos evitam perda total se o encerramento falhar.
    recorder.start(1000)
    return { ok: true }
  }

  /** Encerra e devolve o resultado; null se não houver gravação ativa. */
  async stop(): Promise<RecorderResult | null> {
    const recorder = this.recorder
    if (!recorder || !this.active) return null
    this.active = false
    const stopPromise = this.stopPromise

    // Pequeno atraso evita cortar o último frame em alguns encoders.
    await new Promise((r) => setTimeout(r, 120))
    if (recorder.state === 'recording') {
      try {
        recorder.requestData()
      } catch {
        /* requestData pode falhar perto do stop; stop() cuida do resto */
      }
      recorder.stop()
    }
    await stopPromise

    if (this.chunks.length === 0) return null
    const mimeType = recorder.mimeType || this.mimeType
    const blob = new Blob(this.chunks, { type: mimeType.split(';')[0] })
    const chunks = this.chunks
    chunks.length = 0
    const durationSeconds = Math.max(0, (performance.now() - this.startAt) / 1000 - 0.12)
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
    return {
      blob,
      mimeType: mimeType.split(';')[0],
      extension,
      durationSeconds,
      width: this.width,
      height: this.height,
    }
  }

  /** Cancela descartando os dados parciais. */
  async cancel(): Promise<void> {
    const recorder = this.recorder
    if (!recorder || !this.active) return
    this.active = false
    this.chunks = []
    const stopPromise = this.stopPromise
    if (recorder.state === 'recording') recorder.stop()
    await stopPromise
  }
}
