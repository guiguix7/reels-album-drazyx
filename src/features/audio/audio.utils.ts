/**
 * Funções puras de análise de áudio — testáveis sem Web Audio.
 * Todos os valores de saída são normalizados para 0–1 com curvas estáveis.
 */

/** Média normalizada (0–1) de um trecho do espectro em bytes. */
export function averageByteRange(data: Uint8Array, fromIndex: number, toIndex: number): number {
  const start = Math.max(0, Math.min(data.length, Math.ceil(fromIndex)))
  const end = Math.max(start, Math.min(data.length, Math.ceil(toIndex)))
  if (end <= start) return 0
  let sum = 0
  for (let i = start; i < end; i++) sum += data[i]
  return sum / (end - start) / 255
}

/** Índice de bin para uma frequência, dado sampleRate e fftSize. */
export function binForFrequency(frequencyHz: number, sampleRate: number, fftSize: number): number {
  const binHz = sampleRate / fftSize
  return Math.max(0, Math.min(fftSize / 2 - 1, Math.round(frequencyHz / binHz)))
}

/** Faixas de bins log-espaçadas para as barras de espectro. */
export function designLogBars(
  barCount: number,
  minHz: number,
  maxHz: number,
  sampleRate: number,
  fftSize: number,
): Array<[number, number]> {
  const binHz = sampleRate / fftSize
  const minBin = Math.max(1, binForFrequency(minHz, sampleRate, fftSize))
  const maxBin = Math.max(minBin + 1, binForFrequency(maxHz, sampleRate, fftSize))
  const bars: Array<[number, number]> = []
  const logMin = Math.log(minBin)
  const logMax = Math.log(maxBin)
  for (let i = 0; i < barCount; i++) {
    const a = Math.exp(logMin + ((logMax - logMin) * i) / barCount)
    const b = Math.exp(logMin + ((logMax - logMin) * (i + 1)) / barCount)
    bars.push([a, Math.max(a + 0.5, b)])
  }
  void binHz
  return bars
}

/**
 * Envelope assimétrico: sobe rápido (attack), desce suave (release).
 * attack/release em segundos (constante de tempo exponencial).
 */
export function envelope(prev: number, target: number, attack: number, release: number, dt: number): number {
  const clamped = Math.max(0, Math.min(1, target))
  const tau = clamped > prev ? attack : release
  const factor = 1 - Math.exp(-dt / Math.max(1e-4, tau))
  const next = prev + (clamped - prev) * factor
  return Math.max(0, Math.min(1, next))
}

/** Detector de transientes por fluxo espectral, com cooldown fixo. */
export class TransientDetector {
  private fluxHistory: number[] = []
  private readonly window: number
  private readonly cooldownSeconds: number
  private lastFireTime = -Infinity

  constructor(windowSize = 45, cooldownSeconds = 0.16) {
    this.window = Math.max(8, windowSize)
    this.cooldownSeconds = cooldownSeconds
  }

  /** Retorna true quando um transiente deve disparar. */
  maybeFire(flux: number, nowSeconds: number): boolean {
    const history = this.fluxHistory
    let avg = 0
    for (const value of history) avg += value
    avg = history.length > 0 ? avg / history.length : flux

    const threshold = avg * 1.6 + 0.02
    const fired = flux > threshold && nowSeconds - this.lastFireTime >= this.cooldownSeconds
    if (fired) {
      this.lastFireTime = nowSeconds
      history.length = 0
    }
    history.push(flux)
    if (history.length > this.window) history.shift()
    return fired
  }
}

/** Fluxo espectral simples: soma dos aumentos entre frames nas bandas graves/médias. */
export function spectralFlux(current: Uint8Array, previous: Uint8Array, upToBin: number): number {
  let sum = 0
  const limit = Math.min(upToBin, current.length, previous.length)
  for (let i = 1; i < limit; i++) {
    const delta = current[i] - previous[i]
    if (delta > 0) sum += delta
  }
  return sum / (limit * 255)
}

/** Curva de contraste para valores de banda (expande médios). */
export function bandCurve(value: number): number {
  const v = Math.max(0, Math.min(1, value))
  return Math.pow(v, 1.35)
}
