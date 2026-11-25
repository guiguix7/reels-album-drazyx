export interface MirageMetaLayout {
  /** Posições de topo, compatíveis com TextLayer anchor='topLeft'. */
  artistTop: number
  titleTop: number
  albumTop: number
  blockTop: number
}

/**
 * Empilha artista, título e álbum de baixo para cima usando as alturas reais
 * medidas por cada TextLayer. Títulos de uma ou duas linhas crescem para cima
 * e nunca invadem o bloco anterior.
 */
export function stackMirageMeta(input: {
  safeBottomY: number
  artistHeight: number
  titleHeight: number
  albumHeight: number
  showAlbum: boolean
  gap?: number
}): MirageMetaLayout {
  const gap = input.gap ?? 0.14
  const artistTop = input.safeBottomY + input.artistHeight
  const titleTop = artistTop + gap + input.titleHeight
  const albumTop = titleTop + gap + input.albumHeight
  const blockTop = input.showAlbum ? albumTop : titleTop
  return { artistTop, titleTop, albumTop, blockTop }
}
