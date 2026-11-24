import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { WaveformLine } from '../objects/waveform-line'
import { TextLayer } from '../objects/text-layer'
import { radialGlowTexture } from '../objects/textures'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'

/**
 * VOID — espaço negativo, tipografia central, linha de waveform e
 * anel de expansão discreto nos transientes.
 */
export const VoidTemplate: VisualTemplate = {
  id: 'void',
  name: 'VOID',
  description: 'Espaço quase vazio, tipografia central e pulso de luz discreto.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0a0912', '#06070c', '#241a3d')
    ctx.scene.add(background.mesh)

    const pulseGlowMaterial = new THREE.SpriteMaterial({
      map: radialGlowTexture(),
      color: '#b84dff',
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const pulseGlow = new THREE.Sprite(pulseGlowMaterial)
    pulseGlow.position.set(0, 0.4, -2)
    pulseGlow.scale.setScalar(6)
    ctx.scene.add(pulseGlow)
    disposables.push(pulseGlowMaterial)

    const ringGeometry = new THREE.RingGeometry(0.96, 1, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: '#cf8aff',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.renderOrder = 12
    ctx.scene.add(ring)
    disposables.push(ringGeometry, ringMaterial)

    const waveform = track(new WaveformLine(96, '#f2edf5', 0.8))
    ctx.scene.add(waveform.line)

    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.05, color: '#a99eae', tracking: 8, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.09, color: '#f2edf5', tracking: 3, align: 'center', lineHeight: 1.22, uppercase: true }))
    ctx.scene.add(trackTitle.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.045, color: '#8d8398', tracking: 4, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(album.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.05, color: '#cf8aff', tracking: 6, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let ringScale = 0.2
    let ringOpacity = 0
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      pulseGlowMaterial.color.set(colors.accent)
      ringMaterial.color.set(colors.glow)
      waveform.setColor(colors.glow)
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
        background.update(time, 0.16 + visual.glow * 0.25 + bass * 0.18, 0)

        pulseGlow.scale.setScalar(4.4 + bass * 1.6)
        pulseGlowMaterial.opacity = 0.1 + bass * 0.3 + frame.energy * 0.12 + frame.beatPulse * 0.1

        // Anel de expansão no transiente ou na batida detectada
        if ((frame.transient > 0.92 || frame.beatPulse > 0.82) && visual.glitch !== 'off') {
          ringScale = 0.6
          ringOpacity = 0.85
        }
        ringScale += args.dt * 5.5
        ringOpacity *= Math.exp(-args.dt * 4.5)
        ring.scale.setScalar(ringScale)
        ringMaterial.opacity = ringOpacity * (0.4 + visual.glow * 0.5)
        ring.position.y = 0.4

        waveform.update(
          frame.waveform,
          safe.leftX,
          0.4,
          safe.width * 0.86,
          1.15,
          0.55 + frame.energy * 0.4,
        )

        const artistH = artist.set([type.showArtist ? type.artistName : ''], viewW * 0.7, {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)
        artist.mesh.position.set(0, safe.topY - 0.7, 0)

        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], viewW * 0.84, {})
        trackTitle.setOpacity(type.showTrack ? 0.98 : 0)
        trackTitle.mesh.position.set(0, safe.topY - 0.85 - artistH - titleH * 0.55, 0)

        album.set([type.showAlbum ? type.albumTitle : ''], viewW * 0.7, {})
        album.setOpacity(type.showAlbum ? 0.75 : 0)
        album.mesh.position.set(0, safe.bottomY - 0.45, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.8, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.12, 0)

        // Câmera: quase estática com respiração mínima
        ctx.camera.position.x = Math.sin(time * 0.04) * 0.12 * (0.3 + visual.cameraSpeed)
        ctx.camera.position.y = Math.cos(time * 0.03) * 0.08 * (0.3 + visual.cameraSpeed)
        ctx.camera.position.z = 10
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
