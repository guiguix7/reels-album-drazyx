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
  materials: THREE.Material[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
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
