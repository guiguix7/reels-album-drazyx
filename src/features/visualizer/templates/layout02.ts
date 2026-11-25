import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { CoverCard } from '../objects/cover-card'
import { ParticleField } from '../objects/particles'
import { TextLayer } from '../objects/text-layer'
import { WaveformLine } from '../objects/waveform-line'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'

/**
 * LAYOUT 02 — STEREO FRAME
 * Capa central com estruturas de waveform espelhadas nos dois lados,
 * metadados abaixo da capa e movimento horizontal balanceado.
 */
export const Layout02: VisualTemplate = {
  id: 't2',
  name: '02 — STEREO FRAME',
  description: 'Capa central, waveforms espelhadas à esquerda e à direita.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    ctx.scene.add(background.mesh)

    const particles = track(new ParticleField({ count: 320, area: { x: 13, y: 10, z: 7 }, color: '#b9a6f2', size: 0.05, opacity: 0.45 }))
    ctx.scene.add(particles.points)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const waveLeft = track(new WaveformLine(96, '#cf8aff', 0.55))
    const waveRight = track(new WaveformLine(96, '#cf8aff', 0.55))
    ctx.scene.add(waveLeft.line, waveRight.line)

    const bars = track(new FFTBars(30, { thickness: 0.055, gap: 0.06, colorA: '#b84dff', colorB: '#6b4a9f', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.042, color: '#a99eae', tracking: 6, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.068, color: '#f2edf5', tracking: 3, align: 'center', lineHeight: 1.3, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.038, color: '#8d8398', tracking: 4, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(album.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.046, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      particles.setColor(colors.glow)
      bars.setColors(colors.accent, colors.secondary)
      waveLeft.setColor(colors.accent)
      waveRight.setColor(colors.accent)
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.4))
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

        background.update(time, 0.25 + visual.glow * 0.32 + bass * 0.18, Math.sin(time * 0.04) * 0.03)
        particles.update(args.dt, bass * 0.5, 0.3 + visual.cameraSpeed * 0.5)
        particles.setOpacity(0.2 + frame.energy * 0.3)

        const size = Math.min(viewW * 0.44, viewH * 0.3)
        const coverY = 0.8 + Math.sin(time * 0.3) * 0.05
        cover.setSize(size, size)
        cover.setGlowIntensity(0.25 + visual.glow * 0.35 + bass * 0.25)
        cover.group.position.set(0, coverY, 0)
        cover.group.rotation.y = Math.sin(time * 0.14) * 0.04
        cover.group.scale.setScalar(1 + bass * 0.028 + frame.beatPulse * 0.012)

        // Waveforms espelhadas ocupando as laterais da capa.
        const sideWidth = Math.max(0.6, viewW * 0.5 - size / 2 - 0.25)
        const waveAmp = 0.16 + bass * 0.3 + frame.transient * 0.12
        waveLeft.update(frame.waveform, -viewW / 2 + 0.12, coverY, sideWidth, waveAmp, 0.4 + frame.treble * 0.4)
        waveRight.update(frame.waveform, size / 2 + 0.18, coverY, sideWidth, waveAmp, 0.4 + frame.treble * 0.4)

        // Espectro de apoio entre a capa e o bloco de metadados.
        const barWidth = Math.min(viewW * 0.5, viewH * 0.42)
        const barTop = coverY - size / 2 - 0.4
        const barMax = 0.38 + bass * 0.24
        bars.updateRow(-barWidth / 2, barTop, barWidth, frame.bars, { maxHeight: barMax, minHeight: 0.03 })
        bars.setOpacity(0.5 + frame.energy * 0.3)

        // Metadados empilhados de cima para baixo dentro do espaço restante.
        const blockTop = barTop - barMax - 0.22
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], viewW * 0.74, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(0, blockTop - titleH / 2, 0)

        const artistH = artist.set([type.showArtist ? type.artistName : ''], Math.min(viewW * 0.72, 5), {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)
        artist.mesh.position.set(0, blockTop - titleH - 0.1 - artistH / 2, 0)

        const albumH = album.set([type.showAlbum ? type.albumTitle : ''], Math.min(viewW * 0.68, 4), {})
        album.setOpacity(type.showAlbum ? 0.7 : 0)
        album.mesh.position.set(0, blockTop - titleH - artistH - 0.18 - albumH / 2, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.84 ? Math.min(1, (args.clip.progress - 0.84) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.76, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.topY - 0.25, 0)

        // Movimento horizontal balanceado (vai e volta sem drift).
        const camSpeed = 0.2 + visual.cameraSpeed * 0.5
        ctx.camera.position.set(Math.sin(time * 0.08) * 0.22 * camSpeed, Math.cos(time * 0.05) * 0.08 * camSpeed, 10 - args.clip.progress * 0.3 * camSpeed)
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
