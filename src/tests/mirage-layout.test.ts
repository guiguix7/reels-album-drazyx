import { describe, expect, it } from 'vitest'
import { stackMirageMeta } from '../features/visualizer/templates/mirage-layout'

describe('MIRAGE metadata layout', () => {
  it('não sobrepõe título de uma linha ao artista', () => {
    const layout = stackMirageMeta({
      safeBottomY: -3.4,
      artistHeight: 0.45,
      titleHeight: 0.7,
      albumHeight: 0.45,
      showAlbum: true,
    })
    expect(layout.titleTop - 0.7).toBeGreaterThanOrEqual(layout.artistTop + 0.13)
  })

  it('cresce para cima quando o título quebra em duas linhas', () => {
    const one = stackMirageMeta({
      safeBottomY: -3.4,
      artistHeight: 0.45,
      titleHeight: 0.7,
      albumHeight: 0.45,
      showAlbum: true,
    })
    const two = stackMirageMeta({
      safeBottomY: -3.4,
      artistHeight: 0.45,
      titleHeight: 1.4,
      albumHeight: 0.45,
      showAlbum: true,
    })
    expect(two.titleTop).toBeGreaterThan(one.titleTop)
    expect(two.titleTop - 1.4).toBeGreaterThanOrEqual(two.artistTop + 0.13)
    expect(two.albumTop - 0.45).toBeGreaterThanOrEqual(two.titleTop + 0.13)
  })
})
