import { useProjectStore } from '../../features/project/project.store'
import { RECIPE_LIST } from '../../features/recipes/recipes'
import { Button, Panel } from '../ui/ui'
import styles from './panels.module.css'

/** Recipes de conteúdo: aplicam hook, storyboard, layout, visual e copy de uma vez. */
export function RecipePanel(): JSX.Element {
  const applyRecipe = useProjectStore((s) => s.applyRecipe)

  return (
    <Panel
      title="Recipes"
      hint="Presets narrativos completos. Aplicar gera um storyboard editável — nada é duplicado."
    >
      <div className={styles.recipeList}>
        {RECIPE_LIST.map((recipe) => (
          <div key={recipe.id} className={styles.recipeCard}>
            <div className={styles.recipeText}>
              <span className={styles.recipeName}>{recipe.name}</span>
              <p className={styles.recipeDesc}>{recipe.description}</p>
            </div>
            <Button onClick={() => applyRecipe(recipe.id)}>Aplicar</Button>
          </div>
        ))}
      </div>
    </Panel>
  )
}
