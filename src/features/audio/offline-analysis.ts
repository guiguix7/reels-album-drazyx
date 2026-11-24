/**
 * Análise offline do trecho selecionado. Lê o arquivo local já carregado
 * (object URL) e extrai envelope de energia, onsets e pico real para o
 * auto storyboard — sem inventar eventos musicais.
 */

export interface AnalysisEvent {
  /** Tempo absoluto dentro da faixa (segundos). */
  time: number
  /** Força relativa do evento (0–1). */
  strength: number
}

export interface ClipAnalysis {
  duration: number
  /** Energia RMS normalizada por janela de 0,1 s. */
  energy: number[]
  events: AnalysisEvent[]
  peakTime: number
  onsetTime: number
}

const WINDOW_SECONDS = 0.1
const ONSET_THRESHOLD = 0.08
const ONSET_COOLDOWN_SECONDS = 1.2

/** Analisa amostras PCM puras (testável sem AudioContext). */
export function analyzeSamples(
  channels: Float32Array[],
  sampleRate: number,
  start: number,
  duration: number,
): ClipAnalysis {
  const startSample = Math.max(0, Math.floor(start * sampleRate))
  const available = channels[0]?.length ?? 0
  const requested = Math.max(0, Math.floor(duration * sampleRate))
  const endSample = Math.min(available, startSample + requested)
  const windowSize = Math.max(1, Math.round(sampleRate * WINDOW_SECONDS))
  const count = Math.max(0, Math.floor((endSample - startSample) / windowSize))

  const raw: number[] = []
  for (let w = 0; w < count; w += 1) {
    const from = startSample + w * windowSize
    const to = from + windowSize
    let sum = 0
    for (const channel of channels) {
      for (let i = from; i < to; i += 1) sum += channel[i] * channel[i]
    }
    raw.push(Math.sqrt(sum / (windowSize * Math.max(1, channels.length))))
  }

  const max = raw.reduce((acc, value) => Math.max(acc, value), 0)
  const energy = max > 0 ? raw.map((value) => value / max) : raw.map(() => 0)

  const events: AnalysisEvent[] = []
  let lastEventTime = -Infinity
  for (let i = 1; i < energy.length; i += 1) {
    const flux = energy[i] - energy[i - 1]
    const time = start + (i + 0.5) * WINDOW_SECONDS
    if (flux >= ONSET_THRESHOLD && time - lastEventTime >= ONSET_COOLDOWN_SECONDS) {
      events.push({ time, strength: Math.min(1, flux / 0.3) })
      lastEventTime = time
    }
  }

  let peakIndex = 0
  for (let i = 1; i < energy.length; i += 1) if (energy[i] > energy[peakIndex]) peakIndex = i

  const peakTime = energy.length ? start + (peakIndex + 0.5) * WINDOW_SECONDS : start
  const onsetTime = events[0]?.time ?? start + 0.5

  return {
    duration: Math.max(0, endSample - startSample) / sampleRate,
    energy,
    events,
    peakTime,
    onsetTime,
  }
}

/** Decodifica o áudio local e analisa o trecho pedido. */
export async function analyzeClipAudio(url: string, start: number, duration: number): Promise<ClipAnalysis> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Não foi possível ler o áudio para análise.')
  const data = await response.arrayBuffer()

  const context = new AudioContext()
  try {
    const buffer = await context.decodeAudioData(data)
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index))
    const length = Math.max(0, Math.min(duration, buffer.duration - start))
    return analyzeSamples(channels, buffer.sampleRate, start, length)
  } catch {
    throw new Error('Formato de áudio não suportado para análise automática.')
  } finally {
    void context.close()
  }
}
