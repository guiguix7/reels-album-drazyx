import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { CompositionLayer } from '../features/visualizer/objects/composition-layer'
import type { CompositionElement, CompositionElementType } from '../features/project/project.types'

const textDefaults: Omit<CompositionElement, 'type' | 'id'> = {
  name: 'Teste',
  x: 50,
  y: 50,
  width: 50,
  height: 10,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  color: '#ffffff',
  text: 'TESTE',
  font: 'title',
  fontSize: 5,
  weight: 600,
  align: 'center',
  tracking: 3,
  motion: 'none',
  motionAmount: 30,
  reactive: false,
}

function makeElement(overrides: { type: CompositionElementType; id: string } & Partial<Omit<CompositionElement, 'type' | 'id'>>): CompositionElement {
  const { type, id, ...rest } = overrides
  return {
    ...textDefaults,
    type,
    id,
    ...rest,
  } as CompositionElement
}

describe('composition layer incremental updates', () => {
  it('reutiliza os itens existentes quando só posição/rotação/opacidade mudam', () => {
    const layer = new CompositionLayer([], { coverTexture: null, hasCover: false }, 100, 100)
    const el = makeElement({ type: 'text', id: 'keep-me' })
    layer.setElements([el], { coverTexture: null, hasCover: false }, 100, 100)
    const firstItem = layer['items'][0]
    const firstGroup = firstItem.group
    const firstText = firstItem.text

    // mesma estrutura, só posição/rotação/opacidade — exatamente o caso de um arraste sem redimensionar
    const next = makeElement({ type: 'text', id: 'keep-me', x: 70, y: 30, rotation: 15, opacity: 0.6 })
    layer.setElements([next], { coverTexture: null, hasCover: false }, 100, 100)

    expect(layer['items']).toHaveLength(1)
    expect(layer['items'][0]).toBe(firstItem)
    expect(firstItem.group).toBe(firstGroup)
    expect(firstItem.text).toBe(firstText)
    // posição atualizada in place
    expect(firstItem.group.position.x).toBe((70 / 100 - 0.5) * 100)
    expect(firstItem.group.position.y).toBe((0.5 - 30 / 100) * 100)
    expect(firstItem.group.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(15))
  })

  it('recria o item quando o tipo ou conteúdo mudam', () => {
    const layer = new CompositionLayer([], { coverTexture: null, hasCover: false }, 100, 100)
    const el = makeElement({ type: 'text', id: 'convert-me', text: 'ANTES' })
    layer.setElements([el], { coverTexture: null, hasCover: false }, 100, 100)
    const firstGroup = layer['items'][0].group

    const next = makeElement({ type: 'waveform', id: 'convert-me' })
    layer.setElements([next], { coverTexture: null, hasCover: false }, 100, 100)

    expect(layer['items']).toHaveLength(1)
    expect(layer['items'][0]).not.toBe(firstGroup)
    expect(layer['items'][0].text).toBeUndefined()
    expect(layer['items'][0].wave).toBeDefined()
  })

  it('esconder itens removidos em vez de despagar recursos', () => {
    const layer = new CompositionLayer([], { coverTexture: null, hasCover: false }, 100, 100)
    const a = makeElement({ type: 'text', id: 'a' })
    const b = makeElement({ type: 'text', id: 'b' })
    layer.setElements([a, b], { coverTexture: null, hasCover: false }, 100, 100)
    const removedItem = layer['items'][1]

    layer.setElements([a], { coverTexture: null, hasCover: false }, 100, 100)

    expect(layer['items']).toHaveLength(1)
    expect(layer['items'][0]).toBe(layer['items'][0])
    expect(removedItem.group.visible).toBe(false)
    expect(layer['items'][0].text).toBeDefined()
  })

  it('recria capa quando tamanho base muda, mas reusa quando só opacidade muda', () => {
    const layer = new CompositionLayer([], { coverTexture: null, hasCover: false }, 100, 100)
    const el = makeElement({ type: 'artwork', id: 'cover-me', width: 30, height: 20 })
    layer.setElements([el], { coverTexture: null, hasCover: false }, 100, 100)
    const firstGroup = layer['items'][0].group

    layer.setElements([makeElement({ type: 'artwork', id: 'cover-me', width: 40, height: 24, opacity: 0.5 })], { coverTexture: null, hasCover: false }, 100, 100)

    expect(layer['items'][0].group).not.toBe(firstGroup)
    expect(layer['items'][0].cover).toBeDefined()

    const sameSize = layer['items'][0]
    layer.setElements([makeElement({ type: 'artwork', id: 'cover-me', width: 40, height: 24, opacity: 0.3 })], { coverTexture: null, hasCover: false }, 100, 100)
    expect(layer['items'][0].group).toBe(sameSize.group)
    expect(layer['items'][0].cover).toBe(sameSize.cover)
  })

  it('redimensiona itens in place quando view size muda', () => {
    const layer = new CompositionLayer([], { coverTexture: null, hasCover: false }, 100, 100)
    const el = makeElement({ type: 'text', id: 'resize-me', width: 50, height: 10 })
    layer.setElements([el], { coverTexture: null, hasCover: false }, 100, 100)
    const firstText = layer['items'][0].text

    layer.resize(200, 200)

    expect(layer['items'][0].text).toBe(firstText)
    expect(layer['items'][0].baseX).toBe((50 / 100 - 0.5) * 200)
    expect(layer['items'][0].baseY).toBe((0.5 - 50 / 100) * 200)
  })

  it('não reconstrói itens quando view size não muda', () => {
    const layer = new CompositionLayer([], { coverTexture: null, hasCover: false }, 100, 100)
    const el = makeElement({ type: 'text', id: 'no-change-me' })
    layer.setElements([el], { coverTexture: null, hasCover: false }, 100, 100)
    const firstItem = layer['items'][0]

    layer.resize(100, 100)

    expect(layer['items']).toHaveLength(1)
    expect(layer['items'][0]).toBe(firstItem)
  })
})
