import { describe, expect, it } from 'vitest'
import { fitStageSize, hasCorrectAspect } from '../features/visualizer/stage-size'

describe('Stage sizing', () => {
  it('cabe 16:9 na largura disponível sem esticar', () => {
    const fitted = fitStageSize({ width: 1920, height: 1080 }, { width: 952, height: 723 })
    expect(fitted.width).toBe(952)
    expect(fitted.height).toBe(535)
    expect(hasCorrectAspect({ width: 1920, height: 1080 }, fitted)).toBe(true)
  })

  it('cabe 9:16 na altura disponível', () => {
    const fitted = fitStageSize({ width: 1080, height: 1920 }, { width: 990, height: 723 })
    expect(fitted.height).toBe(723)
    expect(fitted.width).toBe(406)
    expect(hasCorrectAspect({ width: 1080, height: 1920 }, fitted)).toBe(true)
  })

  it('mantém 1:1 quadrado', () => {
    const fitted = fitStageSize({ width: 1080, height: 1080 }, { width: 500, height: 723 })
    expect(fitted).toEqual({ width: 500, height: 500 })
    expect(hasCorrectAspect({ width: 1080, height: 1080 }, fitted)).toBe(true)
  })

  it('devolve zero quando não há espaço', () => {
    expect(fitStageSize({ width: 1920, height: 1080 }, { width: 0, height: 0 })).toEqual({ width: 0, height: 0 })
  })
})
