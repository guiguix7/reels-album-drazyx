/**
 * Paleta do visual: extração de cores dominantes da capa + utilitários de cor.
 * Funções puras (testáveis sem DOM); o carregamento da imagem fica no final.
 */

import type { CoverPalette } from '../project/project.types'

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Fallback alinhado à identidade Drazyx quando não há cor aproveitável. */
export const FALLBACK_PALETTE: CoverPalette = {
  accent: '#b84dff',
  secondary: '#6b4a9f',
  glow: '#cf8aff',
}

export function parseHex(hex: string): Rgb | null {
  const value = hex.trim().replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

/** Interpola duas cores hex (t=0 → a, t=1 → b). */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a)
  const cb = parseHex(b)
  if (!ca || !cb) return a
  const k = Math.max(0, Math.min(1, t))
  return toHex({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
  })
}

export function lighten(hex: string, amount: number): string {
  return mixHex(hex, '#ffffff', amount)
}

export function darken(hex: string, amount: number): string {
  return mixHex(hex, '#000000', amount)
}

/** Converte para rgba() com alfa — usado em bordas/painéis dentro do Stage. */
export function withAlpha(hex: string, alpha: number): string {
  const c = parseHex(hex)
  if (!c) return hex
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, Math.min(1, alpha))})`
}

export function relativeLuminance(hex: string): number {
  const c = parseHex(hex)
  if (!c) return 0
  const channel = (v: number): number => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
}

function hueOf(r: number, g: number, b: number, max: number, min: number): number {
  const delta = max - min
  if (delta === 0) return 0
  let hue: number
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  hue *= 60
  return hue < 0 ? hue + 360 : hue
}

interface Bucket {
  weight: number
  r: number
  g: number
  b: number
}

const HUE_BUCKETS = 12

/**
 * Extrai 3 cores da capa: acento vibrante, secundária e brilho.
 * Ignora transparência, quase-preto e quase-branco; prioriza saturação média/alta.
 */
export function extractPaletteFromPixels(pixels: Uint8ClampedArray): CoverPalette {
  const buckets: Bucket[] = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }))
  let avgR = 0
  let avgG = 0
  let avgB = 0
  let avgWeight = 0
  let opaque = 0

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue
    opaque++
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const value = max / 255
    const saturation = max === 0 ? 0 : (max - min) / max

    avgR += r * value
    avgG += g * value
    avgB += b * value
    avgWeight += value

    // Pretos, brancos e cinzas não definem a paleta do vídeo.
    if (value < 0.1 || value > 0.97 || saturation < 0.18) continue

    const hue = hueOf(r, g, b, max, min)
    const index = Math.min(HUE_BUCKETS - 1, Math.floor(hue / (360 / HUE_BUCKETS)))
    const weight = saturation * (0.35 + value * 0.65)
    const bucket = buckets[index]
    bucket.weight += weight
    bucket.r += r * weight
    bucket.g += g * weight
    bucket.b += b * weight
  }

  if (opaque === 0) return FALLBACK_PALETTE

  const ranked = buckets
    .map((bucket, index) => ({ bucket, index }))
    .filter((entry) => entry.bucket.weight > 0)
    .sort((a, b) => b.bucket.weight - a.bucket.weight)

  if (ranked.length === 0) {
    // Capa sem cor aproveitável (P&B): usa o cinza médio, clareado para contraste.
    const total = Math.max(1e-6, avgWeight)
    const gray = toHex({ r: avgR / total, g: avgG / total, b: avgB / total })
    const accent = lighten(gray, 0.55)
    return {
      accent,
      secondary: mixHex(accent, '#2b2440', 0.55),
      glow: lighten(accent, 0.35),
    }
  }

  const dominant = ranked[0].bucket
  const dominantIndex = ranked[0].index
  const rawAccent = toHex({
    r: dominant.r / dominant.weight,
    g: dominant.g / dominant.weight,
    b: dominant.b / dominant.weight,
  })

  // Garante contraste sobre o fundo escuro sem estourar para branco.
  const luminance = relativeLuminance(rawAccent)
  const accent = luminance < 0.16 ? lighten(rawAccent, 0.3) : luminance > 0.82 ? darken(rawAccent, 0.28) : rawAccent

  const hueGap = (a: number, b: number): number => {
    const diff = Math.abs(a - b) % 360
    return diff > 180 ? 360 - diff : diff
  }

  const bucketDegrees = 360 / HUE_BUCKETS
  const secondaryEntry = ranked
    .slice(1)
    .find(
      (entry) =>
        hueGap(entry.index * bucketDegrees, dominantIndex * bucketDegrees) >= 60 &&
        entry.bucket.weight >= ranked[0].bucket.weight * 0.12,
    )

  const secondary = secondaryEntry
    ? (() => {
        const bucket = secondaryEntry.bucket
        const color = toHex({ r: bucket.r / bucket.weight, g: bucket.g / bucket.weight, b: bucket.b / bucket.weight })
        // A secundária não compete com o acento: escurece um pouco.
        return darken(color, 0.18)
      })()
    : mixHex(accent, '#2b2440', 0.55)

  return { accent, secondary, glow: lighten(accent, 0.45) }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível ler a capa.'))
    image.src = url
  })
}

/** Lê a capa em baixa resolução e devolve a paleta extraída. */
export async function extractPaletteFromUrl(url: string): Promise<CoverPalette> {
  const image = await loadImage(url)
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return FALLBACK_PALETTE
  context.drawImage(image, 0, 0, size, size)
  return extractPaletteFromPixels(context.getImageData(0, 0, size, size).data)
}
