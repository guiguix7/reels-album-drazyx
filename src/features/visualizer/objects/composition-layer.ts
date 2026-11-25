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
  cover?: CoverCard
  fill?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  wave?: WaveformLine
  player?: {
    fill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    progressLeft: number
    progressWidth: number
    timeLabel: TextLayer
    lastSecond: number
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

/**
 * Camada declarativa editável por cima do template. Ela é desenhada no
 * WebGL para entrar na gravação; o overlay HTML do Stage é só manipulação.
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
    this.rebuild(elements, assets, viewWidth, viewHeight)
  }

  rebuild(elements: CompositionElement[], assets: StageAssets, viewWidth: number, viewHeight: number): void {
    this.elements = elements
    this.assets = assets
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
    this.clear()
    elements.forEach((element, index) => {
      if (!element.visible) return
      const rendered = this.createElement(element, index)
      if (rendered) {
        // A ordem do array é a ordem real das camadas, independente do
        // renderOrder interno de TextLayer/CoverCard.
        rendered.group.traverse((object) => {
          object.renderOrder = 200 + index * 10
        })
        this.items.push(rendered)
      }
    })
  }

  resize(viewWidth: number, viewHeight: number): void {
    if (Math.abs(viewWidth - this.viewWidth) < 0.001 && Math.abs(viewHeight - this.viewHeight) < 0.001) return
    this.rebuild(this.elements, this.assets, viewWidth, viewHeight)
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
      for (const material of item.materials) material.opacity = opacity
    }
  }

  private createElement(element: CompositionElement, index: number): RenderedElement | null {
    const group = new THREE.Group()
    const width = (element.width / 100) * this.viewWidth
    const height = (element.height / 100) * this.viewHeight
    const x = (element.x / 100 - 0.5) * this.viewWidth
    const y = (0.5 - element.y / 100) * this.viewHeight
    group.position.set(x, y, 0.05 + index * 0.002)
    group.rotation.z = THREE.MathUtils.degToRad(element.rotation)
    group.visible = element.visible && element.opacity > 0.01
    this.group.add(group)

    const materials: THREE.Material[] = []
    const rendered: RenderedElement = { element, group, baseX: x, baseY: y, materials }

    if (element.type === 'text') {
      const fontWorld = Math.max(0.04, (element.fontSize / 100) * this.viewHeight)
      const textWidth = Math.max(0.1, width)
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
      layer.set([element.text], textWidth, { color: element.color })
      layer.setOpacity(element.opacity)
      group.add(layer.mesh)
      rendered.text = layer
      return rendered
    }

    if (element.type === 'artwork') {
      const cover = new CoverCard()
      cover.setSize(width, height)
      cover.setTexture(this.assets.coverTexture)
      cover.setGlowIntensity(0.35)
      cover.setOpacity(element.opacity)
      group.add(cover.group)
      rendered.cover = cover
      return rendered
    }

    if (element.type === 'waveform') {
      const wave = new WaveformLine(96, element.color, element.opacity)
      group.add(wave.line)
      rendered.wave = wave
      return rendered
    }

    if (element.type === 'player') {
      const panelMaterial = new THREE.MeshBasicMaterial({ color: '#11101a', transparent: true, opacity: element.opacity * 0.92, depthWrite: false })
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), panelMaterial)
      panel.scale.set(width, height, 1)
      panel.renderOrder = 220 + index
      group.add(panel)
      materials.push(panelMaterial)

      const coverSize = height * 0.66
      const cover = new CoverCard()
      cover.setSize(coverSize, coverSize)
      cover.setTexture(this.assets.coverTexture)
      cover.setGlowIntensity(0.25)
      cover.setOpacity(element.opacity)
      cover.group.position.set(-width / 2 + coverSize * 0.72, 0, 0.02)
      group.add(cover.group)

      const textLeft = -width / 2 + coverSize * 1.45
      const textWidth = Math.max(0.1, width - coverSize * 1.6)
      const title = new TextLayer({
        font: 'title',
        weight: 700,
        sizeFrac: clamp(((element.fontSize / 100) * this.viewHeight) / textWidth, 0.005, 2),
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
      group.add(title.mesh)

      const barY = -height * 0.28
      const barW = Math.max(0.1, textWidth)
      const trackMaterial = new THREE.MeshBasicMaterial({ color: '#3a3050', transparent: true, opacity: element.opacity * 0.85, depthWrite: false })
      const track = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), trackMaterial)
      track.scale.set(barW, Math.max(0.03, height * 0.035), 1)
      track.position.set(textLeft + barW / 2, barY, 0.03)
      const fillMaterial = new THREE.MeshBasicMaterial({ color: element.color, transparent: true, opacity: element.opacity, depthWrite: false })
      const fill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fillMaterial)
      fill.scale.set(barW, Math.max(0.03, height * 0.035), 1)
      fill.position.set(textLeft + barW / 2, barY, 0.04)
      group.add(track, fill)
      materials.push(trackMaterial, fillMaterial)

      const timeLabel = new TextLayer({
        font: 'ui',
        weight: 500,
        sizeFrac: clamp(((element.fontSize * 0.45) / 100 * this.viewHeight) / (barW * 0.7), 0.005, 2),
        color: '#a99eae',
        tracking: 1,
        align: 'right',
        anchor: 'topLeft',
        lineHeight: 1.2,
      })
      timeLabel.set(['0:00 / 0:00'], barW * 0.7, {})
      timeLabel.setOpacity(element.opacity * 0.8)
      timeLabel.mesh.position.set(textLeft + barW * 0.3, barY - height * 0.14, 0.03)
      group.add(timeLabel.mesh)

      rendered.cover = cover
      rendered.text = title
      rendered.player = { fill, progressLeft: textLeft, progressWidth: barW, timeLabel, lastSecond: -1 }
      return rendered
    }

    if (element.type === 'progress') {
      const trackGeometry = new THREE.PlaneGeometry(1, 1)
      const trackMaterial = new THREE.MeshBasicMaterial({ color: element.color, transparent: true, opacity: element.opacity * 0.28, depthWrite: false })
      const track = new THREE.Mesh(trackGeometry, trackMaterial)
      track.scale.set(width, height, 1)
      track.renderOrder = 220 + index
      const fillGeometry = new THREE.PlaneGeometry(1, 1)
      const fillMaterial = new THREE.MeshBasicMaterial({ color: element.color, transparent: true, opacity: element.opacity, depthWrite: false })
      const fill = new THREE.Mesh(fillGeometry, fillMaterial)
      fill.scale.set(width, height, 1)
      fill.position.z = 0.01
      fill.renderOrder = 221 + index
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
    mesh.renderOrder = 220 + index
    group.add(mesh)
    materials.push(material)
    return rendered
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
