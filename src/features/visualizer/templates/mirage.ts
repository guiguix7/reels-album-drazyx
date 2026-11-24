import * as THREE from 'three'
import type { StageContext, TemplateInstance, TemplateUpdateArgs, VisualTemplate } from '../visual.types'
import { GradientBackground } from '../objects/background'
import { ParticleField } from '../objects/particles'
import { CoverCard } from '../objects/cover-card'
import { SpectrumRing } from '../objects/bars'
import { TextLayer } from '../objects/text-layer'
import { radialGlowTexture } from '../objects/textures'
import { derivePalette, safeArea } from './template-utils'
import type { PaletteColors } from './template-utils'
import { mixHex } from '../../palette/palette'

/**
 * MIRAGE — preset principal. Storyboard de 30s: tagline → capa suspensa →
 * anéis espectrais reativos → pico no transiente → fechamento com metadados.
 */
export const MirageTemplate: VisualTemplate = {
  id: 'mirage',
  name: 'MIRAGE',
  description: 'Cena cinematográfica com capa suspensa, partículas e anéis espectrais.',
  build(ctx: StageContext): TemplateInstance {
    const disposables: Array<{ dispose(): void }> = []
    const track = <T extends { dispose(): void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    const background = track(new GradientBackground())
    ctx.scene.add(background.mesh)

    const glowCount = 3
    const glows: THREE.Sprite[] = []
    const glowTexture = radialGlowTexture()
    for (let i = 0; i < glowCount; i++) {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: i === 1 ? '#2b3a8f' : '#b84dff',
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const sprite = new THREE.Sprite(material)
      sprite.position.set((Math.random() - 0.5) * ctx.viewWidth * 0.8, (Math.random() - 0.5) * 4, -4 - i)
      sprite.scale.setScalar(5 + i * 1.5)
      sprite.renderOrder = 2
      ctx.scene.add(sprite)
      glows.push(sprite)
      disposables.push(material)
    }

    const particles = track(new ParticleField({ count: 900, area: { x: 12, y: 12, z: 9 }, color: '#bfa0ff', size: 0.09, opacity: 0.75 }))
    ctx.scene.add(particles.points)

    const cover = track(new CoverCard())
    ctx.scene.add(cover.group)

    const ring = track(new SpectrumRing(72, { radius: 2.6, thickness: 0.045, color: '#cf8aff' }))
    ctx.scene.add(ring.mesh)
    const ringOuter = track(new SpectrumRing(48, { radius: 3.3, thickness: 0.03, color: '#6b5a8f' }))
    ctx.scene.add(ringOuter.mesh)

    const tagline = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.05, color: '#f2edf5', tracking: 6, align: 'center', lineHeight: 1.35, uppercase: true }))
    ctx.scene.add(tagline.mesh)
    const artistTrack = track(new TextLayer({ font: 'title', weight: 700, sizeFrac: 0.085, color: '#f2edf5', tracking: 4, align: 'left', anchor: 'topLeft', lineHeight: 1.28, lineColors: ['#f2edf5', '#a99eae'], uppercase: true }))
    ctx.scene.add(artistTrack.mesh)
    const albumLayer = track(new TextLayer({ font: 'ui', weight: 500, sizeFrac: 0.05, color: '#a99eae', tracking: 3, align: 'left', anchor: 'topLeft', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(albumLayer.mesh)
    const cta = track(new TextLayer({ font: 'ui', weight: 600, sizeFrac: 0.05, color: '#cf8aff', tracking: 5, align: 'center', lineHeight: 1.3, uppercase: true }))
    ctx.scene.add(cta.mesh)

    let viewW = ctx.viewWidth
    let viewH = ctx.viewHeight
    const layout = (): void => {
      background.resize(viewW, viewH, -6, 10)
    }
    layout()

    let lastTexture: THREE.Texture | null = null
    let palette: PaletteColors | null = null
    let paletteKey = ''

    /** Reaplica cores somente quando a paleta muda (sem trabalho por frame). */
    const applyPalette = (colors: PaletteColors): void => {
      background.setColors(colors.top, colors.bottom, colors.backgroundGlow)
      glows.forEach((sprite, index) => {
        const material = sprite.material as THREE.SpriteMaterial
        material.color.set(index === 1 ? colors.secondary : colors.accent)
      })
      particles.setColor(colors.glow)
      ring.setColor(colors.accent)
      ringOuter.setColor(colors.secondary)
      cover.setAccent(colors.accent, mixHex(colors.accent, colors.secondary, 0.5))
    }

    return {
      update(args: TemplateUpdateArgs): void {
        const { frame, visual, type, clip, time, dt } = args
        const safe = safeArea(viewW, viewH)
        const nextPalette = derivePalette(args.palette)
        if (nextPalette.key !== paletteKey) {
          paletteKey = nextPalette.key
          palette = nextPalette
          applyPalette(nextPalette)
        }
        const pal = palette as PaletteColors

        // troca de textura da capa
        if (ctx.assets.coverTexture !== lastTexture) {
          lastTexture = ctx.assets.coverTexture
          cover.setTexture(lastTexture)
        }

        const bass = frame.bass * visual.bassForce
        const intensity = 0.35 + visual.intensity * 0.65

        background.update(time, (0.35 + visual.glow * 0.5 + bass * 0.25) * intensity, Math.sin(time * 0.07) * 0.05)

        glows.forEach((sprite, i) => {
          const t = time * (0.03 + i * 0.011) + i * 2.1
          sprite.position.x = Math.sin(t) * viewW * 0.3
          sprite.position.y = Math.cos(t * 0.8) * 2.4 + (i - 1) * 1.6
          const material = sprite.material as THREE.SpriteMaterial
          material.opacity = (0.16 + frame.mid * 0.22 + frame.treble * 0.1 + frame.beatPulse * 0.12) * intensity * (1 - i * 0.2)
        })

        particles.update(dt, bass, 0.4 + visual.cameraSpeed)
        particles.setOpacity((0.35 + frame.energy * 0.4) * (0.4 + visual.intensity * 0.6))

        // Capa suspensa: flutuação, rotação lenta, pulso sutil nos graves.
        const coverSize = viewW * 0.62
        cover.setSize(coverSize, coverSize)
        cover.setGlowIntensity(0.25 + visual.glow * 0.5 + bass * 0.35)
        cover.group.position.y = Math.sin(time * 0.5) * 0.09 + bass * 0.06
        cover.group.position.z = 0
        cover.group.rotation.y = Math.sin(time * 0.22) * 0.055 + frame.mid * 0.05
        cover.group.rotation.x = Math.cos(time * 0.17) * 0.02
        const coverPulse = 1 + bass * 0.035 + frame.beatPulse * 0.012
        cover.group.scale.setScalar(coverPulse)

        // Anéis espectrais reativos (graves + batida detectada)
        ring.update(2.35 + bass * 0.45 + frame.beatPulse * 0.14, frame.bars, 0.85, 0.05, time * 0.12, (0.35 + frame.treble * 0.5) * intensity)
        ringOuter.update(3.15 + bass * 0.7 + frame.beatPulse * 0.1, frame.bars, 0.55, 0.035, -time * 0.07, (0.2 + frame.mid * 0.4) * intensity * 0.7)

        // Tipografia por fase do trecho
        const p = clip.progress
        const taglineOpacity = Math.min((p < 0.045 ? p / 0.045 : 1) * (p > 0.1 ? Math.max(0, 1 - (p - 0.1) / 0.06) : 1), 1) * (type.showTagline ? 0.95 : 0)
        tagline.set([type.tagline], viewW * 0.84, {})
        tagline.setOpacity(taglineOpacity)
        tagline.mesh.position.set(0, safe.topY - 0.55, 0)

        // Bloco de metadados ancorado pelo topo, com borda inferior na linha segura.
        const metaOpacity = type.showArtist || type.showTrack ? 1 : 0
        const metaLines = [
          ...(type.showTrack ? [type.trackTitle] : []),
          ...(type.showArtist ? [type.artistName] : []),
        ]
        const metaW = viewW * 0.8
        const metaH = artistTrack.set(metaLines, metaW, {})
        artistTrack.setOpacity(0.95 * metaOpacity)
        artistTrack.mesh.position.set(safe.leftX, safe.bottomY + metaH, 0)

        if (type.showAlbum) {
          const albumH = albumLayer.set([type.albumTitle], metaW, {})
          albumLayer.setOpacity(0.85)
          albumLayer.mesh.position.set(safe.leftX, safe.bottomY + metaH + albumH + 0.14, 0)
        } else {
          albumLayer.setOpacity(0)
        }

        const ctaOpacity = type.showCta ? (p > 0.82 ? (p - 0.82) / 0.08 : 0) : 0
        cta.set([type.ctaText], viewW * 0.8, { color: pal.glow })
        cta.setOpacity(ctaOpacity)
        cta.mesh.position.set(0, safe.bottomY - 0.45, 0)

        // Câmera: dolly lento + orbit sutil (amplitude baixa para preservar as
        // zonas seguras do texto) + kick curto no transiente
        const camSpeed = 0.35 + visual.cameraSpeed * 0.9
        const dolly = p * 1.1 * camSpeed
        ctx.camera.position.x = Math.sin(time * 0.05) * 0.2 * camSpeed
        ctx.camera.position.y = Math.sin(time * 0.04 + 1.2) * 0.14 * camSpeed
        ctx.camera.position.z = 10 - dolly - frame.transient * 0.12 * (visual.glitch === 'off' ? 0 : 1)
        ctx.camera.lookAt(0, 0, 0)
        ctx.camera.rotation.z = Math.sin(time * 0.023) * 0.008
        void dt
      },
      resize(vw: number, vh: number): void {
        viewW = vw
        viewH = vh
        background.resize(vw, vh, -6, 10)
        layout()
      },
      dispose(): void {
        disposables.forEach((d) => d.dispose())
      },
    }
  },
}
