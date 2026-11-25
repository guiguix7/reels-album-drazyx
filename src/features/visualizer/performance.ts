/**
 * Controle de performance do Stage: mede o frame budget e reduz a resolução
 * interna do preview quando o hardware não sustenta. O export sempre roda em
 * resolução cheia (o recorder captura o canvas do Stage).
 */

export type RenderProfileId = 'draft' | 'standard' | 'export' | 'lightweight'

export interface RenderProfile {
  id: RenderProfileId
  label: string
  description: string
  /** Escala máxima de renderização do preview (1 = resolução de saída). */
  maxScale: number
  /** Escala mínima antes de desistir de reduzir. */
  minScale: number
}

export const RENDER_PROFILES: Record<RenderProfileId, RenderProfile> = {
  draft: {
    id: 'draft',
    label: 'Rascunho',
    description: 'Preview rápido em escala reduzida para ajustar composição.',
    maxScale: 0.6,
    minScale: 0.4,
  },
  standard: {
    id: 'standard',
    label: 'Padrão',
    description: 'Preview adaptativo: cai de resolução só se o frame budget estourar.',
    maxScale: 1,
    minScale: 0.55,
  },
  export: {
    id: 'export',
    label: 'Export',
    description: 'Resolução cheia, sem adaptação, durante a gravação.',
    maxScale: 1,
    minScale: 1,
  },
  lightweight: {
    id: 'lightweight',
    label: 'Leve',
    description: 'Para máquinas modestas: preview menor e menos pressão na GPU.',
    maxScale: 0.75,
    minScale: 0.5,
  },
}

/** Média móvel de duração de frame (ms). */
export class FrameBudgetMonitor {
  private samples: number[] = []
  private readonly windowSize: number

  constructor(windowSize = 90) {
    this.windowSize = Math.max(4, windowSize)
  }

  push(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return
    this.samples.push(Math.min(0.25, deltaSeconds) * 1000)
    if (this.samples.length > this.windowSize) this.samples.shift()
  }

  get averageMs(): number {
    if (!this.samples.length) return 0
    return this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length
  }

  get fps(): number {
    const average = this.averageMs
    return average > 0 ? 1000 / average : 0
  }

  get filled(): boolean {
    return this.samples.length >= this.windowSize
  }

  reset(): void {
    this.samples = []
  }
}

export interface AdaptiveResolutionOptions {
  minScale?: number
  maxScale?: number
  step?: number
  downshiftMs?: number
  upshiftMs?: number
  windowSize?: number
  cooldownSeconds?: number
}

/**
 * Decide a escala de renderização do preview. Determinístico e testável:
 * reduz quando a média sustentada passa do orçamento e recupera quando sobra folga,
 * sempre respeitando cooldown para não oscilar.
 */
export class AdaptiveResolution {
  readonly monitor: FrameBudgetMonitor
  private readonly minScale: number
  private readonly maxScale: number
  private readonly step: number
  private readonly downshiftMs: number
  private readonly upshiftMs: number
  private readonly cooldownSeconds: number
  private currentScale: number
  private cooldown = 0

  constructor(options: AdaptiveResolutionOptions = {}) {
    this.minScale = options.minScale ?? 0.55
    this.maxScale = options.maxScale ?? 1
    this.step = options.step ?? 0.15
    this.downshiftMs = options.downshiftMs ?? 26
    this.upshiftMs = options.upshiftMs ?? 18
    this.cooldownSeconds = options.cooldownSeconds ?? 1.5
    this.monitor = new FrameBudgetMonitor(options.windowSize ?? 90)
    this.currentScale = this.maxScale
  }

  get scale(): number {
    return this.currentScale
  }

  setScale(scale: number): void {
    this.currentScale = Math.min(this.maxScale, Math.max(this.minScale, scale))
    this.cooldown = 0
    this.monitor.reset()
  }

  /** Alimenta o monitor e devolve a escala que deve ser aplicada agora. */
  push(deltaSeconds: number): number {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds)
    this.monitor.push(deltaSeconds)
    if (this.cooldown > 0 || !this.monitor.filled) return this.currentScale

    const average = this.monitor.averageMs
    let next = this.currentScale
    if (average > this.downshiftMs && this.currentScale > this.minScale) {
      next = Math.max(this.minScale, this.currentScale - this.step)
    } else if (average < this.upshiftMs && this.currentScale < this.maxScale) {
      next = Math.min(this.maxScale, this.currentScale + this.step)
    }
    if (next !== this.currentScale) {
      this.currentScale = next
      this.cooldown = this.cooldownSeconds
      this.monitor.reset()
    }
    return this.currentScale
  }

  reset(): void {
    this.currentScale = this.maxScale
    this.cooldown = 0
    this.monitor.reset()
  }
}
