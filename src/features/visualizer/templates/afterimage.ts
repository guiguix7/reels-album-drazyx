import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { ParticleField } from '../objects/particles'
import { CoverCard } from '../objects/cover-card'
import { TextLayer } from '../objects/text-layer'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'
import { coverSide, getFormatMode } from './composition'

/**
 * AFTERIMAGE — a capa como memória persistente: ecos em rastro com atrasos
 * crescentes, camera lateral lenta e tipografia central dominante.
 */
export const AfterimageTemplate: VisualTemplate = {
  id: 'afterimage',
  name: 'AFTERIMAGE',
  description: 'Ecos translúcidos da capa em rastro, como uma memória persistente.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    background.setColors('#0c0916', '#070810', '#3a2464')
    ctx.scene.add(background.mesh)

    const particles = track(new ParticleField({ count: 380, area: { x: 10, y: 10, z: 8 }, color: '#9d8fd6', size: 0.06, opacity: 0.6 }))
    ctx.scene.add(particles.points)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    // Ecos da capa (rastro). Materiais próprios, mesma textura compartilhada.
    const ECHO_COUNT = 4
    const echoGeometry = new THREE.PlaneGeometry(1, 1)
    disposables.push(echoGeometry)
    const echoes: THREE.Mesh[] = []
    const echoMaterials: THREE.MeshBasicMaterial[] = []
    for (let i = 0; i < ECHO_COUNT; i++) {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.38 - i * 0.08,
        depthWrite: false,
        toneMapped: false,
      })
      const mesh = new THREE.Mesh(echoGeometry, material)
      mesh.renderOrder = 4 + i
      mesh.position.z = -0.25 - i * 0.35
      ctx.scene.add(mesh)
      echoes.push(mesh)
      echoMaterials.push(material)
      disposables.push(material)
    }

    const trackTitle = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.085, color: '#f2edf5', tracking: 4, align: 'center', anchor: 'topLeft', lineHeight: 1.25, uppercase: true, wrap: true }))
    ctx.scene.add(trackTitle.mesh)
    const artist = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.05, color: '#a99eae', tracking: 6, align: 'center', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(artist.mesh)
    const album = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.045, color: '#8d8398', tracking: 3, align: 'center', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(album.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.05, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    let lastTexture: THREE.Texture | null = null
    // Estado do rastro: ecos perseguem a capa com constantes de tempo distintas.
    const echoState = echoes.map(() => ({ x: 0, y: 0, scale: 1 }))
    let palette: PaletteColors | null = null
    let paletteKey = ''

    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      particles.setColor(colors.glow)
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.5))
    }

    return {
      update(args: TemplateUpdateArgs): void {
        const { frame, visual, type, time, dt } = args
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
          echoes.forEach((mesh) => {
            const material = mesh.material as THREE.MeshBasicMaterial
            material.map = lastTexture
            material.color.set(lastTexture ? '#ffffff' : '#221a33')
            material.needsUpdate = true
          })
        }

        const bass = frame.bass * visual.bassForce
        background.update(time, 0.3 + visual.glow * 0.4 + bass * 0.2, Math.sin(time * 0.05) * 0.08)
        particles.update(dt, bass * 0.7, 0.8 + visual.cameraSpeed * 1.4)
        particles.setOpacity(0.3 + frame.energy * 0.35)

        // Capa principal flutuando com deriva lateral contínua. Em paisagem
        // ela fica à direita, deixando a coluna de texto à esquerda.
        const mode = getFormatMode(viewW, viewH)
        const landscape = mode === 'landscape'
        const coverSize = coverSide(viewW, viewH, mode, 0.58, 0.5, 0.46)
        cover.setSize(coverSize, coverSize)
        cover.setGlowIntensity(0.3 + visual.glow * 0.45)
        const baseX = landscape ? viewW * 0.22 : 0
        const mainX = baseX + Math.sin(time * 0.16) * viewW * 0.04
        const mainY = (landscape ? 0.1 : mode === 'square' ? -0.2 : 0.2) + Math.sin(time * 0.42) * 0.12 + bass * 0.05
        cover.group.position.set(mainX, mainY, 0)
        cover.group.rotation.y = Math.sin(time * 0.2) * 0.025
        cover.group.rotation.z = Math.sin(time * 0.13) * 0.008
        cover.group.scale.setScalar(1 + bass * 0.03 + frame.beatPulse * 0.012)

        // Ecos perseguem com lag; graves abrem o espaçamento
        echoState.forEach((state, i) => {
          const tau = 0.28 + i * 0.16
          const k = 1 - Math.exp(-dt / tau)
          const spread = 1 + bass * 0.5 + frame.beatPulse * 0.1
          const tx = mainX * spread
          const ty = mainY * spread * 0.6 - (i + 1) * 0.12
          state.x += (tx - state.x) * k
          state.y += (ty - state.y) * k
          const mesh = echoes[i]
          mesh.position.set(state.x, state.y, mesh.position.z)
          const s = coverSize * (1 - (i + 1) * 0.07)
          mesh.scale.set(s, s, 1)
          const material = echoMaterials[i]
          material.opacity = (0.34 - i * 0.07) * (0.55 + frame.energy * 0.6)
        })

        // Bloco editorial no topo (esquerda em 16:9); a arte respira abaixo.
        const textW = landscape ? viewW * 0.44 : viewW * 0.8
        const textX = landscape ? safe.leftX : -textW / 2
        const titleTop = safe.topY - 0.18
        const titleH = trackTitle.set([type.showTrack ? type.trackTitle : ''], textW, {})
        trackTitle.setOpacity(type.showTrack ? 0.96 : 0)
        trackTitle.mesh.position.set(textX, titleTop, 0)

        const artistH = artist.set([type.showArtist ? type.artistName : ''], textW, {})
        artist.setOpacity(type.showArtist ? 0.9 : 0)
        const artistTop = titleTop - titleH - 0.14
        artist.mesh.position.set(textX, artistTop, 0)

        album.set([type.showAlbum ? type.albumTitle : ''], textW, {})
        album.setOpacity(type.showAlbum ? 0.8 : 0)
        album.mesh.position.set(textX, artistTop - artistH - 0.1, 0)

        const ctaOpacity = type.showCta && args.clip.progress > 0.82 ? Math.min(1, (args.clip.progress - 0.82) / 0.08) : 0
        cta.set([type.ctaText], viewW * 0.6, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY + 0.12, 0)

        // Câmera: translação lateral lenta (amplitude contida para o safe area)
        const camSpeed = 0.3 + visual.cameraSpeed * 0.8
        ctx.camera.position.x = Math.sin(time * 0.09) * 0.28 * camSpeed
        ctx.camera.position.y = Math.cos(time * 0.06) * 0.14 * camSpeed
        ctx.camera.position.z = 10 - args.clip.progress * 0.5 * camSpeed
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
