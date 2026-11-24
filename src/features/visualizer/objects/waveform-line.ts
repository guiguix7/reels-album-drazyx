import * as THREE from 'three'

/** Linha de forma de onda (THREE.Line) — atualizada do waveform real por frame. */
export class WaveformLine {
  readonly line: THREE.Line
  private geometry: THREE.BufferGeometry
  private positions: Float32Array
  private points: number
  private material: THREE.LineBasicMaterial

  constructor(points: number, color: string, opacity: number) {
    this.points = Math.max(16, Math.round(points))
    this.positions = new Float32Array(this.points * 3)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      toneMapped: false,
    })
    this.line = new THREE.Line(this.geometry, this.material)
    this.line.renderOrder = 16
  }

  /** Desenha o waveform (Uint8 tempo) ao longo de [x0, x0+width] centrado em y0. */
  update(waveform: Uint8Array | null, x0: number, y0: number, width: number, amplitude: number, opacity: number): void {
    this.material.opacity = opacity
    this.line.visible = opacity > 0.01
    if (!this.line.visible) return
    const n = this.points
    const data = waveform ?? null
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      let v = 0
      if (data && data.length > 0) {
        const idx = Math.min(data.length - 1, Math.floor(t * data.length))
        v = (data[idx] - 128) / 128
      } else {
        v = Math.sin(t * Math.PI * 2 + performance.now() * 0.001) * 0.05
      }
      this.positions[i * 3] = x0 + t * width
      this.positions[i * 3 + 1] = y0 + v * amplitude
      this.positions[i * 3 + 2] = 0
    }
    ;(this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    this.geometry.computeBoundingSphere()
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    if (this.line.parent) this.line.parent.remove(this.line)
  }
}
