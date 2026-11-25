import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { WaveformLine as WaveLine } from '../objects/waveform-line'
import { CoverCard } from '../objects/cover-card'
import { TextLayer } from '../objects/text-layer'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { darken, mixHex } from '../../palette/palette'
import { coverSide, getFormatMode } from './composition'

/**
 * SPECTRUM — composição musical: espectro elegante na base, waveform fina
 * acima das barras e capa menor no alto, dentro da paleta Drazyx.
 */
export const SpectrumTemplate: VisualTemplate = {
  id: 'spectrum',
  name: 'SPECTRUM',
  description: 'Espectro elegante em barras com waveform e capa em destaque.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0c0a18', '#070810', '#39236b')
    ctx.scene.add(background.mesh)

    const bars = track(new FFTBars(52, { thickness: 0.06, gap: 0.045, colorA: '#b84dff', colorB: '#f2edf5', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    const barsGhost = track(new FFTBars(52, { thickness: 0.06, gap: 0.045, colorA: '#4a3a6b', colorB: '#2a2340', orientation: 'row', origin: 'center' }))
    ctx.scene.add(barsGhost.mesh)

    const wave = track(new WaveLine(80, '#cf8aff', 0.7))
    ctx.scene.add(wave.line)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.085, color: '#f2edf5', tracking: 4, align: 'left', anchor: 'topLeft', lineHeight: 1.25, uppercase: true }))
    ctx.scene.add(trackTitle.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.05, color: '#a99eae', tracking: 6, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.042, color: '#8d8398', tracking: 3, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(album.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.05, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      bars.setColors(colors.accent, colors.glow)
      barsGhost.setColors(darken(colors.secondary, 0.35), darken(colors.accent, 0.55))
      wave.setColor(colors.glow)
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
        background.update(time, 0.3 + visual.glow * 0.4 + bass * 0.22, Math.sin(time * 0.06) * 0.06)

        // Espectro na base; o bloco de texto fica acima do pico máximo das barras.
        const barWidth = safe.width * 0.9
        const barBaseY = safe.bottomY + 0.1
        const barPeakY = barBaseY + 1.4
        bars.updateRow(safe.leftX, barBaseY, barWidth, frame.bars, { maxHeight: 1.0 + bass * 0.35 + frame.beatPulse * 0.22, minHeight: 0.04 })
        bars.setOpacity(0.45 + frame.energy * 0.35)
        barsGhost.updateRow(safe.leftX, barBaseY + 0.1, barWidth, frame.bars, { maxHeight: 1.75, minHeight: 0.02, fromEnd: true })
        barsGhost.setOpacity(0.18)

        wave.update(frame.waveform, safe.leftX, barBaseY + 0.9, safe.width * 0.9, 0.4 + frame.beatPulse * 0.08, 0.5 + frame.treble * 0.4)

        // Capa menor no alto; em 16:9 vai à direita para o texto respirar.
        const mode = getFormatMode(viewW, viewH)
        const landscape = mode === 'landscape'
        const coverSize = coverSide(viewW, viewH, mode, 0.44, 0.34, 0.28)
        const coverX = landscape ? viewW * 0.3 : 0
        const coverY = landscape ? 0.1 : safe.topY - coverSize / 2 - 0.25
        cover.setSize(coverSize, coverSize)
        cover.setGlowIntensity(0.3 + visual.glow * 0.4 + bass * 0.25)
        cover.group.position.set(coverX, coverY, 0)
        cover.group.rotation.y = Math.sin(time * 0.2) * 0.025
        cover.group.scale.setScalar(1 + bass * 0.03 + frame.beatPulse * 0.012)

        // Em paisagem, bloco editorial à esquerda; nos demais, acima do espectro.
        const textW = landscape ? viewW * 0.4 : viewW * 0.84
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], textW, {})
        trackTitle.setOpacity(type.showTrack ? 0.95 : 0)

        const artistH = artist.set([type.showArtist ? type.artistName : ''], textW, {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)

        const albumH = album.set([type.showAlbum ? type.albumTitle : ''], textW, {})
        album.setOpacity(type.showAlbum ? 0.75 : 0)

        const gap = 0.14
        const blockTop = landscape
          ? safe.topY - 0.35
          : barPeakY + 0.55 + titleH + gap + artistH + 0.22 + albumH
        const textX = landscape ? safe.leftX : safe.leftX
        trackTitle.mesh.position.set(textX, blockTop, 0)
        artist.mesh.position.set(textX, blockTop - titleH - gap, 0)
        album.mesh.position.set(textX, blockTop - titleH - gap - artistH - 0.22, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.6, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.12, 0)

        // Câmera: leve inclinação orbital
        const camSpeed = 0.3 + visual.cameraSpeed * 0.7
        ctx.camera.position.x = Math.sin(time * 0.06) * 0.25 * camSpeed
        ctx.camera.position.y = Math.sin(time * 0.045 + 0.7) * 0.15 * camSpeed
        ctx.camera.position.z = 10 - args.clip.progress * 0.6 * camSpeed
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
