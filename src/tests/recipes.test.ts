import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { applyRecipeToConfig } from '../features/recipes/apply-recipe'
import { RECIPES, RECIPE_IDS } from '../features/recipes/recipes'
import { TEMPLATE_REGISTRY } from '../features/visualizer/templates/registry'

describe('recipes', () => {
  it('define as três receitas com metadados completos', () => {
    expect(RECIPE_IDS).toEqual(['atmosphere', 'process', 'community'])
    for (const id of RECIPE_IDS) {
      const recipe = RECIPES[id]
      expect(recipe.name.length).toBeGreaterThan(2)
      expect(recipe.description.length).toBeGreaterThan(20)
      expect(TEMPLATE_REGISTRY[recipe.templateId]).toBeTruthy()
      expect(recipe.storyboardKind === 15 || recipe.storyboardKind === 30).toBe(true)
    }
  })

  it('aplica hook, storyboard, layout, visual e copy sem mutar o projeto', () => {
    for (const id of RECIPE_IDS) {
      const config = applyRecipeToConfig(DEFAULT_PROJECT, RECIPES[id])
      expect(config.templateId).toBe(RECIPES[id].templateId)
      expect(config.storyboard.enabled).toBe(true)
      expect(config.storyboard.source).toBe('preset')
      expect(config.storyboard.scenes[0].text).toBe(config.storyboard.hook.text)
      expect(config.storyboard.scenes[config.storyboard.scenes.length - 1].end).toBeCloseTo(config.clipDuration, 2)
      expect(config.visual.motionProfile).toBe(RECIPES[id].motionProfile)
      if (RECIPES[id].type.ctaText) expect(config.type.ctaText).toBe(RECIPES[id].type.ctaText)
      expect(config.type.showTagline).toBe(true)
    }
    expect(DEFAULT_PROJECT.storyboard.enabled).toBe(false)
  })

  it('mantém o trecho original ao aplicar a recipe', () => {
    const base = { ...DEFAULT_PROJECT, clipStart: 12, clipDuration: 15 }
    const config = applyRecipeToConfig(base, RECIPES.process)
    expect(config.clipStart).toBe(12)
    expect(config.clipDuration).toBe(15)
    expect(config.storyboard.scenes[config.storyboard.scenes.length - 1].end).toBeCloseTo(15, 2)
  })
})
