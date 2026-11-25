import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { CoverCard } from '../objects/cover-card'
import { ParticleField } from '../objects/particles'
import { TextLayer } from '../objects/text-layer'
import { radialGlowTexture } from '../objects/textures'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'

/**
 * LAYOUT 01 — CENTERED HERO
 * Capa central com halo simétrico, detalhe espectral discreto e tipografia
 * mínima. É o layout mais versátil: funciona em 9:16, 1:1 e 16:9.
 */
export const Layout01: VisualTemplate = {
  id: 't1',
  name: '01 — CENTERED HERO',
  description: 'Capa central, halo simétrico e detalhe espectral mínimo.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    ctx.scene.add(background.mesh)

    const haloMaterial = new THREE.SpriteMaterial({
      map: radialGlowTexture(),
      color: '#b84dff',
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const halo = new THREE.Sprite(haloMaterial)
    halo.position.z = -0.5
    halo.renderOrder = 4
    ctx.scene.add(halo)
    disposables.push(haloMaterial)

    const particles = track(new ParticleField({ count: 260, area: { x: 11, y: 12, z: 7 }, color: '#c9b6ff', size: 0.055, opacity: 0.5 }))
    ctx.scene.add(particles.points)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const bars = track(new FFTBars(44, { thickness: 0.05, gap: 0.045, colorA: '#f2edf5', colorB: '#b84dff', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    const tagline = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.042, color: '#f2edf5', tracking: 7, align: 'center', lineHeight: 1.35, uppercase: true }))
    ctx.scene.add(tagline.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.044, color: '#a99eae', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.075, color: '#f2edf5', tracking: 3, align: 'center', lineHeight: 1.28, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.048, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      particles.setColor(colors.glow)
      bars.setColors(colors.accent, mixHex(colors.accent, '#f2edf5', 0.5))
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.45))
      haloMaterial.color.set(colors.accent)
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

        background.update(time, 0.24 + visual.glow * 0.34 + bass * 0.16, Math.sin(time * 0.05) * 0.05)
        particles.update(args.dt, bass * 0.6, 0.35 + visual.cameraSpeed * 0.6)
        particles.setOpacity((0.22 + frame.energy * 0.32) * (0.5 + visual.intensity * 0.5))

        // Proporção segura: em 16:9 a capa não pode dominar a largura.
        const base = Math.min(viewW * 0.56, viewH * 0.34)
        const size = base * (1 + bass * 0.03 + frame.beatPulse * 0.01)
        const coverY = 0.62 + Math.sin(time * 0.32) * 0.06
        cover.setSize(size, size)
        cover.setGlowIntensity(0.22 + visual.glow * 0.4 + bass * 0.25)
        cover.group.position.set(0, coverY, 0)
        cover.group.rotation.y = Math.sin(time * 0.16) * 0.05
        cover.group.rotation.x = Math.cos(time * 0.12) * 0.02

        halo.position.set(0, coverY, -0.5)
        halo.scale.setScalar(size * (2.5 + bass * 0.3))
        haloMaterial.opacity = 0.16 + bass * 0.24 + frame.transient * 0.1

        tagline.set([type.tagline], viewW * 0.82, { color: pal.glow })
        tagline.setOpacity(type.showTagline ? 0.9 : 0)
        tagline.mesh.position.set(0, safe.topY - 0.3, 0)

        // Bloco de texto ancorado na base segura; capa e título não se cruzam.
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], viewW * 0.78, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(0, safe.bottomY + 0.6 + titleH / 2, 0)

        artist.set([type.showArtist ? type.artistName : ''], viewW * 0.7, {})
        artist.setOpacity(type.showArtist ? 0.85 : 0)
        artist.mesh.position.set(0, safe.bottomY + 0.3, 0)

        // Espectro no vão real entre a capa e o título (altura limitada ao espaço).
        const barWidth = Math.min(viewW * 0.72, viewH * 0.62)
        const barTop = coverY - size / 2 - 0.12
        const titleTop = safe.bottomY + 0.6 + titleH
        const barMax = Math.max(0.08, Math.min(0.42 + bass * 0.28 + frame.beatPulse * 0.1, titleTop - barTop - 0.16))
        bars.updateRow(-barWidth / 2, barTop, barWidth, frame.bars, { maxHeight: barMax, minHeight: 0.03 })
        bars.setOpacity(0.42 + frame.treble * 0.35)

        const ctaOpacity = type.showCta && args.clip.progress > 0.84 ? Math.min(1, (args.clip.progress - 0.84) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.76, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.topY - 0.95, 0)

        const camSpeed = 0.18 + visual.cameraSpeed * 0.4
        ctx.camera.position.set(Math.sin(time * 0.04) * 0.1 * camSpeed, Math.cos(time * 0.035) * 0.08 * camSpeed, 10 - args.clip.progress * 0.25 * camSpeed)
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
