import { describe, expect, it } from 'vitest'
import { LAYOUT_LIST, STYLE_LIST, TEMPLATE_LIST, TEMPLATE_REGISTRY } from '../features/visualizer/templates/registry'

describe('registro de layouts', () => {
  it('expõe exatamente oito layouts numerados', () => {
    expect(LAYOUT_LIST).toHaveLength(8)
    const ids = LAYOUT_LIST.map((layout) => layout.id)
    expect(ids).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'])
  })

  it('mantém os estilos originais disponíveis', () => {
    expect(STYLE_LIST.map((style) => style.id)).toEqual(['mirage', 'afterimage', 'void', 'spectrum'])
    for (const style of STYLE_LIST) {
      expect(TEMPLATE_REGISTRY[style.id]).toBeDefined()
    }
  })

  it('todo layout tem nome, descrição e implementação registrada', () => {
    for (const layout of LAYOUT_LIST) {
      expect(layout.name.length).toBeGreaterThan(0)
      expect(layout.description.length).toBeGreaterThan(0)
      const template = TEMPLATE_REGISTRY[layout.id]
      expect(template).toBeDefined()
      expect(template.id).toBe(layout.id)
      expect(typeof template.build).toBe('function')
    }
  })

  it('a lista combinada não repete ids', () => {
    const ids = TEMPLATE_LIST.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(12)
  })
})
