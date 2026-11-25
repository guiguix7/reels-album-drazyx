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
import { getFormatMode } from './composition'

/**
 * LAYOUT 08 — MONOCHROME FOCUS
 * Capa central com tratamento monocromático ao redor (a arte permanece
 * identificável), espectro de baixa frequência simétrico e tipografia mínima.
 */
export const Layout08: VisualTemplate = {
  id: 't8',
  name: '08 — MONOCHROME FOCUS',
  description: 'Capa central em tratamento monocromático, espectro simétrico mínimo.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    ctx.scene.add(background.mesh)

    const glowMaterial = new THREE.SpriteMaterial({ map: radialGlowTexture(), color: '#d8d4dc', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })
    const glow = new THREE.Sprite(glowMaterial)
    glow.position.z = -0.5
    glow.renderOrder = 3
    ctx.scene.add(glow)
    disposables.push(glowMaterial)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const bars = track(new FFTBars(24, { thickness: 0.06, gap: 0.05, colorA: '#f2edf5', colorB: '#6f6878', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)
    const mirror = track(new FFTBars(24, { thickness: 0.06, gap: 0.05, colorA: '#6f6878', colorB: '#f2edf5', orientation: 'row', origin: 'center' }))
    ctx.scene.add(mirror.mesh)

    const tagline = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.038, color: '#cfc9d4', tracking: 8, align: 'center', lineHeight: 1.35, uppercase: true }))
    ctx.scene.add(tagline.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.04, color: '#a99eae', tracking: 6, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const trackTitle = track(new TextLayer({ font: 'title', weight: 600, sizeFrac: 0.058, color: '#f2edf5', tracking: 4, align: 'center', lineHeight: 1.3, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.042, color: '#cfc9d4', tracking: 6, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      // Monocromático: cinzas derivados do acento, sem competir com a capa.
      const mono = mixHex(colors.accent, '#d9d5de', 0.82)
      const monoDark = mixHex(colors.secondary, '#3c3844', 0.75)
      background.setColors(mixHex(colors.secondary, '#121016', 0.7), '#08070c', mixHex(colors.accent, '#1a1820', 0.55))
      bars.setColors('#f2edf5', monoDark)
      mirror.setColors(monoDark, '#f2edf5')
      cover.setAccent(mono, mixHex(mono, colors.secondary, 0.35))
      glowMaterial.color.set(mono)
    }

    return {
      update(args: TemplateUpdateArgs): void {
        const { frame, visual, type, time } = args
        const safe = safeArea(viewW, viewH)
        const nextPalette = derivePalette(args.palette)
        if (nextPalette.key !== paletteKey) {
          paletteKey = nextPalette.key
          applyPalette(nextPalette)
        }
        const bass = frame.bass * visual.bassForce

        if (ctx.assets.coverTexture !== lastTexture) {
          lastTexture = ctx.assets.coverTexture
          cover.setTexture(lastTexture)
        }

        background.update(time, 0.18 + visual.glow * 0.22 + bass * 0.1, 0)
        const mode = getFormatMode(viewW, viewH)
        const landscape = mode === 'landscape'
        const size = Math.min(viewW * (landscape ? 0.26 : 0.5), viewH * 0.38)
        const coverX = landscape ? -viewW * 0.24 : 0
        const coverY = (landscape ? 0.2 : 0.6) + Math.sin(time * 0.2) * 0.04
        cover.setSize(size, size)
        cover.setGlowIntensity(0.12 + visual.glow * 0.24 + bass * 0.14)
        cover.group.position.set(coverX, coverY, 0)
        cover.group.rotation.z = Math.sin(time * 0.08) * 0.004
        cover.group.scale.setScalar(1 + bass * 0.018)

        glow.position.set(coverX, coverY, -0.5)
        glow.scale.setScalar(size * 2.4)
        glowMaterial.opacity = 0.12 + bass * 0.12

        // Espectro de baixa frequência simétrico acima da capa: a base fica
        // reservada para o bloco de metadados.
        const lowBins = 24
        const barWidth = Math.min(viewW * 0.62, viewH * 0.5)
        const barY = safe.topY - 0.9
        const maxHeight = 0.2 + bass * 0.14 + frame.beatPulse * 0.05
        const low = frame.bars.subarray(0, lowBins)
        bars.updateRow(-barWidth / 2, barY, barWidth, low, { maxHeight, minHeight: 0.02 })
        mirror.updateRow(-barWidth / 2, barY, barWidth, low, {
          maxHeight: maxHeight * 0.7,
          minHeight: 0.02,
          fromEnd: true,
          flipY: true,
        })
        bars.setOpacity(0.55 + frame.energy * 0.3)
        mirror.setOpacity(0.35 + frame.energy * 0.25)

        tagline.set([type.tagline], viewW * 0.8, {})
        tagline.setOpacity(type.showTagline ? 0.8 : 0)
        tagline.mesh.position.set(0, safe.topY - 0.25, 0)

        // Bloco de metadados ancorado na base segura, sem cruzar com a capa.
        const artistH = artist.set([type.showArtist ? type.artistName : ''], viewW * 0.7, {})
        artist.setOpacity(type.showArtist ? 0.85 : 0)
        const artistY = safe.bottomY + 0.9
        artist.mesh.position.set(0, artistY, 0)

        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], viewW * 0.72, {})
        trackTitle.setOpacity(type.showTrack ? 0.94 : 0)
        const titleBottom = artistY + artistH / 2 + 0.16
        trackTitle.mesh.position.set(0, titleBottom + titleH / 2, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.84 ? Math.min(1, (args.clip.progress - 0.84) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.74, { color: '#e6e2ea' })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.25, 0)

        const camSpeed = 0.12 + visual.cameraSpeed * 0.3
        ctx.camera.position.set(0, Math.cos(time * 0.03) * 0.05 * camSpeed, 10 - args.clip.progress * 0.18 * camSpeed)
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
