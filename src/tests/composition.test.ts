import { describe, expect, it } from 'vitest'
import { VIEW_HEIGHT } from '../features/visualizer/visual.types'
import { coverSide, getFormatMode } from '../features/visualizer/templates/composition'

describe('format-specific composition', () => {
  it('distingue retrato, quadrado e paisagem', () => {
    expect(getFormatMode(VIEW_HEIGHT * (9 / 16), VIEW_HEIGHT)).toBe('portrait')
    expect(getFormatMode(VIEW_HEIGHT, VIEW_HEIGHT)).toBe('square')
    expect(getFormatMode(VIEW_HEIGHT * (16 / 9), VIEW_HEIGHT)).toBe('landscape')
  })

  it('mantém a capa dentro da altura visível nos três formatos', () => {
    for (const aspect of [9 / 16, 1, 16 / 9]) {
      const width = VIEW_HEIGHT * aspect
      const side = coverSide(width, VIEW_HEIGHT, getFormatMode(width, VIEW_HEIGHT))
      expect(side).toBeLessThanOrEqual(VIEW_HEIGHT * 0.52)
      expect(side).toBeGreaterThan(0)
    }
  })
})
