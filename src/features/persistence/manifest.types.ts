import type { AspectRatioId, PlatformId, ProjectConfig, TemplateId } from '../project/project.types'
import type { MotionProfileId } from '../visualizer/motion/motion.types'
import type { HookType } from '../storyboard/storyboard.types'

/** Registro local de cada export — base para comparar variantes no Retention Lab. */
export interface ExportManifest {
  id: string
  recordedAt: string
  fileName: string
  projectId: string | null
  platform: PlatformId
  hook: HookType
  layoutId: TemplateId
  layoutSequence: TemplateId[]
  motionProfile: MotionProfileId
  cta: string
  aspectRatio: AspectRatioId
  width: number
  height: number
  fps: number
  clipStart: number
  clipDuration: number
  mimeType: string
  sizeBytes: number
  durationSeconds: number
}

export function buildExportManifest(args: {
  config: ProjectConfig
  fileName: string
  mimeType: string
  sizeBytes: number
  width: number
  height: number
  durationSeconds: number
  projectId?: string | null
  recordedAt?: Date
}): ExportManifest {
  const { config } = args
  const recordedAt = args.recordedAt ?? new Date()
  return {
    id: `export-${recordedAt.getTime().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    recordedAt: recordedAt.toISOString(),
    fileName: args.fileName,
    projectId: args.projectId ?? null,
    platform: config.platform,
    hook: config.storyboard.hook.type,
    layoutId: config.templateId,
    layoutSequence: config.storyboard.enabled
      ? Array.from(new Set(config.storyboard.scenes.map((scene) => scene.layoutId)))
      : [config.templateId],
    motionProfile: config.visual.motionProfile,
    cta: config.type.ctaText,
    aspectRatio: config.aspectRatio,
    width: args.width,
    height: args.height,
    fps: config.fps,
    clipStart: config.clipStart,
    clipDuration: config.clipDuration,
    mimeType: args.mimeType,
    sizeBytes: args.sizeBytes,
    durationSeconds: args.durationSeconds,
  }
}
