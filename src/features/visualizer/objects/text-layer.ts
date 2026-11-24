import * as THREE from 'three'
import { onFontsReady } from './fonts-ready'

/**
 * Tipografia renderizada em canvas → CanvasTexture → plano.
 * Todo texto do vídeo é desenhado DENTRO do canvas (entra na gravação).
 */

export type TextFont = 'title' | 'ui'

export interface TextStyle {
  font: TextFont
  weight: number
  /** Tamanho da linha como fração da altura de mundo do bloco. */
  sizeFrac: number
  color: string
  /** Tracking em px no canvas. */
  tracking: number
  align: 'left' | 'center' | 'right'
  /** Âncora da malha: 'center' (padrão) posiciona pelo centro; 'topLeft' pelo canto superior esquerdo. */
  anchor?: 'topLeft' | 'center'
  lineHeight: number
  uppercase?: boolean
  /** Quebra por palavras quando a linha excede a largura (títulos longos legíveis). */
  wrap?: boolean
  /** Fundo tipo "painel de card" (para os templates T3/T4/T5). */
  panel?: {
    fill: string
    border?: string
    padFrac?: number
  }
  /** Faixas de texto com cores diferentes por linha (ex.: título em destaque). */
  lineColors?: string[]
}

export interface TextLayerOptions {
  /** Resolução de desenho por unidade de mundo (nitidez). */
  pxPerUnit?: number
}

const FAMILY: Record<TextFont, string> = {
  title: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
  ui: '"Inter", "Segoe UI", system-ui, sans-serif',
}

/** Desenha texto com tracking manual e wrap; retorna canvas + métricas. */
export function drawTextCanvas(lines: string[], style: TextStyle, canvasPxWidth: number): HTMLCanvasElement {
  const fontStack = FAMILY[style.font]
  const canvas = document.createElement('canvas')
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) return canvas

  const drawLine = (ctx: CanvasRenderingContext2D, text: string, sizePx: number): number => {
    ctx.font = `${style.weight} ${sizePx}px ${fontStack}`
    let width = 0
    for (const char of text) width += ctx.measureText(char).width + style.tracking
    return Math.max(0, width - style.tracking)
  }

  const baseSize = canvasPxWidth * style.sizeFrac
  const wrapped: string[] = []
  let chosenSize = baseSize

  /** Divide a linha em palavras que caibam na largura, mantendo o tamanho pedido. */
  const wrapWords = (text: string, size: number): string[] | null => {
    const parts: string[] = []
    let current = ''
    for (const word of text.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word
      if (drawLine(measure, candidate, size) <= canvasPxWidth) {
        current = candidate
      } else {
        if (current) parts.push(current)
        current = word
      }
    }
    if (current) parts.push(current)
    return parts.length > 1 ? parts : null
  }

  for (const raw of lines) {
    const text = style.uppercase ? raw.toUpperCase() : raw
    let lineWidth = drawLine(measure, text, baseSize)
    if (lineWidth > canvasPxWidth) {
      // Com wrap opt-in, mantém o tamanho e usa mais linhas (legibilidade em 9:16).
      const parts = style.wrap ? wrapWords(text, baseSize) : null
      if (parts) {
        for (const part of parts) wrapped.push(part)
        continue
      }
      // Sem wrap: reduz a fonte até caber (mínimo 55% do tamanho pedido) — nunca corta texto.
      let size = baseSize
      while (size > baseSize * 0.55 && lineWidth > canvasPxWidth) {
        size *= 0.94
        lineWidth = drawLine(measure, text, size)
      }
      chosenSize = Math.min(chosenSize, size)
    }
    wrapped.push(text)
  }

  const lineHeightPx = chosenSize * style.lineHeight
  const padFrac = style.panel?.padFrac ?? 0
  const padX = canvasPxWidth * padFrac
  const padY = padX
  canvas.width = Math.max(2, Math.ceil(canvasPxWidth + padX * 2))
  canvas.height = Math.max(2, Math.ceil(lineHeightPx * wrapped.length + padY * 2 + chosenSize * 0.35))
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  if (style.panel) {
    ctx.fillStyle = style.panel.fill
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (style.panel.border) {
      ctx.strokeStyle = style.panel.border
      ctx.lineWidth = Math.max(1, canvasPxWidth * 0.006)
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, canvas.width - ctx.lineWidth, canvas.height - ctx.lineWidth)
    }
  }

  ctx.font = `${style.weight} ${chosenSize}px ${fontStack}`
  ctx.textBaseline = 'top'
  wrapped.forEach((text, index) => {
    const color = style.lineColors?.[index] ?? style.color
    ctx.fillStyle = color
    const y = padY + index * lineHeightPx
    let width = 0
    for (const char of text) width += ctx.measureText(char).width + style.tracking
    width = Math.max(0, width - style.tracking)
    let x: number
    if (style.align === 'center') x = (canvas.width - width) / 2
    else if (style.align === 'right') x = canvas.width - padX - width
    else x = padX
    for (const char of text) {
      ctx.fillText(char, x, y)
      x += ctx.measureText(char).width + style.tracking
    }
  })

  return canvas
}

/**
 * Camada de texto no Stage. setText redesenha somente quando o conteúdo muda
 * (cache por chave) e acompanha fontes web (redesenha quando prontas).
 */
export class TextLayer {
  readonly mesh: THREE.Mesh
  private material: THREE.MeshBasicMaterial
  private texture: THREE.CanvasTexture | null = null
  private lastKey = ''
  private worldWidth = 1
  private worldHeight = 1
  private lines: string[] = []
  private style: TextStyle
  private pxPerUnit: number
  private unsubscribeFonts: () => void

  constructor(style: TextStyle, options: TextLayerOptions = {}) {
    this.style = style
    this.pxPerUnit = options.pxPerUnit ?? 180
    const geometry = new THREE.PlaneGeometry(1, 1)
    // Âncora topLeft: desloca a origem da malha para o canto superior esquerdo,
    // preservando o dimensionamento via scale (w, h) aplicado no redraw.
    if (style.anchor === 'topLeft') geometry.translate(0.5, -0.5, 0)
    this.material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 30
    this.unsubscribeFonts = onFontsReady(() => this.invalidate())
  }

  /** Define o texto (linhas) e a largura em unidades de mundo. Retorna altura de mundo. */
  set(lines: string[], worldWidth: number, stylePatch: Partial<TextStyle> = {}): number {
    this.lines = lines
    this.worldWidth = worldWidth
    this.style = { ...this.style, ...stylePatch }
    this.redraw()
    return this.worldHeight
  }

  setOpacity(opacity: number): void {
    this.material.opacity = Math.max(0, Math.min(1, opacity))
    this.mesh.visible = this.material.opacity > 0.01
  }

  invalidate(): void {
    this.lastKey = ''
    if (this.lines.length > 0) this.redraw()
  }

  private redraw(): void {
    const style = this.style
    const key = JSON.stringify([this.lines, style, this.worldWidth])
    if (key === this.lastKey) return
    this.lastKey = key

    const canvasPxWidth = Math.round(this.worldWidth * this.pxPerUnit)
    const canvas = drawTextCanvas(this.lines, style, canvasPxWidth)
    if (this.texture) this.texture.dispose()
    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.minFilter = THREE.LinearFilter
    this.texture.generateMipmaps = false
    this.material.map = this.texture
    this.material.needsUpdate = true

    const aspect = canvas.height / Math.max(1, canvas.width)
    this.worldHeight = this.worldWidth * aspect
    this.mesh.scale.set(this.worldWidth, this.worldHeight, 1)
  }

  dispose(): void {
    this.unsubscribeFonts()
    this.texture?.dispose()
    this.mesh.geometry.dispose()
    this.material.dispose()
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh)
  }
}
