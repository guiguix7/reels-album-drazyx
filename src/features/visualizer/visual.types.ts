/** Tipos do motor visual — contratos entre Stage, templates e engine. */

import type * as THREE from 'three'
import type { PaletteSettings, TemplateId, TypeSettings, VisualSettings } from '../project/project.types'
import type { AudioFrame } from '../audio/audio.types'

export interface StageAssets {
  coverTexture: THREE.Texture | null
  hasCover: boolean
}

export interface StageContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  /** Área visível no plano z=0 (unidades de mundo). */
  viewWidth: number
  viewHeight: number
  assets: StageAssets
}

export interface ClipInfo {
  start: number
  end: number
  /** Progresso do trecho 0–1 (clampado). */
  progress: number
}

export interface TemplateUpdateArgs {
  frame: AudioFrame
  visual: VisualSettings
  type: TypeSettings
  palette: PaletteSettings
  clip: ClipInfo
  /** Tempo contínuo do engine (segundos desde o início da sessão visual). */
  time: number
  dt: number
}

export interface TemplateInstance {
  update(args: TemplateUpdateArgs): void
  resize(viewWidth: number, viewHeight: number): void
  dispose(): void
}

export interface VisualTemplate {
  id: TemplateId
  name: string
  description: string
  build(ctx: StageContext): TemplateInstance
}

/** Distância padrão da câmera no plano z=0. */
export const CAMERA_Z = 10
/** Altura visível no plano z=0 em unidades de mundo (constante entre templates). */
export const VIEW_HEIGHT = 10

/** THREE.PerspectiveCamera.fov é em GRAUS — converter o ângulo calculado em radianos. */
export function fovForViewHeight(camZ: number, viewHeight: number): number {
  const radians = 2 * Math.atan(viewHeight / (2 * camZ))
  return (radians * 180) / Math.PI
}
