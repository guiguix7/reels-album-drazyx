import * as THREE from 'three'
import { getAudioEngine } from '../audio/AudioEngine'
import type { PaletteSettings, TemplateId, TypeSettings, VisualSettings } from '../project/project.types'
import { DEFAULT_PALETTE } from '../project/project.defaults'
import type { SceneTransition, StoryboardConfig } from '../storyboard/storyboard.types'
import { effectiveType, effectiveVisual, findSceneAt } from '../storyboard/storyboard.utils'
import { TEMPLATE_REGISTRY } from './templates/registry'
import { applyMotionProfile, applyVisualLoop, hashSeed, loopBlend } from './motion/motion.utils'
import { FinishPass } from './objects/finish-pass'
import { createDefaultCoverCanvas } from './objects/default-cover'
import { CAMERA_Z, VIEW_HEIGHT, fovForViewHeight } from './visual.types'
import type { StageAssets, TemplateInstance } from './visual.types'

/**
 * Motor visual: renderiza a cena do template ativo no canvas dedicado,
 * consome o frame normalizado do AudioEngine e aplica o pass de acabamento.
 * Totalmente desacoplado da UI do editor.
 */
export class VisualEngine {
  readonly canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private finish: FinishPass
  private instance: TemplateInstance | null = null
  private templateId: TemplateId | null = null
  private clock = new THREE.Clock()
  private time = 0
  private raf: number | null = null
  private viewHeight = VIEW_HEIGHT
  private viewWidth = VIEW_HEIGHT
  private width = 1080
  private height = 1920

  private visual: VisualSettings
  /** Parâmetros do início do trecho — usados no fechamento do loop visual. */
  private openingVisual: VisualSettings
  private type: TypeSettings
  private palette: PaletteSettings = DEFAULT_PALETTE
  private clip = { start: 0, end: 30, progress: 0 }

  private storyboard: StoryboardConfig | null = null
  private activeSceneId: string | null = null
  private curtain: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private transitionKind: SceneTransition = 'cut'
  private transitionRemaining = 0
  private transitionDuration = 0

  private assets: StageAssets = { coverTexture: null, hasCover: false }
  private defaultCoverTexture: THREE.Texture | null = null
  private loadingImage: HTMLImageElement | null = null

  constructor(
    canvas: HTMLCanvasElement,
    visual: VisualSettings,
    type: TypeSettings,
  ) {
    this.canvas = canvas
    this.visual = visual
    this.openingVisual = visual
    this.type = type

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      // THREE 0.172 ignora alpha:false; com premultipliedAlpha:true o ANGLE compõe
      // o canvas de modo que todo material transparente (sprites, textos, partículas)
      // desaparece na saída. premultipliedAlpha:false usa blending clássico e resolve.
      premultipliedAlpha: false,
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.04
    this.renderer.setPixelRatio(1)
    this.renderer.setClearColor('#070810', 1)

    this.scene.fog = new THREE.FogExp2(new THREE.Color('#070810').getHex(), 0.016)

    this.camera = new THREE.PerspectiveCamera(fovForViewHeight(CAMERA_Z, VIEW_HEIGHT), 9 / 16, 0.1, 100)
    this.camera.position.set(0, 0, CAMERA_Z)

    // Cortina de transição presa à câmera: cobre a tela mesmo durante o dolly.
    this.curtain = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    )
    this.curtain.position.z = -1
    this.curtain.renderOrder = 1000
    this.curtain.visible = false
    this.camera.add(this.curtain)
    this.scene.add(this.camera)

    this.finish = new FinishPass(this.renderer, this.width, this.height)
    this.applyDefaultCover()
    this.setResolution(this.width, this.height)
  }

  /* ---------- configuração vinda do estado do projeto ---------- */

  setConfig(visual: VisualSettings, type: TypeSettings): void {
    this.visual = visual
    this.openingVisual = visual
    this.type = type
  }

  setClip(start: number, end: number): void {
    this.clip = { start, end, progress: 0 }
  }

  /** Ativa/desativa o storyboard; ao desligar, volta ao template avulso escolhido na galeria. */
  setStoryboard(config: StoryboardConfig, fallbackTemplateId: TemplateId): void {
    this.storyboard = config
    if (!config.enabled || !config.scenes.length) {
      this.activeSceneId = null
      this.hideTransition()
      this.setTemplate(fallbackTemplateId)
      return
    }
    if (this.activeSceneId && !config.scenes.some((scene) => scene.id === this.activeSceneId)) {
      this.activeSceneId = null
      this.hideTransition()
    }
  }

  /** Paleta aplicada no update dos templates (sem reconstruir a cena). */
  setPalette(palette: PaletteSettings): void {
    this.palette = palette
  }

  setTemplate(id: TemplateId): void {
    if (this.templateId === id) return
    this.templateId = id
    this.instance?.dispose()
    // dispose() dos templates libera recursos mas não remove os meshes da cena;
    // sem o clear, objetos do template anterior continuam renderizando por cima.
    this.scene.clear()
    // A câmera carrega a cortina de transição e precisa voltar para a cena.
    this.scene.add(this.camera)
    this.instance = null
    const template = TEMPLATE_REGISTRY[id]
    if (!template) return
    this.instance = template.build({
      scene: this.scene,
      camera: this.camera,
      viewWidth: this.viewWidth,
      viewHeight: this.viewHeight,
      assets: this.assets,
    })
    this.instance.resize(this.viewWidth, this.viewHeight)
  }

  setCoverUrl(url: string | null): void {
    if (!url) {
      this.assets.hasCover = false
      this.applyDefaultCover()
      return
    }
    const image = new Image()
    this.loadingImage = image
    image.onload = () => {
      if (this.loadingImage !== image) return
      this.assets.coverTexture?.dispose()
      const texture = new THREE.Texture(image)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.needsUpdate = true
      this.assets = { coverTexture: texture, hasCover: true }
      this.rebuildCurrentTemplate()
    }
    image.onerror = () => {
      // Origem bloqueou ou arquivo inválido: usa capa padrão sem travar.
      if (this.loadingImage !== image) return
      this.assets.hasCover = false
      this.applyDefaultCover()
    }
    image.src = url
  }

  /** Texturas trocam no build do template — reconstrói barato ao trocar de capa. */
  private rebuildCurrentTemplate(): void {
    if (!this.templateId) return
    const id = this.templateId
    this.templateId = null
    this.setTemplate(id)
  }

  private applyDefaultCover(): void {
    if (!this.defaultCoverTexture) {
      const texture = new THREE.CanvasTexture(createDefaultCoverCanvas())
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      this.defaultCoverTexture = texture
    }
    this.assets = { coverTexture: this.defaultCoverTexture, hasCover: false }
    this.rebuildCurrentTemplate()
  }

  /* ---------- resolução / tamanho ---------- */

  setResolution(width: number, height: number): void {
    this.width = width
    this.height = height
    this.renderer.setSize(width, height, false)
    this.finish.setSize(width, height)
    const aspect = width / height
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    this.viewHeight = VIEW_HEIGHT
    this.viewWidth = VIEW_HEIGHT * aspect
    this.resizeCurtain()
    this.instance?.resize(this.viewWidth, this.viewHeight)
  }

  getResolution(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }

  /* ---------- loop ---------- */

  start(): void {
    if (this.raf != null) return
    this.clock.start()
    const loop = (): void => {
      this.raf = requestAnimationFrame(loop)
      this.renderFrame()
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop(): void {
    if (this.raf != null) cancelAnimationFrame(this.raf)
    this.raf = null
  }

  private renderFrame(): void {
    const dt = Math.min(0.06, this.clock.getDelta())
    const frame = getAudioEngine().getFrame()

    // Tempo do visual: durante o playback o relógio do áudio é a fonte de verdade,
    // então seek reverso reconstrói o mesmo frame e o export reproduz o preview.
    // Sem áudio (ou pausado) a cena continua respirando em ritmo reduzido.
    const audioLoaded = frame.duration > 0
    if (audioLoaded && frame.playing) this.time = frame.time
    else this.time += dt * (audioLoaded ? 0.25 : 1)

    const clipSpan = Math.max(0.001, this.clip.end - this.clip.start)
    this.clip.progress = Math.max(0, Math.min(1, (frame.time - this.clip.start) / clipSpan))

    const motionSeed = hashSeed([this.templateId ?? 'none', Math.round(this.clip.start * 10)])
    let visual = applyMotionProfile(this.visual, this.visual.motionProfile, {
      progress: this.clip.progress,
      seed: motionSeed,
      energy: frame.energy,
      transient: frame.transient,
    })
    let type = this.type
    let palette = this.palette

    if (this.storyboard?.enabled && this.storyboard.scenes.length) {
      const sceneTime = Math.max(0, frame.time - this.clip.start)
      const scene = findSceneAt(this.storyboard.scenes, sceneTime)
      if (scene) {
        const sceneChanged = this.activeSceneId !== scene.id
        if (sceneChanged || this.templateId !== scene.layoutId) {
          this.activeSceneId = scene.id
          this.setTemplate(scene.layoutId)
          if (sceneChanged) this.startTransition(scene.transition)
        }
        const sceneDuration = Math.max(0.001, scene.end - scene.start)
        visual = effectiveVisual(visual, scene, Math.max(0, sceneTime - scene.start), sceneDuration)
        type = effectiveType(this.type, scene)
        if (scene.visualStyleId === 'violet') palette = DEFAULT_PALETTE
      }
    }

    visual = applyVisualLoop(visual, this.openingVisual, loopBlend(this.clip.progress, this.visual.loopVisual))

    if (this.instance) {
      this.instance.update({
        frame,
        visual,
        type,
        palette,
        clip: this.clip,
        time: this.time,
        dt,
      })
    }

    this.updateTransition(dt)

    // Acabamento global (grain/vignette/CA/glitch) — controlado por config + transientes.
    const glitchBase = visual.glitch === 'off' ? 0 : visual.glitch === 'low' ? 0.55 : 1
    const chroma = 0.0005 + frame.transient * (visual.glitch === 'off' ? 0.0006 : visual.glitch === 'low' ? 0.0024 : 0.0048)
    this.finish.render(this.scene, this.camera, {
      time: this.time,
      grain: visual.grain * 0.85,
      vignette: 0.32,
      chroma,
      scan: visual.glitch === 'medium' ? 0.3 : 0.15,
      glitch: glitchBase * Math.max(0, frame.transient - 0.5) * 1.6,
    })
  }

  private startTransition(kind: SceneTransition): void {
    if (kind === 'cut') {
      this.hideTransition()
      return
    }
    this.transitionKind = kind
    this.transitionDuration = kind === 'flash' ? 0.35 : 0.55
    this.transitionRemaining = this.transitionDuration
    this.curtain.material.color.set(kind === 'flash' ? '#e9d7ff' : '#000000')
    this.curtain.material.opacity = kind === 'flash' ? 0.8 : 1
    this.curtain.visible = true
  }

  private updateTransition(dt: number): void {
    if (!this.curtain.visible) return
    this.transitionRemaining = Math.max(0, this.transitionRemaining - dt)
    const progress = this.transitionDuration > 0 ? this.transitionRemaining / this.transitionDuration : 0
    this.curtain.material.opacity = (this.transitionKind === 'flash' ? 0.8 : 1) * progress
    if (this.transitionRemaining <= 0) this.curtain.visible = false
  }

  private hideTransition(): void {
    this.curtain.visible = false
    this.transitionRemaining = 0
  }

  private resizeCurtain(): void {
    const distance = 1
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * distance
    this.curtain.scale.set(height * this.camera.aspect * 1.02, height * 1.02, 1)
  }

  /** Pausa quando a aba perde visibilidade (economia sem quebrar o relógio). */
  handleVisibility(visible: boolean): void {
    if (visible) this.start()
    else this.stop()
  }

  dispose(): void {
    this.stop()
    this.instance?.dispose()
    this.scene.clear()
    this.instance = null
    this.camera.remove(this.curtain)
    this.curtain.geometry.dispose()
    this.curtain.material.dispose()
    this.assets.coverTexture?.dispose()
    this.defaultCoverTexture?.dispose()
    this.finish.dispose()
    this.renderer.dispose()
  }
}
