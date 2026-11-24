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
 * TEMPLATE 03 — wireframe favorito do usuário: badge circular + título no
 * topo-esquerda, capa grande à direita e waveform na base. Estética de
 * player-card sobre fundo escuro com a capa ampliada bem sutil.
 */
export const Template03: VisualTemplate = {
  id: 't3',
  name: 'TEMPLATE 03',
  description: 'Badge + título no topo, capa grande à direita, waveform na base.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0d0a17', '#070810', '#2c1f52')
    ctx.scene.add(background.mesh)

    // Capa ampliada como textura de fundo (muito sutil, "respira" com os graves)
    const bgCoverGeometry = new THREE.PlaneGeometry(1, 1)
    const bgCoverMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false })
    const bgCover = new THREE.Mesh(bgCoverGeometry, bgCoverMaterial)
    bgCover.position.set(0, 0.6, -4)
    bgCover.renderOrder = -5
    ctx.scene.add(bgCover)
    disposables.push(bgCoverGeometry, bgCoverMaterial)

    const dimmerMaterial = new THREE.MeshBasicMaterial({ color: '#070810', transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false })
    const dimmer = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dimmerMaterial)
    dimmer.position.set(0, 0.6, -3.8)
    dimmer.renderOrder = -4
    ctx.scene.add(dimmer)
    disposables.push(dimmerMaterial)

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
          bgCoverMaterial.map = lastTexture
          bgCoverMaterial.needsUpdate = true
        }

        const bass = frame.bass * visual.bassForce
        background.update(time, 0.28 + visual.glow * 0.35 + bass * 0.18, 0)

        // Fundo com capa ampliada respirando
        const bgPulse = 1 + bass * 0.04
        bgCover.scale.set(9.5 * bgPulse, 9.5 * bgPulse, 1)
        // Capa fantasma só como textura de fundo: baixa o bastante para não competir com o texto.
        bgCoverMaterial.opacity = 0.035 + frame.energy * 0.035 + frame.beatPulse * 0.03
        dimmer.scale.set(10, 11, 1)

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

        const textX = badgeX + 0.42
        const textWidth = viewW * 0.52
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], textWidth, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(textX, safe.topY - 0.42, 0)

        artist.set([type.showArtist ? type.artistName : ''], textWidth, {})
        artist.setOpacity(type.showArtist ? 0.85 : 0)
        artist.mesh.position.set(textX, safe.topY - 0.36 - titleH, 0)

        // Capa grande à direita, levemente inclinada
        const coverSize = viewW * 0.66
        cover.setSize(coverSize, coverSize)
        cover.setGlowIntensity(0.25 + visual.glow * 0.45 + bass * 0.3)
        cover.group.position.set(viewW * 0.05, 0.35 + Math.sin(time * 0.45) * 0.07, 0)
        cover.group.rotation.z = -0.018
        cover.group.rotation.y = Math.sin(time * 0.18) * 0.04
        cover.group.scale.setScalar(1 + bass * 0.03)

        // Waveform na base (barras brancas/acento)
        const barWidth = safe.width * 0.88
        const barBaseY = safe.bottomY + 0.5
        bars.updateRow(safe.leftX, barBaseY, barWidth, frame.bars, { maxHeight: 0.95 + bass * 0.4 + frame.beatPulse * 0.2, minHeight: 0.05 })
        bars.setOpacity(0.75 + frame.energy * 0.25)

        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.8, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, barBaseY - 0.42, 0)

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
