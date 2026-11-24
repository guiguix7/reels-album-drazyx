import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { FFTBars } from '../objects/bars'
import { TextLayer } from '../objects/text-layer'
import { radialGlowTexture } from '../objects/textures'
import { safeArea } from './template-utils'

/**
 * TEMPLATE 05 — wireframe favorito do usuário: blocos empilhados à esquerda
 * (álbum, faixa, status) e disco circular com a capa + waveform à direita.
 * O disco gira lentamente como um vinil e pulsa com os graves.
 */
export const Template05: VisualTemplate = {
  id: 't5',
  name: 'TEMPLATE 05',
  description: 'Painéis empilhados à esquerda, disco com capa + waveform à direita.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0d0a18', '#070810', '#33235e')
    ctx.scene.add(background.mesh)

    // Disco circular com a capa
    const discGeometry = new THREE.CircleGeometry(1, 64)
    const discMaterial = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })
    const disc = new THREE.Mesh(discGeometry, discMaterial)
    disc.renderOrder = 12
    disposables.push(discGeometry, discMaterial)

    const discEdgeGeometry = new THREE.RingGeometry(0.99, 1.045, 64)
    const discEdgeMaterial = new THREE.MeshBasicMaterial({ color: '#b84dff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, toneMapped: false })
    const discEdge = new THREE.Mesh(discEdgeGeometry, discEdgeMaterial)
    discEdge.renderOrder = 13
    disposables.push(discEdgeGeometry, discEdgeMaterial)

    const discGlowMaterial = new THREE.SpriteMaterial({ map: radialGlowTexture(), color: '#b84dff', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })
    const discGlow = new THREE.Sprite(discGlowMaterial)
    disposables.push(discGlowMaterial)

    ctx.scene.add(discGlow, disc, discEdge)

    // Blocos empilhados à esquerda (painéis com fundo e borda)
    const albumBlock = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.05, color: '#f2edf5', tracking: 3, align: 'left', anchor: 'topLeft', lineHeight: 1.35, uppercase: true, panel: { fill: 'rgba(17, 16, 26, 0.92)', border: 'rgba(184, 77, 255, 0.35)', padFrac: 0.055 } }))
    ctx.scene.add(albumBlock.mesh)
    const trackBlock = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.072, color: '#f2edf5', tracking: 2, align: 'left', anchor: 'topLeft', lineHeight: 1.4, uppercase: true, wrap: true, panel: { fill: 'rgba(24, 19, 29, 0.94)', border: 'rgba(184, 77, 255, 0.25)', padFrac: 0.055 } }))
    ctx.scene.add(trackBlock.mesh)
    const statusBlock = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.044, color: '#a99eae', tracking: 4, align: 'left', anchor: 'topLeft', lineHeight: 1.35, uppercase: true, panel: { fill: 'rgba(17, 16, 26, 0.88)', border: 'rgba(169, 158, 174, 0.18)', padFrac: 0.055 } }))
    ctx.scene.add(statusBlock.mesh)

    const bars = track(new FFTBars(40, { thickness: 0.05, gap: 0.035, colorA: '#f2edf5', colorB: '#b84dff', orientation: 'row', origin: 'center' }))
    ctx.scene.add(bars.mesh)

    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.058, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null

    return {
      update(args: TemplateUpdateArgs): void {
        const { frame, visual, type, time } = args
        const safe = safeArea(viewW, viewH)

        if (ctx.assets.coverTexture !== lastTexture) {
          lastTexture = ctx.assets.coverTexture
          discMaterial.map = lastTexture
          discMaterial.color.set(lastTexture ? '#ffffff' : '#221a33')
          discMaterial.needsUpdate = true
        }

        const bass = frame.bass * visual.bassForce
        background.update(time, 0.26 + visual.glow * 0.32 + bass * 0.16, Math.sin(time * 0.05 + 1) * 0.04)

        // Disco: gira como vinil, pulsa nos graves
        const discRadius = viewW * 0.185
        const discX = viewW * 0.19
        const discY = 0.9
        disc.position.set(discX, discY, 0)
        disc.scale.setScalar(discRadius * (1 + bass * 0.025))
        disc.rotation.z -= args.dt * (0.25 + frame.energy * 0.35) // rotação contínua
        discEdge.position.set(discX, discY, 0.01)
        discEdge.scale.setScalar(discRadius)
        discEdge.rotation.z = disc.rotation.z
        discGlow.position.set(discX, discY, -0.4)
        discGlow.scale.setScalar(discRadius * 3.2)
        discGlowMaterial.opacity = 0.22 + bass * 0.35 + frame.transient * 0.15

        // Blocos à esquerda: largura limitada para nunca invadir o disco à direita.
        const blockWidth = viewW * 0.38
        const blockX = safe.leftX + 0.05

        albumBlock.set([type.showAlbum ? type.albumTitle : ''], blockWidth, {})
        albumBlock.setOpacity(type.showAlbum ? 0.97 : 0)
        albumBlock.mesh.position.set(blockX, safe.topY - 0.35, 0)

        trackBlock.set(
          [
            ...(type.showTrack ? [type.trackTitle] : []),
            ...(type.showArtist ? [type.artistName] : []),
          ],
          blockWidth,
          { lineColors: ['#f2edf5', '#a99eae'] },
        )
        trackBlock.setOpacity(type.showTrack || type.showArtist ? 0.97 : 0)
        trackBlock.mesh.position.set(blockX, 1.3, 0)

        statusBlock.set(['NOW PLAYING', 'SLOWED + REVERB'], blockWidth, { lineColors: ['#cf8aff', '#a99eae'] })
        statusBlock.setOpacity(0.9)
        statusBlock.mesh.position.set(blockX, -1.3, 0)

        // Waveform sob o disco
        const barWidth = viewW * 0.4
        const barBaseY = discY - discRadius - 0.55
        bars.updateRow(discX - barWidth / 2, barBaseY, barWidth, frame.bars, { maxHeight: 0.75 + bass * 0.35, minHeight: 0.04 })
        bars.setOpacity(0.7 + frame.energy * 0.3)

        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.8, {})
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.12, 0)

        // Câmera discreta
        const camSpeed = 0.2 + visual.cameraSpeed * 0.45
        ctx.camera.position.x = Math.sin(time * 0.04) * 0.14 * camSpeed
        ctx.camera.position.y = Math.cos(time * 0.035) * 0.09 * camSpeed
        ctx.camera.position.z = 10 - args.clip.progress * 0.3 * camSpeed
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
