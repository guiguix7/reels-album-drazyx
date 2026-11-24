import * as THREE from 'three'
import { radialGlowTexture } from './textures'

/** Capa do álbum como card: painel de fundo, moldura fina e glow atrás. */
export class CoverCard {
  readonly group: THREE.Group
  private backing: THREE.Mesh
  private cover: THREE.Mesh
  private border: THREE.LineSegments
  private glow: THREE.Sprite
  private coverMaterial: THREE.MeshBasicMaterial
  private backingMaterial: THREE.MeshBasicMaterial
  private glowMaterial: THREE.SpriteMaterial
  private placeholder: THREE.CanvasTexture | null = null

  constructor() {
    this.group = new THREE.Group()

    this.backingMaterial = new THREE.MeshBasicMaterial({ color: '#18131d', transparent: true, toneMapped: false })
    this.backing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.backingMaterial)
    this.backing.position.z = -0.02
    this.backing.renderOrder = 10

    this.coverMaterial = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })
    this.cover = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.coverMaterial)
    this.cover.renderOrder = 12

    const borderGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1))
    this.border = new THREE.LineSegments(borderGeometry, new THREE.LineBasicMaterial({ color: '#3a3050', transparent: true, opacity: 0.9, toneMapped: false }))
    this.border.position.z = 0.012
    this.border.renderOrder = 14

    this.glowMaterial = new THREE.SpriteMaterial({
      map: radialGlowTexture(),
      color: '#b84dff',
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.glow = new THREE.Sprite(this.glowMaterial)
    this.glow.position.z = -0.06
    this.glow.renderOrder = 9

    this.group.add(this.glow, this.backing, this.cover, this.border)
    this.setPlaceholderTexture()
  }

  /** Tamanho do card em unidades de mundo; padding do painel em fração do tamanho. */
  setSize(width: number, height: number, padFrac = 0.045): void {
    const padX = width * padFrac
    const padY = height * padFrac
    this.backing.scale.set(width + padX * 2, height + padY * 2, 1)
    this.cover.scale.set(width, height, 1)
    this.border.scale.set(width, height, 1)
    this.glow.scale.set(Math.max(width, height) * 1.9, Math.max(width, height) * 1.9, 1)
  }

  setTexture(texture: THREE.Texture | null): void {
    if (texture) {
      this.coverMaterial.map = texture
      this.coverMaterial.needsUpdate = true
    } else {
      this.setPlaceholderTexture()
    }
  }

  setGlowIntensity(intensity: number): void {
    this.glowMaterial.opacity = 0.25 + intensity * 0.65
  }

  private setPlaceholderTexture(): void {
    if (!this.placeholder) {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 256, 256)
        gradient.addColorStop(0, '#18131d')
        gradient.addColorStop(1, '#0a0912')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 256, 256)
        ctx.strokeStyle = '#b84dff'
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(128, 118, 52, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(169, 158, 174, 0.8)'
        ctx.font = '600 20px "Inter", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('MY MIRAGE', 128, 208)
      }
      this.placeholder = new THREE.CanvasTexture(canvas)
      this.placeholder.colorSpace = THREE.SRGBColorSpace
    }
    this.coverMaterial.map = this.placeholder
    this.coverMaterial.needsUpdate = true
  }

  dispose(): void {
    this.placeholder?.dispose()
    this.backing.geometry.dispose()
    this.backingMaterial.dispose()
    this.cover.geometry.dispose()
    this.coverMaterial.dispose()
    this.border.geometry.dispose()
    ;(this.border.material as THREE.Material).dispose()
    this.glowMaterial.dispose()
    if (this.group.parent) this.group.parent.remove(this.group)
  }
}
