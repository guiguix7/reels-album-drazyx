import type { ProjectConfig } from '../project/project.types'
import { HOOK_PRESETS, createStoryboardPreset } from '../storyboard/storyboard.utils'
import type { Recipe } from './recipes'

/**
 * Aplica uma recipe ao projeto: hook + storyboard editável + layout + visual +
 * copy. Nunca cria um vídeo duplicado — o usuário continua podendo editar tudo.
 */
export function applyRecipeToConfig(config: ProjectConfig, recipe: Recipe): ProjectConfig {
  const hook = { type: recipe.hookType, text: HOOK_PRESETS[recipe.hookType].text }
  return {
    ...config,
    templateId: recipe.templateId,
    visual: {
      ...config.visual,
      ...recipe.visual,
      motionProfile: recipe.motionProfile,
    },
    type: {
      ...config.type,
      ...recipe.type,
      showTagline: recipe.type.tagline ? true : config.type.showTagline,
    },
    storyboard: {
      enabled: true,
      source: 'preset',
      hook,
      scenes: createStoryboardPreset(recipe.storyboardKind, hook, config.clipDuration),
    },
  }
}
