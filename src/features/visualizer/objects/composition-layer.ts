import * as THREE from 'three'
import type { CompositionElement } from '../../project/project.types'
import type { StageAssets, TemplateUpdateArgs } from '../visual.types'
import { CoverCard } from './cover-card'
import { TextLayer } from './text-layer'
import { WaveformLine } from './waveform-line'

interface RenderedElement {
  element: CompositionElement
  group: THREE.Group
  baseX: number
  baseY: number
  text?: TextLayer
  textLines?: string[]
  cover?: CoverCard
  fill?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  wave?: WaveformLine
      player?: {
    fill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    track: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    progressLeft: number
    progressWidth: number
    timeLabel: TextLayer
    lastSecond: number
    cover?: CoverCard
    title?: TextLayer
    timeLabelLines?: string[]
    titleLines?: string[]
  }
  materials: THREE.Material[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

function elementKey(element: CompositionElement): string {
  return `${element.type}:${element.id}`
}

/** Mudanças que exigem recriação do item (tipo/conteúdo/estrutura/dimensões do mundo). */
function needsRecreate(prev: CompositionElement, next: CompositionElement): boolean {
  if (prev.type !== next.type) return true
  if (prev.width !== next.width || prev.height !== next.height) return true
  if (prev.text !== next.text) return true
  if (prev.color !== next.color) return true
  if (prev.font !== next.font) return true
  if (prev.weight !== next.weight) return true
  if (prev.tracking !== next.tracking) return true
  if (prev.align !== next.align) return true
  if (prev.fontSize !== next.fontSize) return true
  if (prev.align !== next.align) return true
  return false
}

/** Reconstrói a cena a partir do início (uso para mudanças estruturais reais). */
function rebuildItems(
  items: RenderedElement[],
  elements: CompositionElement[],
  assets: StageAssets,
  viewWidth: number,
  viewHeight: number,
): RenderedElement[] {
  const byKey = new Map(items.map((item) => [elementKey(item.element), item]))
  const next: RenderedElement[] = []
  for (const element of elements) {
    if (!element.visible) continue
    const existing = byKey.get(elementKey(element))
    if (existing && !needsRecreate(existing.element, element)) {
      updateExistingItem(existing, element, assets, viewWidth, viewHeight)
      next.push(existing)
      byKey.delete(elementKey(element))
    } else {
      const created = createItem(element, assets, viewWidth, viewHeight, next.length)
      if (created) next.push(created)
      byKey.delete(elementKey(element))
    }
  }
  for (const remaining of byKey.values()) {
    remaining.group.visible = false
  }
  return next
}

function updateExistingItem(item: RenderedElement, element: CompositionElement, assets: StageAssets, viewWidth: number, viewHeight: number): void {
  item.element = element
  const x = (element.x / 100 - 0.5) * viewWidth
  const y = (0.5 - element.y / 100) * viewHeight
  item.baseX = x
  item.baseY = y
  item.group.position.set(x, y, item.group.position.z)
  item.group.rotation.z = THREE.MathUtils.degToRad(element.rotation)
  item.group.visible = element.visible && element.opacity > 0.01
  if (item.text && item.textLines) {
    item.text.set(item.textLines, (element.width / 100) * viewWidth, { color: element.color })
    item.text.setOpacity(element.opacity)
  }
  if (item.cover) {
    const width = (element.width / 100) * viewWidth
    const height = (element.height / 100) * viewHeight
    item.cover.setSize(width, height)
    item.cover.setTexture(assets.coverTexture)
    item.cover.setOpacity(element.opacity)
  }
  if (item.wave) {
    const width = (element.width / 100) * viewWidth
    const height = (element.height / 100) * viewHeight
    item.wave.update(null, 0, 0, width, height / 2, element.opacity)
  }
  if (item.fill) {
    const width = (element.width / 100) * viewWidth
    const height = (element.height / 100) * viewHeight
    item.fill.scale.x = Math.max(0.001, width)
    item.fill.scale.y = Math.max(0.001, height)
    item.fill.position.x = -width / 2
    item.fill.material.opacity = element.opacity
  }
  if (item.player) {
    const width = (element.width / 100) * viewWidth
    const height = (element.height / 100) * viewHeight
    const coverSize = height * 0.66
    item.player.cover?.setSize(coverSize, coverSize)
    item.player.cover?.setTexture(assets.coverTexture)
    item.player.cover?.setOpacity(element.opacity)
    const textLeft = -width / 2 + coverSize * 1.45
    const textWidth = Math.max(0.1, width - coverSize * 1.6)
    item.player.title?.set(item.player.titleLines ?? [], textWidth, {})
    item.player.title?.setOpacity(element.opacity)
    item.player.fill.scale.x = width
    item.player.fill.scale.y = Math.max(0.001, height)
    item.player.fill.position.set(-width / 2, 0, 0.04)
    item.player.track.scale.x = Math.max(0.1, textWidth)
    item.player.track.scale.y = Math.max(0.03, height * 0.035)
    item.player.track.position.set(textLeft + (Math.max(0.1, textWidth)) / 2, -height * 0.28, 0.03)
    item.player.fill.position.set(textLeft + (Math.max(0.1, textWidth)) / 2, -height * 0.28, 0.04)
    item.player.progressLeft = textLeft
    item.player.progressWidth = Math.max(0.1, textWidth)
    item.player.timeLabel.set(item.player.timeLabelLines ?? ['0:00 / 0:00'], Math.max(0.1, textWidth) * 0.7, {})
    item.player.timeLabel.setOpacity(element.opacity * 0.8)
  }
  for (const material of item.materials) {
    if (material.opacity !== undefined) material.opacity = element.opacity
  }
}

function createItem(
  element: CompositionElement,
  assets: StageAssets,
  viewWidth: number,
  viewHeight: number,
  index: number,
): RenderedElement | null {
  const group = new THREE.Group()
  const width = (element.width / 100) * viewWidth
  const height = (element.height / 100) * viewHeight
  const x = (element.x / 100 - 0.5) * viewWidth
  const y = (0.5 - element.y / 100) * viewHeight
  group.position.set(x, y, 0.05 + index * 0.002)
  group.rotation.z = THREE.MathUtils.degToRad(element.rotation)
  group.visible = element.visible && element.opacity > 0.01
  group.renderOrder = 200 + index * 10
  const materials: THREE.Material[] = []
  const rendered: RenderedElement = { element, group, baseX: x, baseY: y, materials }

  if (element.type === 'text') {
    const textWidth = Math.max(0.1, width)
    const fontWorld = Math.max(0.04, (element.fontSize / 100) * viewHeight)
    const layer = new TextLayer({
      font: element.font,
      weight: element.weight,
      sizeFrac: clamp(fontWorld / textWidth, 0.005, 2),
      color: element.color,
      tracking: element.tracking,
      align: element.align,
      lineHeight: 1.25,
      uppercase: true,
      wrap: true,
    })
    const lines = [element.text]
    layer.set(lines, textWidth, { color: element.color })
    layer.setOpacity(element.opacity)
    layer.mesh.renderOrder = 210 + index * 10
    group.add(layer.mesh)
    rendered.text = layer
    rendered.textLines = lines
    return rendered
  }

  if (element.type === 'artwork') {
    const cover = new CoverCard()
    cover.setSize(width, height)
    cover.setTexture(assets.coverTexture)
    cover.setGlowIntensity(0.35)
    cover.setOpacity(element.opacity)
    cover.group.renderOrder = 210 + index * 10
    group.add(cover.group)
    rendered.cover = cover
    return rendered
  }

  if (element.type === 'waveform') {
    const wave = new WaveformLine(96, element.color, element.opacity)
    wave.line.renderOrder = 210 + index * 10
    group.add(wave.line)
    rendered.wave = wave
    return rendered
  }

  if (element.type === 'player') {
    const panelMaterial = new THREE.MeshBasicMaterial({ color: '#11101a', transparent: true, opacity: element.opacity * 0.92, depthWrite: false })
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), panelMaterial)
    panel.scale.set(width, height, 1)
    panel.renderOrder = 220 + index * 10
    group.add(panel)
    materials.push(panelMaterial)

    const coverSize = height * 0.66
    const cover = new CoverCard()
    cover.setSize(coverSize, coverSize)
    cover.setTexture(assets.coverTexture)
    cover.setGlowIntensity(0.25)
    cover.setOpacity(element.opacity)
    cover.group.position.set(-width / 2 + coverSize * 0.72, 0, 0.02)
    cover.group.renderOrder = 210 + index * 10
    group.add(cover.group)

    const textLeft = -width / 2 + coverSize * 1.45
    const textWidth = Math.max(0.1, width - coverSize * 1.6)
    const title = new TextLayer({
      font: 'title',
      weight: 700,
      sizeFrac: clamp(((element.fontSize / 100) * viewHeight) / textWidth, 0.005, 2),
      color: '#f2edf5',
      tracking: 2,
      align: 'left',
      anchor: 'topLeft',
      lineHeight: 1.2,
      uppercase: true,
      wrap: true,
    })
    title.set([element.text], textWidth, {})
    title.setOpacity(element.opacity)
    title.mesh.position.set(textLeft, height * 0.28, 0.03)
    title.mesh.renderOrder = 210 + index * 10
    group.add(title.mesh)

    const barY = -height * 0.28
    const barW = Math.max(0.1, textWidth)
    const trackMaterial = new THREE.MeshBasicMaterial({ color: '#3a3050', transparent: true, opacity: element.opacity * 0.85, depthWrite: false })
    const track = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), trackMaterial)
    track.scale.set(barW, Math.max(0.03, height * 0.035), 1)
    track.position.set(textLeft + barW / 2, barY, 0.03)
    track.renderOrder = 220 + index * 10
    const fillMaterial = new THREE.MeshBasicMaterial({ color: element.color, transparent: true, opacity: element.opacity, depthWrite: false })
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fillMaterial)
    fill.scale.set(barW, Math.max(0.03, height * 0.035), 1)
    fill.position.set(textLeft + barW / 2, barY, 0.04)
    fill.renderOrder = 221 + index * 10
    group.add(track, fill)
    materials.push(trackMaterial, fillMaterial)

    const timeLabel = new TextLayer({
      font: 'ui',
      weight: 500,
      sizeFrac: clamp(((element.fontSize * 0.45) / 100 * viewHeight) / (barW * 0.7), 0.005, 2),
      color: '#a99eae',
      tracking: 1,
      align: 'right',
      anchor: 'topLeft',
      lineHeight: 1.2,
    })
    const timeLabelLines = ['0:00 / 0:00']
    timeLabel.set(timeLabelLines, barW * 0.7, {})
    timeLabel.setOpacity(element.opacity * 0.8)
    timeLabel.mesh.position.set(textLeft + barW * 0.3, barY - height * 0.14, 0.03)
    timeLabel.mesh.renderOrder = 210 + index * 10
    group.add(timeLabel.mesh)

    rendered.cover = cover
    rendered.text = title
    rendered.player = { fill, progressLeft: textLeft, progressWidth: barW, timeLabel, lastSecond: -1, cover, title, track, timeLabelLines, titleLines: [element.text] }
    return rendered
  }

  if (element.type === 'progress') {
    const trackGeometry = new THREE.PlaneGeometry(1, 1)
    const trackMaterial = new THREE.MeshBasicMaterial({ color: element.color, transparent: true, opacity: element.opacity * 0.28, depthWrite: false })
    const track = new THREE.Mesh(trackGeometry, trackMaterial)
    track.scale.set(width, height, 1)
    track.renderOrder = 220 + index * 10
    const fillGeometry = new THREE.PlaneGeometry(1, 1)
    const fillMaterial = new THREE.MeshBasicMaterial({ color: element.color, transparent: true, opacity: element.opacity, depthWrite: false })
    const fill = new THREE.Mesh(fillGeometry, fillMaterial)
    fill.scale.set(width, height, 1)
    fill.position.z = 0.01
    fill.renderOrder = 221 + index * 10
    group.add(track, fill)
    materials.push(trackMaterial, fillMaterial)
    rendered.fill = fill
    return rendered
  }

  const material = new THREE.MeshBasicMaterial({
    color: element.color,
    transparent: true,
    opacity: element.opacity,
    depthWrite: false,
    toneMapped: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
  mesh.scale.set(width, height, 1)
  mesh.renderOrder = 220 + index * 10
  group.add(mesh)
  materials.push(material)
  return rendered
}

/** Camada declarativa editável por cima do template. Ela é desenhada no
 * WebGL para entrar na gravação; o overlay HTML do Stage é só manipulação.
 *
 * Diferente da implementação anterior, mudanças ordinárias (movimento,
 * redimensionamento, rotação, opacidade) agora atualizam os itens existentes
 * in place em vez de despachar uma reconstrução completa da composição.
 * Só reconstrói quando o tipo, conteúdo, estrutura ou dimensões base mudam.
 */
export class CompositionLayer {
  readonly group = new THREE.Group()
  private items: RenderedElement[] = []
  private viewWidth = 10
  private viewHeight = 10
  private elements: CompositionElement[] = []
  private assets: StageAssets = { coverTexture: null, hasCover: false }

  constructor(elements: CompositionElement[], assets: StageAssets, viewWidth: number, viewHeight: number) {
    this.group.name = 'composition-elements'
    this.setElements(elements, assets, viewWidth, viewHeight)
  }

  /** Substitui a lista de elementos, reconstruindo apenas quando necessário. */
  setElements(elements: CompositionElement[], assets: StageAssets, viewWidth: number, viewHeight: number): void {
    this.elements = elements
    this.assets = assets
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
    const next = rebuildItems(this.items, elements, assets, viewWidth, viewHeight)
    if (next.length !== this.items.length || next.some((item, i) => item !== this.items[i])) {
      for (const item of this.items) {
        if (!next.includes(item)) item.group.visible = false
      }
      this.items = next
    }
    for (const item of this.items) {
      item.group.renderOrder = 200 + this.items.indexOf(item) * 10
    }
  }

  /** Reconstrução completa — mantida para rebuilt quando a ordem/conjunto mudar de forma não incremental. */
  rebuild(elements: CompositionElement[], assets: StageAssets, viewWidth: number, viewHeight: number): void {
    this.elements = elements
    this.assets = assets
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
    this.clear()
    for (const element of elements) {
      if (!element.visible) continue
      const rendered = createItem(element, assets, viewWidth, viewHeight, this.items.length)
      if (rendered) {
        rendered.group.renderOrder = 200 + this.items.length * 10
        this.items.push(rendered)
      }
    }
  }

  resize(viewWidth: number, viewHeight: number): void {
    if (Math.abs(viewWidth - this.viewWidth) < 0.001 && Math.abs(viewHeight - this.viewHeight) < 0.001) return
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
    this.setElements(this.elements, this.assets, viewWidth, viewHeight)
  }

  update(args: TemplateUpdateArgs): void {
    const bass = args.frame.bass * args.visual.bassForce
    const t = args.time
    for (const item of this.items) {
      const { element, group, baseX, baseY } = item
      const amount = element.motionAmount / 100
      let x = baseX
      let y = baseY
      let scale = 1
      if (element.motion === 'float') {
        x += Math.sin(t * 0.65 + baseY) * amount * 0.55
        y += Math.cos(t * 0.5 + baseX) * amount * 0.4
      } else if (element.motion === 'pulse') {
        scale += (element.reactive ? bass : 0.4) * amount * 0.16
      }
      if (element.reactive && element.motion !== 'pulse') {
        y += bass * amount * 0.2
      }
      group.position.set(x, y, group.position.z)
      group.scale.setScalar(scale)
      const opacity = Math.max(0, Math.min(1, element.opacity))
      group.visible = opacity > 0.01
      if (item.wave) {
        const width = (element.width / 100) * this.viewWidth
        const height = (element.height / 100) * this.viewHeight
        item.wave.update(args.frame.waveform, -width / 2, 0, width, height / 2, opacity * (0.65 + args.frame.energy * 0.35))
      }
      if (item.fill) {
        const width = (element.width / 100) * this.viewWidth
        const progress = clamp(args.clip.progress, 0, 1)
        item.fill.scale.x = Math.max(0.001, width * progress)
        item.fill.position.x = -width / 2 + (width * progress) / 2
        item.fill.material.opacity = opacity
      }
      if (item.player) {
        const progress = clamp(args.clip.progress, 0, 1)
        const player = item.player
        player.fill.scale.x = Math.max(0.001, player.progressWidth * progress)
        player.fill.position.x = player.progressLeft + (player.progressWidth * progress) / 2
        const second = Math.floor(t)
        if (second !== player.lastSecond) {
          player.lastSecond = second
          const current = args.clip.start + progress * Math.max(0.001, args.clip.end - args.clip.start)
          player.timeLabel.set([`${formatClock(current)} / ${formatClock(args.clip.end)}`], player.progressWidth * 0.7, {})
          player.timeLabel.setOpacity(opacity * 0.8)
        }
      }
      if (item.text) item.text.setOpacity(opacity)
      if (item.cover) item.cover.setOpacity(opacity)
      if (item.player?.title) item.player.title.setOpacity(opacity)
      for (const material of item.materials) material.opacity = opacity
    }
  }

  private clear(): void {
    for (const item of this.items) {
      item.text?.dispose()
      item.cover?.dispose()
      item.wave?.dispose()
      item.player?.timeLabel.dispose()
      item.group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
          else material.dispose()
        }
      })
      this.group.remove(item.group)
    }
    this.items = []
  }

  dispose(): void {
    this.clear()
    if (this.group.parent) this.group.parent.remove(this.group)
  }
}
