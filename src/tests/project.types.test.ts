import { describe, expect, it } from 'vitest'
import { getClipEnd, getEffectiveClipSeconds, getOutputDimensions } from '../features/project/project.types'

describe('getOutputDimensions', () => {
  it('9:16 full = 1080×1920', () => {
    expect(getOutputDimensions('9:16', 'full')).toEqual({ width: 1080, height: 1920 })
  })

  it('9:16 light = 720×1280', () => {
    expect(getOutputDimensions('9:16', 'light')).toEqual({ width: 720, height: 1280 })
  })

  it('1:1 e 16:9 respeitam a base', () => {
    expect(getOutputDimensions('1:1', 'full')).toEqual({ width: 1080, height: 1080 })
    expect(getOutputDimensions('16:9', 'light')).toEqual({ width: 1280, height: 720 })
  })
})

describe('getClipEnd', () => {
  it('soma start + duração', () => {
    expect(getClipEnd({ clipStart: 10, clipDuration: 30 } as never, 120)).toBe(40)
  })

  it('clamp no fim da faixa', () => {
    expect(getClipEnd({ clipStart: 100, clipDuration: 30 } as never, 110)).toBe(110)
  })

  it('sem áudio, respeita o pedido', () => {
    expect(getClipEnd({ clipStart: 0, clipDuration: 30 } as never, null)).toBe(30)
  })
})

describe('getEffectiveClipSeconds', () => {
  it('difereça entre fim e início', () => {
    expect(getEffectiveClipSeconds({ clipStart: 5, clipDuration: 30 } as never, 20)).toBe(15)
  })
})
