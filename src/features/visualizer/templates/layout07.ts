import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { CoverCard } from '../objects/cover-card'
import { TextLayer } from '../objects/text-layer'
import { radialGlowTexture } from '../objects/textures'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'

/**
 * LAYOUT 07 — SYMMETRIC SPECTRUM
 * Capa quadrada central, estruturas de frequência espelhadas (esquerda e
 * direita) e tipografia centralizada. Simetria rígida, movimento contido.
 */
export const Layout07: VisualTemplate = {
  id: 't7',
  name: '07 — SYMMETRIC SPECTRUM',
  description: 'Capa quadrada central com espectro espelhado e tipografia centrada.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    ctx.scene.add(background.mesh)

    const glowMaterial = new THREE.SpriteMaterial({ map: radialGlowTexture(), color: '#b84dff', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending })
    const glow = new THREE.Sprite(glowMaterial)
    glow.position.z = -0.6
    glow.renderOrder = 3
    ctx.scene.add(glow)
    disposables.push(glowMaterial)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const leftBars = track(new FFTBars(36, { thickness: 0.045, gap: 0.04, colorA: '#b84dff', colorB: '#f2edf5', orientation: 'row', origin: 'center' }))
    const rightBars = track(new FFTBars(36, { thickness: 0.045, gap: 0.04, colorA: '#f2edf5', colorB: '#b84dff', orientation: 'row', origin: 'center' }))
    ctx.scene.add(leftBars.mesh, rightBars.mesh)

    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.042, color: '#a99eae', tracking: 7, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.07, color: '#f2edf5', tracking: 3, align: 'center', lineHeight: 1.28, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.045, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      const light = mixHex(colors.accent, '#f2edf5', 0.6)
      leftBars.setColors(colors.accent, light)
      rightBars.setColors(light, colors.accent)
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.4))
      glowMaterial.color.set(colors.accent)
    }

    /** Barras espelhadas: a direita inverte a ordem dos bins para simetria visual. */
    const updateMirrored = (
      layer: FFTBars,
      x0: number,
      y0: number,
      width: number,
      bars: Float32Array,
      maxHeight: number,
      fromEnd: boolean,
    ): void => {
      layer.updateRow(x0, y0, width, bars, { maxHeight, minHeight: 0.03, fromEnd })
    }

    return {
      update(args: TemplateUpdateArgs): void {
        const { frame, visual, type, time } = args
        const safe = safeArea(viewW, viewH)
        const nextPalette = derivePalette(args.palette)
        if (nextPalette.key !== paletteKey) {
          paletteKey = nextPalette.key
          palette = nextPalette
          applyPalette(nextPalette)
        }
        const pal = palette as PaletteColors
        const bass = frame.bass * visual.bassForce

        if (ctx.assets.coverTexture !== lastTexture) {
          lastTexture = ctx.assets.coverTexture
          cover.setTexture(lastTexture)
        }

        background.update(time, 0.23 + visual.glow * 0.32 + bass * 0.16, 0)
        const size = Math.min(viewW * 0.44, viewH * 0.38)
        const coverY = 0.45 + Math.sin(time * 0.26) * 0.04
        cover.setSize(size, size)
        cover.setGlowIntensity(0.2 + visual.glow * 0.42 + bass * 0.24)
        cover.group.position.set(0, coverY, 0)
        cover.group.rotation.z = Math.sin(time * 0.1) * 0.006
        cover.group.scale.setScalar(1 + bass * 0.026 + frame.beatPulse * 0.01)

        glow.position.set(0, coverY, -0.6)
        glow.scale.setScalar(size * 2.8)
        glowMaterial.opacity = 0.14 + bass * 0.2 + frame.transient * 0.08

        // Espectro espelhado na horizontal, na altura do centro da capa.
        const side = Math.max(0.5, viewW / 2 - size / 2 - 0.24)
        const maxHeight = 0.55 + bass * 0.35 + frame.beatPulse * 0.1
        updateMirrored(leftBars, -viewW / 2 + 0.1, coverY, side, frame.bars, maxHeight, false)
        updateMirrored(rightBars, viewW / 2 - 0.1 - side, coverY, side, frame.bars, maxHeight, true)
        leftBars.setOpacity(0.5 + frame.energy * 0.35)
        rightBars.setOpacity(0.5 + frame.energy * 0.35)

        artist.set([type.showArtist ? type.artistName : ''], viewW * 0.72, {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)
        artist.mesh.position.set(0, coverY - size / 2 - 0.35, 0)

        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], viewW * 0.74, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(0, coverY - size / 2 - 0.45 - titleH, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.84 ? Math.min(1, (args.clip.progress - 0.84) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.74, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.35, 0)

        const camSpeed = 0.15 + visual.cameraSpeed * 0.35
        ctx.camera.position.set(0, Math.sin(time * 0.04) * 0.06 * camSpeed, 10 - args.clip.progress * 0.22 * camSpeed)
        ctx.camera.lookAt(0, 0, 0)
      },
      resize(vw: number, vh: number): void {
        viewW = vw
        viewH = vh
        background.resize(vw, vh, -6, 10)
      },
      dispose(): void {
        disposables.forEach((item) => item.dispose())
      },
    }
  },
}
