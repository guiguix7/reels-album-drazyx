import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectStore } from '../features/project/project.store'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { createCompositionElement } from '../features/composition/composition.defaults'
import { parseCompositionFile, serializeComposition } from '../features/composition/composition.presets'

describe('composition elements', () => {
  beforeEach(() => {
    useProjectStore.setState({
      config: structuredClone(DEFAULT_PROJECT),
      selectedElementId: null,
      audioMeta: null,
    })
  })

  it('cria capa quadrada no formato atual', () => {
    const element = createCompositionElement('artwork', 9 / 16)
    expect(element.width).toBe(30)
    expect(element.height).toBeCloseTo(16.875, 3)
    expect(element.type).toBe('artwork')
  })

  it('adiciona, edita, duplica, reordena e remove camadas', () => {
    const store = useProjectStore.getState()
    store.addElement('text', { text: 'TESTE' })
    const first = useProjectStore.getState().config.elements[0]
    expect(useProjectStore.getState().selectedElementId).toBe(first.id)

    store.updateElement(first.id, { x: 150, y: -50, width: 999, opacity: 2 })
    const updated = useProjectStore.getState().config.elements[0]
    expect(updated.x).toBe(150)
    expect(updated.y).toBe(-50)
    expect(updated.width).toBe(220)
    expect(updated.opacity).toBe(1)

    store.addElement('shape')
    const shape = useProjectStore.getState().config.elements[1]
    store.moveElementLayer(shape.id, -1)
    expect(useProjectStore.getState().config.elements[0].id).toBe(shape.id)

    store.duplicateElement(first.id)
    expect(useProjectStore.getState().config.elements).toHaveLength(3)
    store.removeElement(shape.id)
    expect(useProjectStore.getState().config.elements).toHaveLength(2)

    store.clearElements()
    expect(useProjectStore.getState().config.elements).toHaveLength(0)
    expect(useProjectStore.getState().selectedElementId).toBeNull()
  })
})

describe('composition preset files', () => {
  it('serializa e lê uma composição válida', () => {
    const element = createCompositionElement('text', 1, { text: 'PRESET' })
    const text = serializeComposition('Teste', [element])
    const parsed = parseCompositionFile(text)
    expect(parsed.name).toBe('Teste')
    expect(parsed.elements[0].text).toBe('PRESET')
  })

  it('rejeita JSON que não é composição', () => {
    expect(() => parseCompositionFile('{"elements": "nada"}')).toThrow(/inválido/)
  })
})
