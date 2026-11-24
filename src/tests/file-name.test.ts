import { describe, expect, it } from 'vitest'
import { buildRecordingFileName, sanitizeSegment } from '../features/recording/file-name'

describe('sanitizeSegment', () => {
  it('remove acentos e símbolos', () => {
    expect(sanitizeSegment('WAKE UP (SLOWED + REVERB)')).toBe('WAKE-UP-SLOWED-REVERB')
    expect(sanitizeSegment('café & músicas')).toBe('cafe-musicas')
  })

  it('colapsa hífens e espaços', () => {
    expect(sanitizeSegment('A  -- B   C')).toBe('A-B-C')
  })

  it('trima hífens das pontas', () => {
    expect(sanitizeSegment('--track--')).toBe('track')
  })
})

describe('buildRecordingFileName', () => {
  it('segue o padrão do produto', () => {
    expect(
      buildRecordingFileName({
        artistName: 'DRAZYX',
        trackTitle: 'WAKE UP (SLOWED + REVERB)',
        clipSeconds: 30,
        extension: 'webm',
      }),
    ).toBe('Drazyx_Wake-Up-Slowed-Reverb_30s_Visualizer.webm')
  })

  it('extensão sem ponto e segundos arredondados', () => {
    expect(
      buildRecordingFileName({
        artistName: 'artista',
        trackTitle: 'faixa',
        clipSeconds: 27.4,
        extension: '.mp4',
      }),
    ).toBe('Artista_Faixa_27s_Visualizer.mp4')
  })

  it('fallback quando campos vazios', () => {
    expect(
      buildRecordingFileName({ artistName: '', trackTitle: '', clipSeconds: 10, extension: 'webm' }),
    ).toBe('Visualizer_Track_10s_Visualizer.webm')
  })
})
