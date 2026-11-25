import type { VisualEngine } from './VisualEngine'

/**
 * Referência do Stage ativo para quem grava (fora da árvore do Stage).
 * Mantém Stage e Recorder desacoplados sem duplicar o engine.
 */
let current: VisualEngine | null = null

export function setVisualEngine(engine: VisualEngine | null): void {
  current = engine
}

export function getVisualEngine(): VisualEngine | null {
  return current
}

/** Antes de capturar: resolução cheia e adaptação desligada. */
export function beginVisualExport(): void {
  current?.beginExport()
}

/** Depois de capturar: volta ao preview adaptativo. */
export function endVisualExport(): void {
  current?.endExport()
}
