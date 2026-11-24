import * as THREE from 'three'

/** Texturas procedurais compartilhadas — criadas uma vez, reutilizadas entre templates. */

const cache = new Map<string, THREE.Texture>()

function canvasTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.Texture {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  cache.set(key, texture)
  return texture
}

/** Glow radial suave (branco — tint feito pelo material). */
export function radialGlowTexture(): THREE.Texture {
  return canvasTexture('radial-glow', 256, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  })
}

/** Ponto circular suave para partículas. */
export function particleTexture(): THREE.Texture {
  return canvasTexture('particle', 64, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  })
}

/** Textura de scanlines finas (alpha) para overlays sutis. */
export function scanlineTexture(): THREE.Texture {
  return canvasTexture('scanlines', 128, (ctx, size) => {
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    for (let y = 0; y < size; y += 4) ctx.fillRect(0, y, size, 1)
  })
}

export function disposeSharedTextures(): void {
  cache.forEach((texture) => texture.dispose())
  cache.clear()
}
