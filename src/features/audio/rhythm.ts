/**
 * Análise de ritmo: envelope de onsets + estimativa de BPM por autocorrelação.
 * Funções puras (testáveis); a decodificação do arquivo fica no AudioEngine.
 */

export interface RhythmResult {
  /** BPM arredondado; 0 quando não há confiança suficiente. */
  bpm: number
  confidence: number
}

/** Passo da análise em segundos — 100 Hz é suficiente para onsets e é rápido. */
const ANALYSIS_RATE = 100

/**
 * RMS por janela + fluxo positivo (energy[i] - energy[i-1]).
 * O resultado é normalizado 0–1 e representa "quanto soou" em cada instante.
 */
export function computeOnsetEnvelope(samples: Float32Array, sampleRate: number, ratePerSecond = ANALYSIS_RATE): Float32Array {
  const hop = Math.max(1, Math.round(sampleRate / ratePerSecond))
  const frames = Math.floor(samples.length / hop)
  if (frames <= 1) return new Float32Array(0)

  const energy = new Float32Array(frames)
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0
    const start = frame * hop
    for (let i = 0; i < hop; i++) {
      const v = samples[start + i]
      sum += v * v
    }
    energy[frame] = Math.sqrt(sum / hop)
  }

  const envelope = new Float32Array(frames)
  for (let i = 1; i < frames; i++) {
    envelope[i] = Math.max(0, energy[i] - energy[i - 1])
  }

  let peak = 0
  for (let i = 0; i < frames; i++) if (envelope[i] > peak) peak = envelope[i]
  if (peak > 0) for (let i = 0; i < frames; i++) envelope[i] /= peak
  return envelope
}

/**
 * Estima o BPM (60–180) pela autocorrelação do envelope de onsets.
 * Retorna bpm=0 quando o sinal é fraco/constante.
 */
export function estimateTempo(envelope: Float32Array, ratePerSecond = ANALYSIS_RATE): RhythmResult {
  const frames = envelope.length
  if (frames < ratePerSecond * 3) return { bpm: 0, confidence: 0 }

  let mean = 0
  for (let i = 0; i < frames; i++) mean += envelope[i]
  mean /= frames
  if (mean <= 1e-5) return { bpm: 0, confidence: 0 }

  let bestBpm = 0
  let bestScore = 0
  let bestRaw = 0

  // Prior log-normal centrado em ~110 BPM: evita escolher metade/dobro do tempo
  // real (autocorrelação é ambígua em múltiplos do período).
  const prior = (bpm: number): number => Math.exp(-0.5 * Math.pow(Math.log2(bpm / 110) / 0.8, 2))

  for (let bpm = 60; bpm <= 180; bpm += 0.5) {
    const lag = Math.max(1, Math.round((60 * ratePerSecond) / bpm))
    if (lag >= frames) continue
    let score = 0
    let counted = 0
    for (let i = 0; i + lag < frames; i++) {
      score += envelope[i] * envelope[i + lag]
      counted++
    }
    if (counted === 0) continue
    score /= counted
    const weighted = score * prior(bpm)
    if (weighted > bestScore) {
      bestScore = weighted
      bestRaw = score
      bestBpm = bpm
    }
  }

  if (bestBpm === 0) return { bpm: 0, confidence: 0 }

  // Confiança relativa: quanto o pico supera a média dos escores próximos.
  let neighborSum = 0
  let neighborCount = 0
  for (let bpm = 60; bpm <= 180; bpm += 2) {
    if (Math.abs(bpm - bestBpm) < 6) continue
    const lag = Math.max(1, Math.round((60 * ratePerSecond) / bpm))
    if (lag >= frames) continue
    let score = 0
    let counted = 0
    for (let i = 0; i + lag < frames; i++) {
      score += envelope[i] * envelope[i + lag]
      counted++
    }
    if (counted > 0) {
      neighborSum += score / counted
      neighborCount++
    }
  }

  const neighborMean = neighborCount > 0 ? neighborSum / neighborCount : 0
  const confidence = bestRaw / (bestRaw + neighborMean * 2 + 1e-6)

  // Abaixo disso o palpite não se sustenta: melhor manter pulso por transiente.
  if (confidence < 0.12) return { bpm: 0, confidence }

  return { bpm: Math.round(bestBpm), confidence }
}

/**
 * Analisa um AudioBuffer já decodificado (primeiros segundos, canal mixado).
 * O buffer original não é retido — liberado após a análise.
 */
export function detectRhythmFromBuffer(buffer: AudioBuffer, maxSeconds = 45): RhythmResult & { envelopeRate: number } {
  const sampleRate = buffer.sampleRate
  const frames = Math.min(buffer.length, Math.max(1, Math.floor(sampleRate * maxSeconds)))
  const channels = Math.min(2, buffer.numberOfChannels)
  const mono = new Float32Array(frames)

  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < frames; i++) mono[i] += data[i] / channels
  }

  const envelope = computeOnsetEnvelope(mono, sampleRate)
  const tempo = estimateTempo(envelope)
  return { ...tempo, envelopeRate: ANALYSIS_RATE }
}
