/** Modos de composição: o mesmo template não deve ser apenas redimensionado. */
export type FormatMode = 'portrait' | 'square' | 'landscape'

export function getFormatMode(viewWidth: number, viewHeight: number): FormatMode {
  const ratio = viewWidth / Math.max(1, viewHeight)
  if (ratio < 0.8) return 'portrait'
  if (ratio > 1.2) return 'landscape'
  return 'square'
}

/** Respiro seguro para a capa em cada formato, sempre limitado pela altura. */
export function coverSide(
  viewWidth: number,
  viewHeight: number,
  mode: FormatMode,
  portrait = 0.62,
  square = 0.5,
  landscape = 0.46,
): number {
  if (mode === 'landscape') return Math.min(viewWidth * landscape, viewHeight * 0.52)
  if (mode === 'square') return Math.min(viewWidth * square, viewHeight * 0.5)
  return Math.min(viewWidth * portrait, viewHeight * 0.48)
}
