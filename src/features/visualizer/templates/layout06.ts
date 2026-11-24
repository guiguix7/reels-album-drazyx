import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { CoverCard } from '../objects/cover-card'
import { ParticleField } from '../objects/particles'
import { TextLayer } from '../objects/text-layer'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'

/**
 * LAYOUT 06 — VERTICAL TOTEM
 * Capa alta no centro com indicadores verticais nos dois lados e metadados
 * presos à base da arte. Prioriza 9:16; em 16:9 ganha margens laterais.
 */
export const Layout06: VisualTemplate = {
  id: 't6',
  name: '06 — VERTICAL TOTEM',
  description: 'Capa alta central, barras verticais dos dois lados, metadados na base.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    ctx.scene.add(background.mesh)

    const particles = track(new ParticleField({ count: 240, area: { x: 9, y: 13, z: 6 }, color: '#b3a0e6', size: 0.05, opacity: 0.4 }))
    ctx.scene.add(particles.points)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const leftBars = track(new FFTBars(30, { thickness: 0.05, gap: 0.05, colorA: '#b84dff', colorB: '#4c3a6e', orientation: 'column', origin: 'start' }))
    const rightBars = track(new FFTBars(30, { thickness: 0.05, gap: 0.05, colorA: '#4c3a6e', colorB: '#b84dff', orientation: 'column', origin: 'start' }))
    ctx.scene.add(leftBars.mesh, rightBars.mesh)

    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.04, color: '#a99eae', tracking: 6, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.062, color: '#f2edf5', tracking: 3, align: 'center', lineHeight: 1.3, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.036, color: '#8d8398', tracking: 4, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(album.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.044, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      particles.setColor(colors.glow)
      leftBars.setColors(colors.secondary, colors.accent)
      rightBars.setColors(colors.accent, colors.secondary)
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.45))
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

        background.update(time, 0.24 + visual.glow * 0.33 + bass * 0.16, Math.sin(time * 0.05) * 0.03)
        particles.update(args.dt, bass * 0.5, 0.3 + visual.cameraSpeed * 0.4)
        particles.setOpacity(0.18 + frame.energy * 0.28)

        // Totem: mais alto que largo, sempre dentro da altura visível.
        const coverH = Math.min(viewH * 0.52, viewW * 0.92)
        const coverW = coverH * 0.78
        const coverY = 0.55 + Math.sin(time * 0.22) * 0.08
        cover.setSize(coverW, coverH)
        cover.setGlowIntensity(0.22 + visual.glow * 0.38 + bass * 0.22)
        cover.group.position.set(0, coverY, 0)
        cover.group.rotation.y = Math.sin(time * 0.13) * 0.04
        cover.group.scale.setScalar(1 + bass * 0.025 + frame.beatPulse * 0.01)

        // Colunas verticais dos dois lados, crescendo para o centro.
        const colH = coverH * 0.94
        const colTop = coverY + colH / 2
        const colGap = coverW / 2 + 0.2
        const maxLen = Math.min(viewW * 0.11, 0.55) + bass * 0.22 + frame.beatPulse * 0.06
        leftBars.updateColumn(-colGap, colTop, colH, frame.bars, {
          maxLength: maxLen,
          minLength: 0.03,
          growDown: true,
          direction: -1,
        })
        rightBars.updateColumn(colGap, colTop, colH, frame.bars, { maxLength: maxLen, minLength: 0.03, growDown: true })
        leftBars.setOpacity(0.5 + frame.energy * 0.3)
        rightBars.setOpacity(0.5 + frame.energy * 0.3)

        // Metadados presos à base da capa.
        const metaY = coverY - coverH / 2 - 0.35
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], viewW * 0.78, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(0, metaY - titleH, 0)

        artist.set([type.showArtist ? type.artistName : ''], viewW * 0.7, {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)
        artist.mesh.position.set(0, metaY - titleH - 0.32, 0)

        album.set([type.showAlbum ? type.albumTitle : ''], viewW * 0.66, {})
        album.setOpacity(type.showAlbum ? 0.68 : 0)
        album.mesh.position.set(0, safe.bottomY + 0.55, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.84 ? Math.min(1, (args.clip.progress - 0.84) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.76, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.topY - 0.2, 0)

        // Deriva vertical lenta (respeitando as zonas seguras).
        const camSpeed = 0.18 + visual.cameraSpeed * 0.45
        ctx.camera.position.set(Math.sin(time * 0.03) * 0.08 * camSpeed, Math.sin(time * 0.05) * 0.14 * camSpeed, 10 - args.clip.progress * 0.3 * camSpeed)
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
