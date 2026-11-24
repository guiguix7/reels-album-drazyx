/** Capa padrão procedural (fallback quando o usuário não enviou capa). */

export function createDefaultCoverCanvas(size = 1080): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // Fundo profundo com gradiente radial
  const bg = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.1, size * 0.5, size * 0.5, size * 0.75)
  bg.addColorStop(0, '#18131d')
  bg.addColorStop(0.55, '#0d0a18')
  bg.addColorStop(1, '#070810')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // Miragem: anel violeta com brilho
  ctx.save()
  ctx.translate(size * 0.5, size * 0.42)
  ctx.strokeStyle = '#b84dff'
  ctx.shadowColor = 'rgba(184, 77, 255, 0.8)'
  ctx.shadowBlur = size * 0.05
  ctx.lineWidth = size * 0.012
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.24, size * 0.24, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.31, size * 0.13, -0.5, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(207, 138, 255, 0.35)'
  ctx.lineWidth = size * 0.006
  ctx.stroke()
  ctx.restore()

  // Textura de ruído
  const noiseCount = Math.round(size * 0.9)
  for (let i = 0; i < noiseCount; i++) {
    const alpha = Math.random() * 0.08
    ctx.fillStyle = `rgba(242, 237, 245, ${alpha})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5)
  }

  // Tipografia
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f2edf5'
  ctx.font = `700 ${Math.round(size * 0.075)}px "Space Grotesk", sans-serif`
  ctx.fillText('MY MIRAGE', size * 0.5, size * 0.82)
  ctx.fillStyle = '#a99eae'
  ctx.font = `500 ${Math.round(size * 0.032)}px "Inter", sans-serif`
  ctx.fillText('DRAZYX', size * 0.5, size * 0.885)

  return canvas
}
