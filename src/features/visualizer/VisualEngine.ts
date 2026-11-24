import * as THREE from 'three'
import { getAudioEngine } from '../audio/AudioEngine'
import type { PaletteSettings, TemplateId, TypeSettings, VisualSettings } from '../project/project.types'
import { DEFAULT_PALETTE } from '../project/project.defaults'
import { TEMPLATE_REGISTRY } from './templates/registry'
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
  private type: TypeSettings
  private palette: PaletteSettings = DEFAULT_PALETTE
  private clip = { start: 0, end: 30, progress: 0 }

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

    this.finish = new FinishPass(this.renderer, this.width, this.height)
    this.applyDefaultCover()
    this.setResolution(this.width, this.height)
  }

  /* ---------- configuração vinda do estado do projeto ---------- */

  setConfig(visual: VisualSettings, type: TypeSettings): void {
    this.visual = visual
    this.type = type
  }

  setClip(start: number, end: number): void {
    this.clip = { start, end, progress: 0 }
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
    this.time += dt

    const frame = getAudioEngine().getFrame()
    const clipSpan = Math.max(0.001, this.clip.end - this.clip.start)
    this.clip.progress = Math.max(0, Math.min(1, (frame.time - this.clip.start) / clipSpan))

    if (this.instance) {
      this.instance.update({
        frame,
        visual: this.visual,
        type: this.type,
        palette: this.palette,
        clip: this.clip,
        time: this.time,
        dt,
      })
    }

    // Acabamento global (grain/vignette/CA/glitch) — controlado por config + transientes.
    const glitchBase = this.visual.glitch === 'off' ? 0 : this.visual.glitch === 'low' ? 0.55 : 1
    const chroma = 0.0005 + frame.transient * (this.visual.glitch === 'off' ? 0.0006 : this.visual.glitch === 'low' ? 0.0024 : 0.0048)
    this.finish.render(this.scene, this.camera, {
      time: this.time,
      grain: this.visual.grain * 0.85,
      vignette: 0.32,
      chroma,
      scan: this.visual.glitch === 'medium' ? 0.3 : 0.15,
      glitch: glitchBase * Math.max(0, frame.transient - 0.5) * 1.6,
    })
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
    this.assets.coverTexture?.dispose()
    this.defaultCoverTexture?.dispose()
    this.finish.dispose()
    this.renderer.dispose()
  }
}
