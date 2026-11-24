import { describe, expect, it } from 'vitest'
import {
  FALLBACK_PALETTE,
  darken,
  extractPaletteFromPixels,
  lighten,
  mixHex,
  parseHex,
  relativeLuminance,
  toHex,
  withAlpha,
} from '../features/palette/palette'

/** Cria um buffer RGBA com `count` pixels da cor informada. */
function fill(pixels: number[], rgb: [number, number, number], count: number): void {
  for (let i = 0; i < count; i++) pixels.push(rgb[0], rgb[1], rgb[2], 255)
}

describe('color math', () => {
  it('parseHex aceita 3 e 6 dígitos', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHex('b84dff')).toEqual({ r: 184, g: 77, b: 255 })
    expect(parseHex('nope')).toBeNull()
  })

  it('toHex faz roundtrip', () => {
    expect(toHex({ r: 184, g: 77, b: 255 })).toBe('#b84dff')
  })

  it('mixHex interpola e clampa', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixHex('#000000', '#ffffff', -1)).toBe('#000000')
    expect(mixHex('#000000', '#ffffff', 2)).toBe('#ffffff')
  })

  it('lighten/darken movem na direção certa', () => {
    expect(relativeLuminance(lighten('#404040', 0.5))).toBeGreaterThan(relativeLuminance('#404040'))
    expect(relativeLuminance(darken('#404040', 0.5))).toBeLessThan(relativeLuminance('#404040'))
  })

  it('withAlpha gera rgba com o alfa pedido', () => {
    expect(withAlpha('#b84dff', 0.25)).toBe('rgba(184, 77, 255, 0.25)')
  })
})

describe('extractPaletteFromPixels', () => {
  it('usa a cor dominante como acento e uma cor distante como secundária', () => {
    const pixels: number[] = []
    fill(pixels, [30, 90, 220], 700) // azul dominante
    fill(pixels, [220, 40, 80], 150) // vermelho distante
    fill(pixels, [5, 5, 8], 150) // preto ignorado
    const palette = extractPaletteFromPixels(new Uint8ClampedArray(pixels))

    const accent = parseHex(palette.accent)
    const secondary = parseHex(palette.secondary)
    expect(accent).not.toBeNull()
    expect(secondary).not.toBeNull()
    // acento permanece azulado (canal azul dominante)
    expect(accent!.b).toBeGreaterThan(accent!.r)
    // secundária vem do vermelho, não do azul
    expect(secondary!.r).toBeGreaterThan(secondary!.b)
    expect(palette.glow).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('ignora transparência total', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 0, 0, 255, 0, 10])
    const palette = extractPaletteFromPixels(pixels)
    expect(palette).toEqual(FALLBACK_PALETTE)
  })

  it('capa em preto e branco gera acento com contraste', () => {
    const pixels: number[] = []
    fill(pixels, [120, 120, 120], 400)
    fill(pixels, [240, 240, 240], 100)
    const palette = extractPaletteFromPixels(new Uint8ClampedArray(pixels))
    expect(relativeLuminance(palette.accent)).toBeGreaterThan(0.15)
    expect(palette.secondary).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
