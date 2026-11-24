import { describe, expect, it } from 'vitest'
import { validateAudioFile, validateImageFile } from '../lib/file-validation'

function fakeFile(name: string, type: string, size = 1024): File {
  const file = new File(['x'.repeat(Math.min(size, 4096))], name, { type })
  if (size > 4096) {
    // Sobrescreve size p/ simular arquivos grandes sem alocar de verdade.
    Object.defineProperty(file, 'size', { value: size, configurable: true })
  }
  return file
}

describe('validateAudioFile', () => {
  it('aceita mp3 válido', () => {
    const result = validateAudioFile(fakeFile('track.mp3', 'audio/mpeg'))
    expect(result.ok).toBe(true)
  })

  it('aceita extensão conhecida mesmo sem MIME correto', () => {
    const result = validateAudioFile(fakeFile('track.flac', 'application/octet-stream'))
    expect(result.ok).toBe(true)
  })

  it('rejeita arquivo vazio', () => {
    const result = validateAudioFile(fakeFile('track.mp3', 'audio/mpeg', 0))
    expect(result.ok).toBe(false)
  })

  it('rejeita vídeo', () => {
    const result = validateAudioFile(fakeFile('clip.mp4', 'video/mp4'))
    expect(result.ok).toBe(false)
    expect(result.error).toContain('vídeo')
  })

  it('rejeita extensão desconhecida sem MIME de áudio', () => {
    const result = validateAudioFile(fakeFile('doc.pdf', 'application/pdf'))
    expect(result.ok).toBe(false)
  })

  it('rejeita acima do limite de tamanho', () => {
    const result = validateAudioFile(fakeFile('huge.mp3', 'audio/mpeg', 200 * 1024 * 1024))
    expect(result.ok).toBe(false)
    expect(result.error).toContain('limite')
  })
})

describe('validateImageFile', () => {
  it('aceita jpg e png', () => {
    expect(validateImageFile(fakeFile('cover.jpg', 'image/jpeg')).ok).toBe(true)
    expect(validateImageFile(fakeFile('cover.png', 'image/png')).ok).toBe(true)
  })

  it('rejeita não imagem', () => {
    const result = validateImageFile(fakeFile('cover.mp3', 'audio/mpeg'))
    expect(result.ok).toBe(false)
  })

  it('rejeita acima do limite', () => {
    const result = validateImageFile(fakeFile('cover.png', 'image/png', 30 * 1024 * 1024))
    expect(result.ok).toBe(false)
  })
})
