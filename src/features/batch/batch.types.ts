import type { PlatformId, ProjectConfig, TemplateId } from '../project/project.types'
import type { RecipeId } from '../recipes/recipes'

export type BatchJobStatus = 'queued' | 'recording' | 'processing' | 'done' | 'error'

export interface BatchJob {
  id: string
  label: string
  recipeId: RecipeId
  platformId: PlatformId
  layoutId: TemplateId
  /** Configuração completa aplicada antes de cada gravação e restaurada no fim. */
  config: ProjectConfig
}

export interface BatchJobResult {
  url: string
  fileName: string
  sizeBytes: number
  mimeType: string
  width: number
  height: number
  durationSeconds: number
}

export interface BatchJobState extends BatchJob {
  status: BatchJobStatus
  error: string | null
  result: BatchJobResult | null
}
