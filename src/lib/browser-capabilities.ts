/** Detecção honesta de capacidades do navegador para gravação/exportação. */

export interface RecordingSupport {
  hasMediaRecorder: boolean
  hasCaptureStream: boolean
  hasAudioContext: boolean
  /** Primeiro mimeType suportado e sua extensão; null quando nada está disponível. */
  preferred: { mimeType: string; extension: string } | null
  /** Lista de todos os mimeTypes suportados, na ordem testada. */
  supported: string[]
}

const CANDIDATES: Array<{ mimeType: string; extension: string }> = [
  { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
  { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
  { mimeType: 'video/webm;codecs=h264,opus', extension: 'webm' },
  { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
  { mimeType: 'video/mp4', extension: 'mp4' },
  { mimeType: 'video/webm', extension: 'webm' },
]

function isTypeSupported(mimeType: string): boolean {
  try {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)
  } catch {
    return false
  }
}

export function checkRecordingSupport(): RecordingSupport {
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
  const hasCaptureStream =
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  const hasAudioContext =
    typeof (window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext) ===
    'function'

  const supported: string[] = []
  let preferred: RecordingSupport['preferred'] = null
  if (hasMediaRecorder) {
    for (const candidate of CANDIDATES) {
      if (isTypeSupported(candidate.mimeType)) {
        supported.push(candidate.mimeType)
        if (!preferred) preferred = candidate
      }
    }
  }

  return { hasMediaRecorder, hasCaptureStream, hasAudioContext, preferred, supported }
}

/** Mensagem explicando limitação real quando gravação não é possível. */
export function recordingUnsupportedReason(support: RecordingSupport): string | null {
  if (!support.hasMediaRecorder) return 'Este navegador não expõe a API MediaRecorder.'
  if (!support.hasCaptureStream) return 'Este navegador não permite capturar o canvas (captureStream).'
  if (!support.preferred) return 'Este navegador não suporta nenhum codec de vídeo compatível.'
  return null
}
