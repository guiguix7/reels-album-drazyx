import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { CoverCard } from '../objects/cover-card'
import { TextLayer } from '../objects/text-layer'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'
import { coverSide, getFormatMode } from './composition'

/**
 * LAYOUT 04 — EDITORIAL COVER
 * Espaço negativo forte: coluna de waveform e texto à esquerda, capa grande
 * à direita. Composição contida, sem elementos competindo com a arte.
 */
export const Template04: VisualTemplate = {
  id: 't4',
  name: '04 — EDITORIAL COVER',
  description: 'Waveform vertical + texto à esquerda, capa grande à direita.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0c0a16', '#070810', '#2a1e4e')
    ctx.scene.add(background.mesh)

    const bars = track(new FFTBars(26, { thickness: 0.075, gap: 0.075, colorA: '#b84dff', colorB: '#6b4a9f', orientation: 'column', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.105, color: '#f2edf5', tracking: 3, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.062, color: '#a99eae', tracking: 4, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.052, color: '#8d8398', tracking: 3, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true, wrap: true }))
    ctx.scene.add(album.mesh)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.058, color: '#cf8aff', tracking: 5, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      bars.setColors(colors.accent, colors.secondary)
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.5))
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

        if (ctx.assets.coverTexture !== lastTexture) {
          lastTexture = ctx.assets.coverTexture
          cover.setTexture(lastTexture)
        }

        const bass = frame.bass * visual.bassForce
        background.update(time, 0.26 + visual.glow * 0.35 + bass * 0.2, Math.sin(time * 0.06 + 2) * 0.05)

        const mode = getFormatMode(viewW, viewH)
        const landscape = mode === 'landscape'
        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0

        if (landscape) {
          // Paisagem: coluna vertical à esquerda, texto abaixo, capa à direita.
          const colX = safe.leftX + 0.09
          const colTopY = safe.topY - 0.6
          const colHeight = viewH * 0.34
          bars.updateColumn(colX, colTopY, colHeight, frame.bars, { maxLength: 0.85 + bass * 0.5 + frame.beatPulse * 0.18, minLength: 0.04, growDown: true })
          bars.setOpacity(0.8 + frame.energy * 0.2)

          const textWidth = viewW * 0.44
          const textY = colTopY - colHeight - 0.35
          const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], textWidth, {})
          trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
          trackTitle.mesh.position.set(safe.leftX, textY, 0)

          const artistH = artist.set([type.showArtist ? type.artistName : ''], textWidth, {})
          artist.setOpacity(type.showArtist ? 0.85 : 0)
          artist.mesh.position.set(safe.leftX, textY - titleH - 0.18, 0)

          album.set([type.showAlbum ? type.albumTitle : ''], textWidth, {})
          album.setOpacity(type.showAlbum ? 0.7 : 0)
          album.mesh.position.set(safe.leftX, textY - titleH - artistH - 0.22, 0)

          const coverSize = coverSide(viewW, viewH, mode, 0.5, 0.3, 0.5)
          cover.setSize(coverSize, coverSize)
          cover.setGlowIntensity(0.25 + visual.glow * 0.4 + bass * 0.3)
          cover.group.position.set(viewW * 0.17, 0.35 + Math.sin(time * 0.4) * 0.06, 0)
          cover.group.rotation.y = Math.sin(time * 0.17) * 0.02
          cover.group.rotation.z = 0.006
          cover.group.scale.setScalar(1 + bass * 0.03 + frame.beatPulse * 0.012)
        } else {
          // Retrato/quadrado: bloco de texto no topo, capa central e barras na base.
          const coverSize = coverSide(viewW, viewH, mode, 0.5, 0.3, 0.5)
          cover.setSize(coverSize, coverSize)
          cover.setGlowIntensity(0.25 + visual.glow * 0.4 + bass * 0.3)
          cover.group.position.set(0, -0.75 + Math.sin(time * 0.4) * 0.06, 0)
          cover.group.rotation.y = Math.sin(time * 0.17) * 0.025
          cover.group.rotation.z = 0.005
          cover.group.scale.setScalar(1 + bass * 0.03 + frame.beatPulse * 0.012)

          const textWidth = viewW * 0.8
          const titleTop = safe.topY - 0.2
          const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], textWidth, {})
          trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
          trackTitle.mesh.position.set(safe.leftX, titleTop, 0)

          const artistH = artist.set([type.showArtist ? type.artistName : ''], textWidth, {})
          artist.setOpacity(type.showArtist ? 0.85 : 0)
          artist.mesh.position.set(safe.leftX, titleTop - titleH - 0.14, 0)

          album.set([type.showAlbum ? type.albumTitle : ''], textWidth, {})
          album.setOpacity(type.showAlbum ? 0.7 : 0)
          album.mesh.position.set(safe.leftX, titleTop - titleH - artistH - 0.32, 0)

          bars.updateRow(safe.leftX, safe.bottomY + 0.2, safe.width * 0.82, frame.bars, {
            maxHeight: 0.42 + bass * 0.3 + frame.beatPulse * 0.1,
            minHeight: 0.03,
          })
          bars.setOpacity(0.7 + frame.energy * 0.25)
        }

        cta.set([type.ctaText], landscape ? viewW * 0.44 : viewW * 0.6, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(landscape ? safe.leftX : 0, safe.bottomY + 0.12, 0)

        // Câmera com leve deriva
        const camSpeed = 0.2 + visual.cameraSpeed * 0.5
        ctx.camera.position.x = Math.sin(time * 0.045) * 0.15 * camSpeed
        ctx.camera.position.y = Math.cos(time * 0.05) * 0.1 * camSpeed
        ctx.camera.position.z = 10 - args.clip.progress * 0.35 * camSpeed
        ctx.camera.lookAt(0, 0, 0)
      },
      resize(vw: number, vh: number): void {
        viewW = vw
        viewH = vh
        background.resize(vw, vh, -6, 10)
      },
      dispose(): void {
        disposables.forEach((d) => d.dispose())
      },
    }
  },
}
