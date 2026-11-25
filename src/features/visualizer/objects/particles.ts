import * as THREE from 'three'
import { particleTexture } from './textures'
import { createRandom, hashSeed } from '../motion/motion.utils'

/** Campo de partículas de profundidade — arrastado por graves, lento por padrão. */

export interface ParticleFieldOptions {
  count: number
  area: { x: number; y: number; z: number }
  color: string
  size: number
  opacity: number
  /** Semente fixa: preview e export reconstroem o mesmo campo de partículas. */
  seed?: number
}

export class ParticleField {
  readonly points: THREE.Points
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private positions: Float32Array
  private velocities: Float32Array
  private count: number
  private area: ParticleFieldOptions['area']

  constructor(options: ParticleFieldOptions) {
    this.count = Math.max(8, Math.round(options.count))
    this.area = options.area
    const total = this.count * 3
    this.positions = new Float32Array(total)
    this.velocities = new Float32Array(total)
    const seed = options.seed ?? hashSeed([this.count, this.area.x, this.area.y, this.area.z])
    const random = createRandom(seed)
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (random() - 0.5) * this.area.x
      this.positions[i * 3 + 1] = (random() - 0.5) * this.area.y
      this.positions[i * 3 + 2] = (random() - 0.5) * this.area.z
      this.velocities[i * 3] = (random() - 0.5) * 0.12
      this.velocities[i * 3 + 1] = 0.06 + random() * 0.14
      this.velocities[i * 3 + 2] = (random() - 0.5) * 0.08
    }
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.material = new THREE.PointsMaterial({
      map: particleTexture(),
      color: new THREE.Color(options.color),
      size: options.size,
      transparent: true,
      opacity: options.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.renderOrder = 8
  }

  /** bass 0–1 desloca o campo; speed multiplica a deriva. */
  update(dt: number, bass: number, speed: number): void {
    const drift = 1 + bass * 2.2
    const positions = this.positions
    const velocities = this.velocities
    for (let i = 0; i < this.count; i++) {
      const ix = i * 3
      positions[ix] += velocities[ix] * dt * speed * drift
      positions[ix + 1] += velocities[ix + 1] * dt * speed
      positions[ix + 2] += velocities[ix + 2] * dt * speed * drift
      // wrap suave
      if (positions[ix] > this.area.x / 2) positions[ix] -= this.area.x
      if (positions[ix] < -this.area.x / 2) positions[ix] += this.area.x
      if (positions[ix + 1] > this.area.y / 2) positions[ix + 1] -= this.area.y
      if (positions[ix + 2] > this.area.z / 2) positions[ix + 2] -= this.area.z
      if (positions[ix + 2] < -this.area.z / 2) positions[ix + 2] += this.area.z
    }
    ;(this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    // Pulso sutil global com os graves (sem tremedeira).
    const pulse = 1 + bass * 0.05
    this.points.scale.set(pulse, pulse, pulse)
  }

  setOpacity(opacity: number): void {
    this.material.opacity = opacity
    this.points.visible = opacity > 0.01
  }

  /** Cor das partículas (paleta da capa). */
  setColor(color: string): void {
    this.material.color.set(color)
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    if (this.points.parent) this.points.parent.remove(this.points)
  }
}
