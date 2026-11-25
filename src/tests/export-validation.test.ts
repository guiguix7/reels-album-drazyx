import { describe, expect, it } from 'vitest'
import { validateRecording } from '../features/recording/export-validation'

const expected = { width: 1080, height: 1920, clipSeconds: 30 }

function output(overrides: Partial<{ blob: Blob; mimeType: string; extension: string; width: number; height: number; durationSeconds: number }> = {}) {
  return {
    blob: new Blob([new Uint8Array(4096)], { type: 'video/webm' }),
    mimeType: 'video/webm',
    extension: 'webm',
    width: 1080,
    height: 1920,
    durationSeconds: 29.8,
    ...overrides,
  }
}

describe('export validation', () => {
  it('aceita um arquivo coerente', () => {
    expect(validateRecording(output(), expected)).toEqual([])
  })

  it('aponta arquivo vazio e formato inesperado', () => {
    const issues = validateRecording(output({ blob: new Blob([]), mimeType: 'audio/webm', extension: 'webm' }), expected)
    expect(issues.some((issue) => issue.includes('muito pequeno'))).toBe(true)
    expect(issues.some((issue) => issue.includes('Formato inesperado'))).toBe(true)
  })

  it('aponta resolução, extensão e duração divergentes', () => {
    const issues = validateRecording(
      output({ width: 720, height: 1280, extension: 'mp4', durationSeconds: 8 }),
      expected,
    )
    expect(issues.some((issue) => issue.includes('Resolução do arquivo'))).toBe(true)
    expect(issues.some((issue) => issue.includes('Extensão'))).toBe(true)
    expect(issues.some((issue) => issue.includes('Duração gravada'))).toBe(true)
  })

  it('sinaliza duração não confirmada', () => {
    const issues = validateRecording(output({ durationSeconds: 0 }), expected)
    expect(issues.some((issue) => issue.includes('duração do arquivo'))).toBe(true)
  })
})
