/** Contratos de saída do Audio Engine para consumo do Visual Engine e da UI. */

export const BAR_COUNT = 64

export interface AudioFrame {
  /** Tempo atual da faixa em segundos (fonte de verdade). */
  time: number
  duration: number
  playing: boolean
  /** Bandas normalizadas 0–1 com suavização attack/release. */
  bass: number
  mid: number
  treble: number
  /** Energia média global (RMS-ish) 0–1. */
  energy: number
  /** Envelope de transiente: 1 no disparo, decai rápido. */
  transient: number
  /** BPM estimado da faixa (0 quando não detectado). */
  bpm: number
  /** Fase dentro da batida atual (0–1). Serve para pulsos sincronizados. */
  beatPhase: number
  /** Pulso da batida: 1 no ataque, decai até a próxima (0–1). */
  beatPulse: number
  /** Espectro bruto do analyser (buffer compartilhado; null sem arquivo). */
  frequency: Uint8Array | null
  /** Forma de onda bruta (buffer compartilhado; null sem arquivo). */
  waveform: Uint8Array | null
  /** Barras log-espaçadas normalizadas (64) para UI e templates. */
  bars: Float32Array
}

export type AudioEngineStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

export interface AudioEngineMeta {
  status: AudioEngineStatus
  fileName: string | null
  duration: number
  /** BPM estimado (0 = não detectado). */
  bpm: number
  error: string | null
  monitorVolume: number
  playing: boolean
}
