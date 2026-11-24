import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { CoverCard } from '../objects/cover-card'
import { TextLayer } from '../objects/text-layer'
import { radialGlowTexture } from '../objects/textures'
import { derivePalette } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex, withAlpha } from '../../palette/palette'

/**
 * LAYOUT 05 — ALBUM PLAYER SPLIT
 * Capa/identidade à esquerda e painel de player à direita em 16:9 e 1:1.
 * Em 9:16 a composição empilha (capa em cima, player embaixo) em vez de
 * encolher o layout paisagem. O progresso é o trecho real selecionado.
 */
export const Template05: VisualTemplate = {
  id: 't5',
  name: '05 — ALBUM PLAYER SPLIT',
  description: 'Capa à esquerda e player com progresso real à direita (empilhado em 9:16).',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#14060c', '#070810', '#4a1024')
    ctx.scene.add(background.mesh)

    // Textura atmosférica duplicada da capa (não destrói a arte original).
    const washGeometry = new THREE.PlaneGeometry(1, 1)
    const washMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.09, depthWrite: false, toneMapped: false })
    const wash = new THREE.Mesh(washGeometry, washMaterial)
    wash.position.z = -4.5
    wash.renderOrder = -5
    ctx.scene.add(wash)
    disposables.push(washGeometry, washMaterial)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    // Painel do player
    const panelGeometry = new THREE.PlaneGeometry(1, 1)
    const panelMaterial = new THREE.MeshBasicMaterial({ color: '#11101a', transparent: true, opacity: 0.9, toneMapped: false })
    const panel = new THREE.Mesh(panelGeometry, panelMaterial)
    panel.renderOrder = 5
    ctx.scene.add(panel)
    disposables.push(panelGeometry, panelMaterial)

    const panelGlowMaterial = new THREE.SpriteMaterial({ map: radialGlowTexture(), color: '#b84dff', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })
    const panelGlow = new THREE.Sprite(panelGlowMaterial)
    panelGlow.renderOrder = 4
    ctx.scene.add(panelGlow)
    disposables.push(panelGlowMaterial)

    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.072, color: '#f2edf5', tracking: 2, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true, wrap: true, panel: { fill: 'rgba(24, 19, 29, 0.94)', border: 'rgba(184, 77, 255, 0.25)', padFrac: 0.05 } }))
    ctx.scene.add(trackTitle.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.042, color: '#a99eae', tracking: 5, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.036, color: '#8d8398', tracking: 4, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(album.mesh)

    const status = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.032, color: '#a99eae', tracking: 6, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(status.mesh)

    const bars = track(new FFTBars(32, { thickness: 0.045, gap: 0.035, colorA: '#f2edf5', colorB: '#b84dff', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    // Trilha e preenchimento do progresso (o preenchimento é o trecho real).
    const progressTrackGeometry = new THREE.PlaneGeometry(1, 1)
    const progressTrackMaterial = new THREE.MeshBasicMaterial({ color: '#3a3050', transparent: true, opacity: 0.9, toneMapped: false })
    const progressTrack = new THREE.Mesh(progressTrackGeometry, progressTrackMaterial)
    progressTrack.renderOrder = 20
    const progressFillGeometry = new THREE.PlaneGeometry(1, 1)
    const progressFillMaterial = new THREE.MeshBasicMaterial({ color: '#b84dff', transparent: true, toneMapped: false })
    const progressFill = new THREE.Mesh(progressFillGeometry, progressFillMaterial)
    progressFill.renderOrder = 21
    ctx.scene.add(progressTrack, progressFill)
    disposables.push(progressTrackGeometry, progressTrackMaterial, progressFillGeometry, progressFillMaterial)

    // Símbolos decorativos de transporte (não são controles de playback).
    const playGeometry = new THREE.CircleGeometry(1, 3)
    const playMaterial = new THREE.MeshBasicMaterial({ color: '#f2edf5', transparent: true, toneMapped: false })
    const playGlyph = new THREE.Mesh(playGeometry, playMaterial)
    playGlyph.renderOrder = 22
    const pauseGeometry = new THREE.PlaneGeometry(1, 1)
    const pauseMaterial = new THREE.MeshBasicMaterial({ color: '#a99eae', transparent: true, toneMapped: false })
    const pauseA = new THREE.Mesh(pauseGeometry, pauseMaterial)
    const pauseB = new THREE.Mesh(pauseGeometry, pauseMaterial)
    pauseA.renderOrder = 22
    pauseB.renderOrder = 22
    ctx.scene.add(playGlyph, pauseA, pauseB)
    disposables.push(playGeometry, playMaterial, pauseGeometry, pauseMaterial)

    const timeLabel = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.03, color: '#8d8398', tracking: 2, align: 'right', anchor: 'topLeft', lineHeight: 1.3, uppercase: false }))
    ctx.scene.add(timeLabel.mesh)

    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.038, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      panelGlowMaterial.color.set(colors.accent)
      bars.setColors(colors.accent, mixHex(colors.accent, '#f2edf5', 0.55))
      cover.setAccent(colors.accent, withAlpha(colors.accent, 0.5))
      progressFillMaterial.color.set(colors.accent)
      playMaterial.color.set(colors.glow)
    }

    const formatClock = (seconds: number): string => {
      const safe = Math.max(0, Math.round(seconds))
      return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
    }

    return {
      update(args: TemplateUpdateArgs): void {
        const { frame, visual, type, time, clip } = args
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
          washMaterial.map = lastTexture
          washMaterial.needsUpdate = true
        }

        background.update(time, 0.24 + visual.glow * 0.3 + bass * 0.16, Math.sin(time * 0.04) * 0.05)
        wash.scale.set(viewW * 1.6, viewH * 1.6, 1)
        wash.position.set(0, 0.4, -4.5)
        washMaterial.opacity = 0.05 + frame.energy * 0.05

        const portrait = viewH > viewW * 1.15
        const coverSize = portrait ? Math.min(viewW * 0.66, viewH * 0.34) : Math.min(viewW * 0.42, viewH * 0.58)
        const coverX = portrait ? 0 : -viewW * 0.22
        const coverY = portrait ? viewH * 0.19 : 0.45

        cover.setSize(coverSize, coverSize)
        cover.setGlowIntensity(0.22 + visual.glow * 0.4 + bass * 0.26)
        cover.group.position.set(coverX, coverY + Math.sin(time * 0.3) * 0.06, 0)
        cover.group.rotation.z = Math.sin(time * 0.14) * 0.01
        cover.group.rotation.y = Math.sin(time * 0.18) * 0.04
        cover.group.scale.setScalar(1 + bass * 0.024 + frame.beatPulse * 0.01)

        const panelW = portrait ? viewW * 0.82 : viewW * 0.44
        const panelH = portrait ? viewH * 0.34 : viewH * 0.62
        const panelX = portrait ? 0 : viewW * 0.23
        const panelY = portrait ? -viewH * 0.16 : 0.3
        panel.scale.set(panelW, panelH, 1)
        panel.position.set(panelX, panelY, 0)
        panelGlow.position.set(panelX, panelY, -0.2)
        panelGlow.scale.setScalar(Math.max(panelW, panelH) * 1.3)

        const left = panelX - panelW / 2 + panelW * 0.07
        const contentW = panelW * 0.86
        const top = panelY + panelH / 2 - panelH * 0.1

        status.set(['NOW PLAYING'], contentW, { color: pal.glow })
        status.setOpacity(0.85)
        status.mesh.position.set(left, top, 0)

        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], contentW, {
          panel: { fill: 'rgba(24, 19, 29, 0.94)', border: withAlpha(pal.accent, 0.3), padFrac: 0.05 },
        })
        trackTitle.setOpacity(type.showTrack ? 0.98 : 0)
        trackTitle.mesh.position.set(left, top - 0.3, 0)

        artist.set([type.showArtist ? type.artistName : ''], contentW, {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)
        artist.mesh.position.set(left, top - 0.36 - titleH, 0)

        album.set([type.showAlbum ? type.albumTitle : ''], contentW, {})
        album.setOpacity(type.showAlbum ? 0.7 : 0)
        album.mesh.position.set(left, top - 0.62 - titleH, 0)

        // Ear: barras de frequência dentro do painel.
        const barsY = panelY + panelH * 0.06
        bars.updateRow(left, barsY, contentW, frame.bars, {
          maxHeight: panelH * 0.18 + bass * 0.2 + frame.beatPulse * 0.08,
          minHeight: 0.02,
        })
        bars.setOpacity(0.55 + frame.energy * 0.35)

        // Progresso real do trecho selecionado.
        const progressW = contentW
        const progressY = panelY - panelH * 0.18
        const progressH = Math.max(0.028, panelH * 0.016)
        progressTrack.scale.set(progressW, progressH, 1)
        progressTrack.position.set(left + progressW / 2, progressY, 0)
        const filled = Math.max(0.0001, Math.min(1, clip.progress)) * progressW
        progressFill.scale.set(filled, progressH * 1.6, 1)
        progressFill.position.set(left + filled / 2, progressY, 0.01)

        // Símbolos decorativos abaixo do progresso.
        const glyphY = progressY - panelH * 0.1
        const glyphSize = Math.max(0.09, panelH * 0.045)
        playGlyph.scale.set(glyphSize, glyphSize, 1)
        playGlyph.position.set(left + glyphSize * 0.9, glyphY, 0)
        playGlyph.rotation.z = -Math.PI / 2
        pauseA.scale.set(glyphSize * 0.16, glyphSize * 0.9, 1)
        pauseA.position.set(left + glyphSize * 2.2, glyphY, 0)
        pauseB.scale.set(glyphSize * 0.16, glyphSize * 0.9, 1)
        pauseB.position.set(left + glyphSize * 2.6, glyphY, 0)

        timeLabel.set([`${formatClock(clip.start + clip.progress * (clip.end - clip.start))} / ${formatClock(clip.end)}`], contentW * 0.5, {})
        timeLabel.setOpacity(0.75)
        timeLabel.mesh.position.set(left + contentW * 0.5, glyphY - glyphSize * 0.4, 0)

        const ctaOpacity = type.showCta && clip.progress > 0.84 ? Math.min(1, (clip.progress - 0.84) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.8, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, portrait ? -viewH * 0.42 : -viewH * 0.42, 0)

        const camSpeed = 0.14 + visual.cameraSpeed * 0.35
        ctx.camera.position.set(Math.sin(time * 0.04) * 0.08 * camSpeed, Math.cos(time * 0.03) * 0.06 * camSpeed, 10 - clip.progress * 0.2 * camSpeed)
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
