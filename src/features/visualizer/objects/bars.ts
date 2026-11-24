import * as THREE from 'three'

/**
 * Barras de espectro via InstancedMesh — uma draw call, sem alocação por frame.
 * Orientação: 'row' (cresce para cima, ao longo de x) ou 'column' (cresce para a direita, ao longo de y).
 */
export class FFTBars {
  readonly mesh: THREE.InstancedMesh
  private count: number
  private dummy = new THREE.Object3D()
  private colorA: THREE.Color
  private colorB: THREE.Color
  private thickness: number
  private gap: number
  private colorKey = ''

  constructor(
    count: number,
    options: {
      thickness: number
      gap: number
      colorA: string
      colorB: string
      orientation: 'row' | 'column'
      origin: 'start' | 'center'
    },
  ) {
    this.count = Math.max(1, Math.round(count))
    this.thickness = options.thickness
    this.gap = options.gap
    this.colorA = new THREE.Color(options.colorA)
    this.colorB = new THREE.Color(options.colorB)
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })
    this.mesh = new THREE.InstancedMesh(geometry, material, this.count)
    this.mesh.renderOrder = 20
    // Cores por instância (gradiente fixo pelo índice).
    const color = new THREE.Color()
    for (let i = 0; i < this.count; i++) {
      const t = this.count === 1 ? 0 : i / (this.count - 1)
      color.copy(this.colorA).lerp(this.colorB, t)
      this.mesh.setColorAt(i, color)
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
    void options.orientation
    void options.origin
    this.reset()
  }

  setOpacity(opacity: number): void {
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = opacity
    this.mesh.visible = opacity > 0.01
  }

  /** Troca o gradiente das barras (paleta da capa); recalcula só quando muda. */
  setColors(colorA: string, colorB: string): void {
    const key = `${colorA}|${colorB}`
    if (key === this.colorKey) return
    this.colorKey = key
    this.colorA.set(colorA)
    this.colorB.set(colorB)
    const color = new THREE.Color()
    for (let i = 0; i < this.count; i++) {
      const t = this.count === 1 ? 0 : i / (this.count - 1)
      color.copy(this.colorA).lerp(this.colorB, t)
      this.mesh.setColorAt(i, color)
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  private reset(): void {
    for (let i = 0; i < this.count; i++) {
      this.dummy.position.set(0, 0, 0)
      this.dummy.scale.set(this.thickness, 0.001, this.thickness)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  /**
   * Atualiza as matrizes. Para 'row': barras alinhadas ao longo de x, crescendo para cima a partir de y0.
   * Para 'column': ao longo de y, crescendo para a direita a partir de x0.
   */
  updateRow(
    x0: number,
    y0: number,
    width: number,
    bars: Float32Array,
    opts: { maxHeight: number; minHeight?: number; fromEnd?: boolean; flipY?: boolean },
  ): void {
    const n = Math.min(this.count, bars.length)
    const step = width / n
    const barW = step - this.gap
    for (let i = 0; i < this.count; i++) {
      const source = opts.fromEnd ? n - 1 - i : i
      const value = i < n ? Math.max(opts.minHeight ?? 0.02, bars[source]) : 0.02
      const h = value * opts.maxHeight
      const dir = opts.flipY ? -1 : 1
      this.dummy.position.set(x0 + step * (i + 0.5), y0 + (h / 2) * dir, 0)
      this.dummy.scale.set(Math.max(0.01, barW), Math.max(0.005, h), 1)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  updateColumn(
    x0: number,
    y0: number,
    height: number,
    bars: Float32Array,
    opts: { maxLength: number; minLength?: number; growDown?: boolean; direction?: 1 | -1 },
  ): void {
    const n = Math.min(this.count, bars.length)
    const step = height / n
    const barH = step - this.gap
    const direction = opts.direction ?? 1
    for (let i = 0; i < this.count; i++) {
      const source = direction === 1 ? i : n - 1 - i
      const value = i < n ? Math.max(opts.minLength ?? 0.02, bars[source]) : 0.02
      const len = value * opts.maxLength
      const y = opts.growDown ? y0 - step * (i + 0.5) : y0 + step * (i + 0.5)
      this.dummy.position.set(x0 + (len / 2) * direction, y, 0)
      this.dummy.scale.set(Math.max(0.005, len), Math.max(0.01, barH), 1)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh)
  }
}

/** Anel espectral: barras dispostas em círculo (usado no MIRAGE). */
export class SpectrumRing {
  readonly mesh: THREE.InstancedMesh
  private count: number
  private dummy = new THREE.Object3D()
  private colorKey = ''

  constructor(count: number, options: { radius: number; thickness: number; color: string }) {
    this.count = Math.max(8, Math.round(count))
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(options.color), transparent: true, toneMapped: false })
    this.mesh = new THREE.InstancedMesh(geometry, material, this.count)
    this.mesh.renderOrder = 18
    void options.radius
    void options.thickness
  }

  /** Cor do anel (paleta da capa); aplica só quando muda. */
  setColor(color: string): void {
    if (color === this.colorKey) return
    this.colorKey = color
    ;(this.mesh.material as THREE.MeshBasicMaterial).color.set(color)
  }

  /** radius base + barHeight por bin; rotação lenta opcional. */
  update(radius: number, bars: Float32Array, maxHeight: number, thickness: number, rotation: number, opacity: number): void {
    const n = Math.min(this.count, bars.length)
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = opacity
    this.mesh.visible = opacity > 0.01
    if (!this.mesh.visible) return
    for (let i = 0; i < this.count; i++) {
      const source = i % n
      const angle = (i / this.count) * Math.PI * 2 + rotation
      const h = Math.max(0.02, bars[source] * maxHeight)
      this.dummy.position.set(Math.cos(angle) * (radius + h / 2), Math.sin(angle) * (radius + h / 2), 0)
      this.dummy.rotation.set(0, 0, angle + Math.PI / 2)
      this.dummy.scale.set(thickness, h, 1)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh)
  }
}
