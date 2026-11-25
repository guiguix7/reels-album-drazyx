import type { TemplateId, TypeSettings, VisualSettings } from '../project/project.types'
import type { HookType } from '../storyboard/storyboard.types'

export type RecipeId = 'atmosphere' | 'process' | 'community'

/**
 * Recipe = preset narrativo completo (hook + storyboard + layout + visual + copy).
 * Aplicar uma recipe gera um storyboard editável, nunca um vídeo duplicado.
 */
export interface Recipe {
  id: RecipeId
  name: string
  description: string
  hookType: HookType
  storyboardKind: 15 | 30
  templateId: TemplateId
  motionProfile: VisualSettings['motionProfile']
  visual: Partial<VisualSettings>
  type: Partial<TypeSettings>
}

export const RECIPES: Record<RecipeId, Recipe> = {
  atmosphere: {
    id: 'atmosphere',
    name: 'ATMOSFERA',
    description: 'Abertura emocional, revelação lenta e fechamento com a capa. Ideal para faixas melancólicas.',
    hookType: 'emotional',
    storyboardKind: 30,
    templateId: 'mirage',
    motionProfile: 'dream',
    visual: { intensity: 0.7, glow: 0.65, grain: 0.4, cameraSpeed: 0.35 },
    type: {
      tagline: 'SOMEWHERE BETWEEN DREAMING AND WAKING',
      ctaText: 'OUÇA NO SILÊNCIO · LINK NA BIO',
    },
  },
  process: {
    id: 'process',
    name: 'PROCESSO',
    description: 'Revelação de produção em 15 s, com tipografia editorial e textura de bastidor.',
    hookType: 'production-reveal',
    storyboardKind: 15,
    templateId: 't4',
    motionProfile: 'cinematic',
    visual: { intensity: 0.68, glow: 0.42, grain: 0.5, cameraSpeed: 0.3 },
    type: {
      tagline: 'MADE IN THE QUIET HOURS',
      ctaText: 'FEITO NAS HORAS QUIETAS · LINK NA BIO',
    },
  },
  community: {
    id: 'community',
    name: 'COMUNIDADE',
    description: 'Pergunta direta no hook e player com progresso real para estimular resposta e compartilhamento.',
    hookType: 'curiosity',
    storyboardKind: 15,
    templateId: 't5',
    motionProfile: 'pulse',
    visual: { intensity: 0.62, glow: 0.4, grain: 0.35, cameraSpeed: 0.25 },
    type: {
      tagline: 'WHAT DOES THIS MELODY REMIND YOU OF?',
      ctaText: 'MARQUE QUEM PRECISA OUVIR ISSO',
    },
  },
}

export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[]

export const RECIPE_LIST = RECIPE_IDS.map((id) => RECIPES[id])
