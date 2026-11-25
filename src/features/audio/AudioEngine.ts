import { validateAudioFile } from '../../lib/file-validation'
import {
  averageByteRange,
  bandCurve,
  binForFrequency,
  designLogBars,
  envelope,
  spectralFlux,
  TransientDetector,
} from './audio.utils'
import { detectRhythmFromBuffer } from './rhythm'
import type { AudioEngineMeta, AudioFrame } from './audio.types'
import { BAR_COUNT } from './audio.types'

const FFT_SIZE = 2048
const BAR_MIN_HZ = 40
const BAR_MAX_HZ = 12000
const BANDS = { bass: [20, 150] as const, mid: [150, 2000] as const, treble: [2000, 11000] as const }

/**
 * Único motor de áudio do app. Encapsula elemento <audio>, grafo Web Audio,
 * analyser, bandas normalizadas e o relógio da timeline (o tempo do áudio é a
 * fonte de verdade para playback e gravação).
 */
export class AudioEngine {
  private audio: HTMLAudioElement
  private ctx: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private monitorGain: GainNode | null = null
  private recDest: MediaStreamAudioDestinationNode | null = null

  private frequency: Uint8Array | null = null
  private waveform: Uint8Array | null = null
  private previousFrequency: Uint8Array | null = null
  private barRanges: Array<[number, number]> | null = null
  private barSmoothed = new Float32Array(BAR_COUNT)
  private barPeaks = new Float32Array(BAR_COUNT)

  private frame: AudioFrame = {
    time: 0,
    duration: 0,
    playing: false,
    bass: 0,
    mid: 0,
    treble: 0,
    energy: 0,
    transient: 0,
    bpm: 0,
    beatPhase: 0,
    beatPulse: 0,
    frequency: null,
    waveform: null,
    bars: this.barSmoothed,
  }

  private transientDetector = new TransientDetector()
  private lastAnalysisTime = performance.now() / 1000
  private objectUrl: string | null = null
  private rafHandle: number | null = null
  private clipTimer: number | null = null
  private armedEnd: number | null = null
  private clipEndFired = false
  private listeners = new Set<() => void>()
  private meta: AudioEngineMeta = {
    status: 'idle',
    fileName: null,
    duration: 0,
    bpm: 0,
    error: null,
    monitorVolume: 0.8,
    playing: false,
  }

  constructor() {
    this.audio = document.createElement('audio')
    this.audio.preload = 'auto'
    this.audio.crossOrigin = 'anonymous'
    this.audio.addEventListener('loadedmetadata', () => {
      const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0
      this.patchMeta({ duration, status: this.meta.status === 'loading' ? 'ready' : this.meta.status })
      this.frame.duration = duration
    })
    this.audio.addEventListener('play', () => this.patchMeta({ playing: true, status: 'playing' }))
    this.audio.addEventListener('pause', () => {
      // Eventos de pause também chegam ao trocar/limpar o src; não podem sobrescrever
      // os estados loading/idle/error da troca de arquivo.
      const keep = !this.meta.fileName || this.meta.status === 'loading' || this.meta.status === 'error'
      this.patchMeta({ playing: false, status: keep ? this.meta.status : 'paused' })
    })
    this.audio.addEventListener('error', () => this.onElementError())
    // Auto-stop do trecho não pode depender de requestAnimationFrame: o navegador
    // pausa rAF em abas ocultas e a gravação nunca terminaria. timeupdate + timer
    // leem o relógio do próprio áudio (fonte de verdade) e disparam o fim.
    this.audio.addEventListener('timeupdate', () => this.checkClipEnd())
    this.clipTimer = window.setInterval(() => this.checkClipEnd(), 250)
    this.startLoop()
  }

  /* ---------- assinaturas de estado (uso com useSyncExternalStore) ---------- */

  /** Arrow property: permanece bound ao ser passada direto ao React. */
  getMeta = (): AudioEngineMeta => {
    return this.meta
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private patchMeta(patch: Partial<AudioEngineMeta>): void {
    this.meta = { ...this.meta, ...patch }
    this.listeners.forEach((fn) => fn())
  }

  /* ---------- contexto / grafo ---------- */

  /** Cria (uma vez) e retoma o AudioContext. Chamar em gestos do usuário. */
  ensureContext(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      this.patchMeta({ status: 'error', error: 'Este navegador não suporta a Web Audio API.' })
      return
    }
    this.ctx = new Ctor()
    // MediaElementAudioSourceNode criado exatamente uma vez por elemento.
    this.sourceNode = this.ctx.createMediaElementSource(this.audio)

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = FFT_SIZE
    this.analyser.smoothingTimeConstant = 0.55

    this.monitorGain = this.ctx.createGain()
    this.monitorGain.gain.value = this.meta.monitorVolume

    this.recDest = this.ctx.createMediaStreamDestination()

    this.sourceNode.connect(this.analyser)
    this.analyser.connect(this.monitorGain)
    this.monitorGain.connect(this.ctx.destination)
    // Tap de gravação: pré-monitor (volume/mute do monitor não afeta o arquivo).
    this.sourceNode.connect(this.recDest)

    this.frequency = new Uint8Array(this.analyser.frequencyBinCount)
    this.waveform = new Uint8Array(this.analyser.fftSize)
    this.previousFrequency = new Uint8Array(this.analyser.frequencyBinCount)
    this.barRanges = designLogBars(BAR_COUNT, BAR_MIN_HZ, BAR_MAX_HZ, this.ctx.sampleRate, FFT_SIZE)
    this.frame.frequency = this.frequency
    this.frame.waveform = this.waveform

    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  /** Stream de áudio para o Recorder (trilha pré-monitor). */
  getRecordingTrack(): MediaStreamTrack | null {
    this.ensureContext()
    return this.recDest?.stream.getAudioTracks()[0] ?? null
  }

  /** URL atual do elemento de áudio (para o estado do projeto). */
  getObjectUrl(): string | null {
    return this.objectUrl
  }

  /** Garante contexto criado E resume() concluído — usado antes de gravar. */
  async ensureRunning(): Promise<void> {
    this.ensureContext()
    const ctx = this.ctx
    if (!ctx) throw new Error('Web Audio API indisponível neste navegador.')
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        throw new Error('O navegador bloqueou o áudio. Interaja com a página e tente novamente.')
      }
    }
    if (ctx.state === 'closed') throw new Error('O contexto de áudio foi encerrado. Recarregue a página.')
  }

  /* ---------- carregamento ---------- */

  async load(file: File): Promise<boolean> {
    const validation = validateAudioFile(file)
    if (!validation.ok) {
      this.patchMeta({ status: 'error', error: validation.error ?? 'Arquivo de áudio inválido.' })
      return false
    }
    this.ensureContext()
    this.rhythmToken++
    // Troca de arquivo: para o trecho armado e zera a análise antes do novo decode.
    this.audio.pause()
    this.armedEnd = null
    this.clipEndCallback = null
    this.clipEndFired = false
    this.resetAnalysis()
    this.patchMeta({ status: 'loading', error: null, fileName: file.name, duration: 0, bpm: 0, playing: false })
    const oldUrl = this.objectUrl
    this.objectUrl = URL.createObjectURL(file)
    this.audio.src = this.objectUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)

    try {
      await this.waitForMetadata()
      if (!Number.isFinite(this.audio.duration) || this.audio.duration <= 0) {
        throw new Error('duration')
      }
      this.patchMeta({ status: 'ready', duration: this.audio.duration })
      this.frame.duration = this.audio.duration
      this.frame.time = 0
      // Ritmo é assíncrono e opcional: não bloqueia o play nem a gravação.
      void this.detectRhythm()
      return true
    } catch {
      // Arquivo inválido não pode deixar um src quebrado nem metadados antigos na UI.
      this.clear()
      this.patchMeta({
        status: 'error',
        error: 'O navegador não conseguiu decodificar este áudio. Tente MP3, WAV ou OGG.',
      })
      return false
    }
  }

  /** Remove o áudio atual (playback, src, object URL e análise) mantendo o grafo de áudio. */
  clear(): void {
    this.rhythmToken++
    this.armedEnd = null
    this.clipEndCallback = null
    this.clipEndFired = false
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
    this.resetAnalysis()
    this.patchMeta({
      status: 'idle',
      fileName: null,
      duration: 0,
      bpm: 0,
      error: null,
      playing: false,
    })
  }

  private resetAnalysis(): void {
    this.frame.time = 0
    this.frame.duration = 0
    this.frame.playing = false
    this.frame.bass = 0
    this.frame.mid = 0
    this.frame.treble = 0
    this.frame.energy = 0
    this.frame.transient = 0
    this.frame.bpm = 0
    this.frame.beatPhase = 0
    this.frame.beatPulse = 0
    this.barSmoothed.fill(0)
    this.barPeaks.fill(0)
    this.previousFrequency?.fill(0)
    this.transientDetector = new TransientDetector()
  }

  private waitForMetadata(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.audio.readyState >= 1 && Number.isFinite(this.audio.duration)) return resolve()
      const onLoaded = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('decode'))
      }
      const cleanup = () => {
        this.audio.removeEventListener('loadedmetadata', onLoaded)
        this.audio.removeEventListener('error', onError)
      }
      this.audio.addEventListener('loadedmetadata', onLoaded, { once: true })
      this.audio.addEventListener('error', onError, { once: true })
      // Timeout de segurança para arquivos que o navegador não decodifica.
      window.setTimeout(() => {
        cleanup()
        reject(new Error('timeout'))
      }, 8000)
    })
  }

  /**
   * Decodifica o arquivo local e estima o BPM (primeiros 45 s).
   * Roda depois do ready; falhas só deixam o visual sem pulso de batida.
   */
  private async detectRhythm(): Promise<void> {
    const ctx = this.ctx
    const url = this.objectUrl
    if (!ctx || !url) return
    const token = ++this.rhythmToken
    try {
      const response = await fetch(url)
      const data = await response.arrayBuffer()
      const buffer = await ctx.decodeAudioData(data)
      if (token !== this.rhythmToken) return
      const result = detectRhythmFromBuffer(buffer)
      if (result.bpm > 0) {
        this.frame.bpm = result.bpm
        this.patchMeta({ bpm: result.bpm })
      }
    } catch {
      // BPM é um refinamento: o visual continua reagindo por bandas/transientes.
    }
  }

  private onElementError(): void {
    // Ignora erros de src vazio ao limpar assets.
    if (!this.meta.fileName) return
    this.patchMeta({ status: 'error', error: 'Falha ao carregar o áudio. Tente outro arquivo.' })
  }

  /* ---------- transporte ---------- */

  async play(): Promise<void> {
    try {
      // Resume o AudioContext no mesmo gesto do play; sem isso o elemento toca mudo.
      await this.ensureRunning()
      await this.audio.play()
    } catch (error) {
      const name = (error as { name?: string } | undefined)?.name
      if (name === 'NotAllowedError') {
        this.patchMeta({ status: 'paused', error: 'Reprodução bloqueada pelo navegador. Clique em play novamente.' })
      } else {
        this.patchMeta({
          status: 'error',
          error: error instanceof Error ? error.message : 'Não foi possível reproduzir o áudio.',
        })
      }
    }
  }

  pause(): void {
    this.audio.pause()
  }

  /** Tempo atual lido direto do elemento de áudio (não depende do loop de rAF). */
  getCurrentTime(): number {
    return Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0
  }

  seek(seconds: number): void {
    if (!Number.isFinite(seconds)) return
    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : seconds
    this.audio.currentTime = Math.max(0, Math.min(duration - 0.01, seconds))
    this.frame.time = this.audio.currentTime
  }

  setMonitorVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume))
    this.patchMeta({ monitorVolume: v })
    if (this.monitorGain) this.monitorGain.gain.value = v
  }

  /** Reproduz o trecho selecionado e dispara callback ao chegar no fim. */
  playClip(clipStart: number, clipEnd: number, onClipEnd?: () => void): void {
    this.ensureContext()
    this.seek(clipStart)
    this.armedEnd = clipEnd
    this.clipEndFired = false
    this.clipEndCallback = onClipEnd ?? null
    void this.play()
  }

  /** Encerra o trecho armado quando o áudio alcança o fim (chamado por eventos/timer). */
  private checkClipEnd(): void {
    if (this.armedEnd == null) return
    // Não exigir audio.paused === false: no fim natural o elemento já está
    // pausado/ended, e a checagem anterior nunca disparava o callback.
    if (this.audio.currentTime < this.armedEnd - 0.015 && !this.audio.ended) return
    this.pause()
    this.armedEnd = null
    if (this.clipEndFired) return
    this.clipEndFired = true
    const cb = this.clipEndCallback
    this.clipEndCallback = null
    cb?.()
  }

  private clipEndCallback: (() => void) | null = null
  private rhythmToken = 0

  isReady(): boolean {
    return this.meta.status === 'ready' || this.meta.status === 'playing' || this.meta.status === 'paused'
  }

  /* ---------- frame para o visual ---------- */

  getFrame(): AudioFrame {
    return this.frame
  }

  /* ---------- loop de análise ---------- */

  private startLoop(): void {
    const tick = () => {
      this.rafHandle = requestAnimationFrame(tick)
      this.analyze()
    }
    this.rafHandle = requestAnimationFrame(tick)
  }

  private analyze(): void {
    const now = performance.now() / 1000
    const dt = Math.min(0.1, Math.max(0.001, now - this.lastAnalysisTime))
    this.lastAnalysisTime = now

    const time = Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0
    this.frame.time = time
    this.frame.duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0
    this.frame.playing = !this.audio.paused

    this.checkClipEnd()

    if (!this.analyser || !this.frequency || !this.waveform || !this.barRanges || !this.previousFrequency) {
      // Sem áudio: decai tudo suavemente para a cena continuar respirando.
      this.frame.bass = envelope(this.frame.bass, 0, 0.05, 0.25, dt)
      this.frame.mid = envelope(this.frame.mid, 0, 0.05, 0.25, dt)
      this.frame.treble = envelope(this.frame.treble, 0, 0.05, 0.25, dt)
      this.frame.energy = envelope(this.frame.energy, 0, 0.05, 0.3, dt)
      this.frame.transient = Math.max(0, this.frame.transient - dt * 3)
      this.frame.bpm = 0
      this.frame.beatPhase = 0
      this.frame.beatPulse = 0
      for (let i = 0; i < BAR_COUNT; i++) this.barSmoothed[i] = envelope(this.barSmoothed[i], 0, 0.05, 0.2, dt)
      return
    }

    this.analyser.getByteFrequencyData(this.frequency)
    this.analyser.getByteTimeDomainData(this.waveform)

    const sampleRate = this.ctx?.sampleRate ?? 48000
    const bassRaw = averageByteRange(this.frequency, binForFrequency(BANDS.bass[0], sampleRate, FFT_SIZE), binForFrequency(BANDS.bass[1], sampleRate, FFT_SIZE))
    const midRaw = averageByteRange(this.frequency, binForFrequency(BANDS.mid[0], sampleRate, FFT_SIZE), binForFrequency(BANDS.mid[1], sampleRate, FFT_SIZE))
    const trebleRaw = averageByteRange(this.frequency, binForFrequency(BANDS.treble[0], sampleRate, FFT_SIZE), binForFrequency(BANDS.treble[1], sampleRate, FFT_SIZE))

    this.frame.bass = envelope(this.frame.bass, bandCurve(bassRaw), 0.045, 0.22, dt)
    this.frame.mid = envelope(this.frame.mid, bandCurve(midRaw), 0.06, 0.3, dt)
    this.frame.treble = envelope(this.frame.treble, bandCurve(trebleRaw), 0.04, 0.18, dt)

    let rmsSum = 0
    for (let i = 0; i < this.waveform.length; i += 2) {
      const v = (this.waveform[i] - 128) / 128
      rmsSum += v * v
    }
    const rms = Math.sqrt(rmsSum / (this.waveform.length / 2))
    this.frame.energy = envelope(this.frame.energy, Math.min(1, rms * 1.6), 0.08, 0.35, dt)

    // Pulso de batida derivado do BPM (fonte de verdade = tempo do áudio).
    this.updateBeat(time)

    const flux = spectralFlux(this.frequency, this.previousFrequency, binForFrequency(4000, sampleRate, FFT_SIZE))
    if (this.transientDetector.maybeFire(flux, now)) this.frame.transient = 1
    else this.frame.transient = Math.max(0, this.frame.transient - dt * 9)
    this.previousFrequency.set(this.frequency)

    // Barras log-espaçadas com peak + release.
    for (let i = 0; i < BAR_COUNT; i++) {
      const [a, b] = this.barRanges[i]
      const raw = bandCurve(averageByteRange(this.frequency, a, b))
      this.barPeaks[i] = Math.max(raw, this.barPeaks[i] - dt * 0.8)
      const target = Math.max(raw, this.barPeaks[i] * 0.92)
      this.barSmoothed[i] = envelope(this.barSmoothed[i], target, 0.03, 0.14, dt)
    }
  }

  /** Fase e envelope do pulso de batida, sincronizados ao relógio da faixa. */
  private updateBeat(time: number): void {
    const bpm = this.frame.bpm
    if (bpm <= 0) {
      this.frame.beatPhase = 0
      this.frame.beatPulse = 0
      return
    }
    const beats = time * (bpm / 60)
    const phase = beats - Math.floor(beats)
    this.frame.beatPhase = phase
    // Ataque em 1 e queda acentuada: sensação de tempo sem "piscar" a cada quadro.
    this.frame.beatPulse = this.frame.playing ? Math.pow(1 - phase, 5) * (0.55 + this.frame.energy * 0.45) : 0
  }

  /* ---------- limpeza ---------- */

  destroy(): void {
    this.rhythmToken++
    if (this.rafHandle != null) cancelAnimationFrame(this.rafHandle)
    this.rafHandle = null
    if (this.clipTimer != null) window.clearInterval(this.clipTimer)
    this.clipTimer = null
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
    this.sourceNode?.disconnect()
    this.analyser?.disconnect()
    this.monitorGain?.disconnect()
    this.recDest?.disconnect()
    this.sourceNode = null
    this.analyser = null
    this.monitorGain = null
    this.recDest = null
    void this.ctx?.close()
    this.ctx = null
    this.listeners.clear()
  }
}

/** Singleton — um único grafo de áudio por página. */
let singleton: AudioEngine | null = null

export function getAudioEngine(): AudioEngine {
  if (!singleton) singleton = new AudioEngine()
  return singleton
}
