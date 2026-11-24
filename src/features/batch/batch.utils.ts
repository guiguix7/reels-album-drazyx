import type { PlatformId, ProjectConfig, TemplateId } from '../project/project.types'
import { applyPlatformToConfig } from '../platform/platform.profiles'
import { applyRecipeToConfig } from '../recipes/apply-recipe'
import { RECIPES, RECIPE_IDS } from '../recipes/recipes'
import type { RecipeId } from '../recipes/recipes'
import { buildRecordingFileName, sanitizeSegment } from '../recording/file-name'
import type { BatchJob } from './batch.types'

/** Layouts usados em rotação quando o lote é gerado automaticamente. */
export const BATCH_LAYOUT_CYCLE: TemplateId[] = ['t3', 't4', 't5', 't1', 't7']

export const MAX_BATCH_JOBS = 5

export interface BatchPlanInput {
  base: ProjectConfig
  recipeIds?: RecipeId[]
  platformId?: PlatformId
  count: number
  layouts?: TemplateId[]
}

/**
 * Gera a fila de peças: cada job é recipe × layout em rotação, com o perfil de
 * plataforma aplicado por último. Configurações são cópias — o projeto original
 * não é mutado.
 */
export function buildBatchJobs(input: BatchPlanInput): BatchJob[] {
  const recipeIds = input.recipeIds?.length ? input.recipeIds : RECIPE_IDS
  const layouts = input.layouts?.length ? input.layouts : BATCH_LAYOUT_CYCLE
  const platformId = input.platformId ?? input.base.platform
  const count = Math.max(1, Math.min(MAX_BATCH_JOBS, Math.round(input.count)))

  const jobs: BatchJob[] = []
  for (let index = 0; index < count; index += 1) {
    const recipeId = recipeIds[index % recipeIds.length]
    const layoutId = layouts[index % layouts.length]
    const recipe = RECIPES[recipeId]
    const withRecipe = applyRecipeToConfig(input.base, recipe)
    const withLayout: ProjectConfig = { ...withRecipe, templateId: layoutId }
    const config = applyPlatformToConfig(withLayout, platformId)
    jobs.push({
      id: `batch-${recipeId}-${layoutId}-${index + 1}`,
      label: `${recipe.name} · ${layoutId.toUpperCase()}`,
      recipeId,
      platformId,
      layoutId,
      config,
    })
  }
  return jobs
}

/**
 * Nome único por job, mantendo o padrão do produto e o sufixo da variante
 * (recipe, layout e plataforma) — necessário porque várias peças compartilham artista/faixa.
 */
export function buildBatchFileName(options: {
  job: Pick<BatchJob, 'recipeId' | 'layoutId' | 'platformId'>
  artistName: string
  trackTitle: string
  clipSeconds: number
  extension: string
}): string {
  const base = buildRecordingFileName({
    artistName: options.artistName,
    trackTitle: options.trackTitle,
    clipSeconds: options.clipSeconds,
    extension: options.extension,
  })
  const suffix = [options.job.recipeId, options.job.layoutId, options.job.platformId]
    .map((part) => sanitizeSegment(part).toUpperCase())
    .filter(Boolean)
    .join('-')
  if (!suffix) return base
  const dot = base.lastIndexOf('.')
  if (dot < 0) return `${base}_${suffix}`
  return `${base.slice(0, dot)}_${suffix}${base.slice(dot)}`
}
