/** Validação local de arquivos — nenhum dado sai do navegador. */

export const AUDIO_MAX_BYTES = 120 * 1024 * 1024 // 120 MB
export const IMAGE_MAX_BYTES = 25 * 1024 * 1024 // 25 MB

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'webm', 'opus']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

export interface ValidationResult {
  ok: boolean
  /** Mensagem amigável quando ok === false. */
  error?: string
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** Valida tipo/ extensão e tamanho; não confia só na extensão, mas evita lixo evidente. */
export function validateAudioFile(file: File): ValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, error: 'O arquivo de áudio está vazio. Selecione outro arquivo.' }
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return {
      ok: false,
      error: `O áudio passou do limite de ${Math.round(AUDIO_MAX_BYTES / (1024 * 1024))} MB. Escolha uma faixa menor.`,
    }
  }
  const typeOk = typeof file.type === 'string' && file.type.startsWith('audio/')
  const extOk = AUDIO_EXTENSIONS.includes(extensionOf(file.name))
  // Vídeo com extensão de áudio não passa; extensão desconhecida + MIME de vídeo tampouco.
  const looksLikeVideo = typeof file.type === 'string' && file.type.startsWith('video/')
  if (looksLikeVideo) {
    return {
      ok: false,
      error: 'Este arquivo é um vídeo. Escolha um arquivo de áudio (MP3, WAV, OGG, M4A, AAC ou FLAC).',
    }
  }
  if (!typeOk && !extOk) {
    return {
      ok: false,
      error: 'Formato de áudio não suportado. Use MP3, WAV, OGG, M4A, AAC ou FLAC.',
    }
  }
  return { ok: true }
}

export function validateImageFile(file: File): ValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, error: 'A imagem de capa está vazia. Selecione outro arquivo.' }
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: `A capa passou do limite de ${Math.round(IMAGE_MAX_BYTES / (1024 * 1024))} MB.`,
    }
  }
  const typeOk = typeof file.type === 'string' && file.type.startsWith('image/')
  const extOk = IMAGE_EXTENSIONS.includes(extensionOf(file.name))
  if (!typeOk && !extOk) {
    return {
      ok: false,
      error: 'Formato de imagem não suportado. Use JPG, PNG, WEBP, GIF ou AVIF.',
    }
  }
  return { ok: true }
}
