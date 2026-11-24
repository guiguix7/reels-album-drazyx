/** Utilidades de movimento para templates (easings e fades por progresso do trecho). */

export function fadeIn(progress: number, start: number, end: number): number {
  if (progress <= start) return 0
  if (progress >= end) return 1
  return (progress - start) / (end - start)
}

export function fadeOut(progress: number, start: number, end: number): number {
  if (progress <= start) return 1
  if (progress >= end) return 0
  return 1 - (progress - start) / (end - start)
}

export function easeOutCubic(x: number): number {
  const t = Math.max(0, Math.min(1, x))
  return 1 - Math.pow(1 - t, 3)
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/** Zonas seguras para vídeo vertical (plataformas cobrem bordas). */
export interface SafeArea {
  topY: number
  bottomY: number
  leftX: number
  rightX: number
  width: number
  height: number
}

export function safeArea(viewWidth: number, viewHeight: number): SafeArea {
  // Margens laterais generosas: cobrem o drift de câmera dos templates e as
  // zonas cobertas pela UI das plataformas (Reels/Shorts/TikTok).
  return {
    width: viewWidth,
    height: viewHeight,
    topY: viewHeight / 2 - viewHeight * 0.08,
    bottomY: -viewHeight / 2 + viewHeight * 0.16,
    leftX: -viewWidth / 2 + viewWidth * 0.09,
    rightX: viewWidth / 2 - viewWidth * 0.09,
  }
}
