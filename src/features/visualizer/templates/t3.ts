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
import { coverSide, getFormatMode } from './composition'

/**
 * LAYOUT 03 — OFFSET CINEMA
 * Composição editorial assimétrica: badge + título no topo-esquerda, capa
 * grande à direita e espectro na base. A capa ampliada ao fundo cria
 * profundidade sem competir com o texto.
 */
export const Template03: VisualTemplate = {
  id: 't3',
  name: '03 — OFFSET CINEMA',
  description: 'Badge + título à esquerda, capa grande à direita, espectro na base.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0d0a17', '#070810', '#2c1f52')
    ctx.scene.add(background.mesh)

    // Badge circular com glow (canto superior esquerdo)
    const badgeGlowMaterial = new THREE.SpriteMaterial({ map: radialGlowTexture(), color: '#b84dff', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
    const badgeGlow = new THREE.Sprite(badgeGlowMaterial)
    badgeGlow.scale.setScalar(1.1)
    disposables.push(badgeGlowMaterial)
    const badgeGeometry = new THREE.CircleGeometry(0.11, 32)
    const badgeMaterial = new THREE.MeshBasicMaterial({ color: '#b84dff', toneMapped: false, transparent: true })
    const badge = new THREE.Mesh(badgeGeometry, badgeMaterial)
    badge.renderOrder = 15
    ctx.scene.add(badgeGlow, badge)
    disposables.push(badgeGeometry, badgeMaterial)

    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.06, color: '#f2edf5', tracking: 3, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(trackTitle.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.042, color: '#a99eae', tracking: 4, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const bars = track(new FFTBars(56, { thickness: 0.055, gap: 0.04, colorA: '#f2edf5', colorB: '#b84dff', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.05, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      badgeMaterial.color.set(colors.accent)
      badgeGlowMaterial.color.set(colors.accent)
      bars.setColors(colors.accent, mixHex(colors.accent, '#f2edf5', 0.6))
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
        background.update(time, 0.28 + visual.glow * 0.35 + bass * 0.18, 0)

        // Badge pulsando com o áudio
        const badgePulse = 1 + bass * 0.22 + frame.beatPulse * 0.1
        badge.scale.setScalar(badgePulse)
        badgeGlow.scale.setScalar((0.9 + bass * 0.5) * (1 + frame.transient * 0.3))
        badgeGlowMaterial.opacity = 0.35 + bass * 0.4 + frame.transient * 0.2 + frame.beatPulse * 0.12

        // Texto topo-esquerda ao lado do badge
        const badgeX = safe.leftX + 0.12
        badge.position.set(badgeX, safe.topY - 0.5, 0)
        badgeGlow.position.copy(badge.position)
        badgeGlow.position.z = 0

        const mode = getFormatMode(viewW, viewH)
        const landscape = mode === 'landscape'
        const textX = badgeX + 0.42
        const textWidth = landscape ? viewW * 0.36 : mode === 'square' ? viewW * 0.44 : viewW * 0.84 * 0.9
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], textWidth, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(textX, safe.topY - 0.42, 0)

        artist.set([type.showArtist ? type.artistName : ''], textWidth, {})
        artist.setOpacity(type.showArtist ? 0.85 : 0)
        artist.mesh.position.set(textX, safe.topY - 0.36 - titleH, 0)

        // Capa grande: direita em paisagem/quadrado, centro-baixo em retrato.
        const coverSize = coverSide(viewW, viewH, mode, 0.62, 0.4, 0.32)
        const coverX = landscape ? viewW * 0.22 : mode === 'square' ? viewW * 0.25 : 0
        const coverY = landscape ? 0.1 : mode === 'square' ? 0 : -0.45
        cover.setSize(coverSize, coverSize)
        cover.setGlowIntensity(0.25 + visual.glow * 0.45 + bass * 0.3)
        cover.group.position.set(coverX, coverY + Math.sin(time * 0.45) * 0.06, 0)
        cover.group.rotation.z = -0.01
        cover.group.rotation.y = Math.sin(time * 0.18) * 0.02
        cover.group.scale.setScalar(1 + bass * 0.03)

        // Waveform na base (barras brancas/acento)
        const barWidth = safe.width * 0.88
        const barBaseY = safe.bottomY + 0.5
        bars.updateRow(safe.leftX, barBaseY, barWidth, frame.bars, { maxHeight: 0.95 + bass * 0.4 + frame.beatPulse * 0.2, minHeight: 0.05 })
        bars.setOpacity(0.75 + frame.energy * 0.25)

        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.6, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.12, 0)

        // Câmera quase fixa com parallax mínimo
        const camSpeed = 0.2 + visual.cameraSpeed * 0.5
        ctx.camera.position.x = Math.sin(time * 0.05) * 0.18 * camSpeed
        ctx.camera.position.y = Math.cos(time * 0.04) * 0.1 * camSpeed
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
