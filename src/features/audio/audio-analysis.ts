/** Pipeline compartilhado de análise local de áudio.

 * Antes de cada mudança, o mesmo arquivo local era decodificado duas vezes:
 *   - AudioEngine.detectRhythm() fazia fetch + decodeAudioData para o BPM
 *   - waveform.loadWaveformPeaks() criava seu próprio AudioContext e decodificava
 *     novamente para os picos da waveform
 *
 * Agora existe um cache por URL que decodifica uma vez, produz os dois resultados
 * compactos (picos + ritmo) e libera o PCM completo o mais breve possível.
 */

import { computeWaveformPeaks } from './waveform'
import { detectRhythmFromBuffer } from './rhythm'

interface CachedAnalysis {
  peaks: number[]
  rhythm: ReturnType<typeof detectRhythmFromBuffer>
}

const cache = new Map<string, CachedAnalysis>()
const decoding = new Set<string>()

function keyFor(url: string, buckets: number): string {
  return `${url}|${buckets}`
}

/** Carrega a waveform do áudio local a partir do cache compartilhado.
 * Mantém a assinatura existente para não quebrar o WaveformTimeline.
 */
export async function loadWaveformPeaks(
  url: string,
  buckets = 120,
): Promise<number[]> {
  const cacheKey = keyFor(url, buckets)
  const cached = cache.get(cacheKey)
  if (cached) return cached.peaks

  if (decoding.has(cacheKey)) {
    // Outra chamada já decodificando o mesmo arquivo: espera o resultado.
    return await waitForDecoding(cacheKey, buckets)
  }

  decoding.add(cacheKey)
  try {
    const analysis = await decodeAndAnalyze(url, buckets)
    cache.set(cacheKey, analysis)
    return analysis.peaks
  } finally {
    decoding.delete(cacheKey)
  }
}

/** Análise de ritmo a partir do mesmo arquivo/decode usado pela waveform.
 * AudioEngine deve preferir esta função em vez de decodificar novamente.
 */
export async function analyzeLocalRhythm(
  url: string,
  maxSeconds = 45,
): Promise<ReturnType<typeof detectRhythmFromBuffer>> {
  // O ritmo depende do mesmo decode; vamos à análise compartilhada.
  const peaks = await loadWaveformPeaks(url, 120)
  const cached = Array.from(cache.values()).find((entry) => entry.peaks === peaks)
  if (cached && cached.rhythm) return cached.rhythm

  // Fallback: se ainda não estiver no cache (race ou buckets diferentes),
  // decodifica agora e junta o ritmo ao cache compartilhado quando possível.
  const response = await fetch(url)
  if (!response.ok) throw new Error('Não foi possível ler o áudio para analisar o ritmo.')
  const data = await response.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const buffer = await ctx.decodeAudioData(data)
    const rhythm = detectRhythmFromBuffer(buffer, maxSeconds)
    // Tenta juntar ao cache compartilhado quando o buckets=120 corresponder.
    const cacheKey = keyFor(url, 120)
    const existing = cache.get(cacheKey)
    if (existing) {
      cache.set(cacheKey, { peaks: existing.peaks, rhythm })
    }
    return rhythm
  } finally {
    void ctx.close()
  }
}

/** Invalida a análise em cache para um URL (quando o áudio é trocado/removido). */
export function invalidateAnalysis(url: string): void {
  for (const cacheKey of cache.keys()) {
    if (cacheKey.startsWith(url + '|')) cache.delete(cacheKey)
  }
}

function waitForDecoding(cacheKey: string, buckets: number): Promise<number[]> {
  return new Promise((resolve) => {
    const check = (): void => {
      const cached = cache.get(cacheKey)
      if (cached) {
        resolve(cached.peaks)
        return
      }
      const stillDecoding = decoding.has(cacheKey)
      if (!stillDecoding) {
        // A decodificação cancelou/falhou antes de populá-lo.
        resolve(new Array(buckets).fill(0))
        return
      }
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

async function decodeAndAnalyze(url: string, buckets: number): Promise<CachedAnalysis> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Não foi possível ler o áudio para análise local.')
  const data = await response.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const buffer = await ctx.decodeAudioData(data)
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index))
    const peaks = computeWaveformPeaks(channels, buffer.sampleRate, buckets)
    const rhythm = detectRhythmFromBuffer(buffer)
    // PCM liberado aqui: mantemos apenas os resultados compactos.
    return { peaks, rhythm }
  } finally {
    void ctx.close()
  }
}
