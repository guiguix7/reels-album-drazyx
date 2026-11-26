export const DEFAULT_WAVEFORM_BUCKETS = 120

/**
 * Reduz amostras PCM a picos normalizados. Testável sem AudioContext; usado
 * somente no navegador para desenhar a waveform do áudio local.
 */
export function computeWaveformPeaks(
  channels: Float32Array[],
  sampleRate: number,
  buckets = DEFAULT_WAVEFORM_BUCKETS,
): number[] {
  const length = channels[0]?.length ?? 0
  if (length <= 1 || buckets <= 0 || sampleRate <= 0) return new Array(Math.max(0, buckets)).fill(0)
  const block = Math.max(1, Math.floor(length / buckets))
  const raw: number[] = []
  for (let bucket = 0; bucket < buckets; bucket += 1) {
    const from = bucket * block
    const to = Math.min(length, from + block)
    let sum = 0
    let count = 0
    // Amostrar no máximo 512 pontos por bucket: evita varrer minutos de áudio
    // várias vezes só para desenhar a interface.
    const stride = Math.max(1, Math.floor((to - from) / 512))
    for (let i = from; i < to; i += stride) {
      for (const channel of channels) {
        const value = channel[i] ?? 0
        sum += value * value
      }
      count += 1
    }
    raw.push(count > 0 ? Math.sqrt(sum / count) : 0)
  }
  const max = raw.reduce((acc, value) => Math.max(acc, value), 0)
  return max > 0 ? raw.map((value) => Math.sqrt(value / max)) : raw.map(() => 0)
}

import { loadWaveformPeaks as loadWaveformPeaksShared } from './audio-analysis'

/** Decodifica o object URL local e devolve picos; o resultado fica em cache por URL.
 * A partir de agora usa o cache compartilhado de análise local (audio-analysis.ts),
 * que decodifica o mesmo arquivo uma única vez e serve também o ritmo." */
export async function loadWaveformPeaks(
  url: string,
  buckets = DEFAULT_WAVEFORM_BUCKETS,
): Promise<number[]> {
  return loadWaveformPeaksShared(url, buckets)
}
