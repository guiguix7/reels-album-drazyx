/**
 * Validação do arquivo gerado. Não promete codec: aponta inconsistências reais
 * entre o que o usuário pediu e o que o MediaRecorder produziu.
 */

export interface RecordingOutput {
  blob: Blob
  mimeType: string
  extension: string
  width: number
  height: number
  durationSeconds: number
}

export interface RecordingExpectation {
  width: number
  height: number
  clipSeconds: number
}

const MIN_BYTES = 1024

/** Lista de avisos; vazio significa que o arquivo passou nas checagens básicas. */
export function validateRecording(output: RecordingOutput, expected: RecordingExpectation): string[] {
  const issues: string[] = []

  if (!output.blob || output.blob.size < MIN_BYTES) {
    issues.push('O arquivo gerado é muito pequeno — verifique se o Stage estava visível durante a gravação.')
  }
  if (!output.mimeType.startsWith('video/')) {
    issues.push(`Formato inesperado (${output.mimeType || 'desconhecido'}). O arquivo pode não abrir em players comuns.`)
  }
  if (output.width !== expected.width || output.height !== expected.height) {
    issues.push(
      `Resolução do arquivo (${output.width}×${output.height}) difere da escolhida (${expected.width}×${expected.height}).`,
    )
  }
  const expectedExt = output.mimeType.includes('mp4') ? 'mp4' : 'webm'
  if (output.extension !== expectedExt) {
    issues.push(`Extensão .${output.extension} não corresponde ao formato ${output.mimeType}.`)
  }
  const duration = output.durationSeconds
  const tolerance = Math.max(1.5, expected.clipSeconds * 0.35)
  if (!Number.isFinite(duration) || duration <= 0) {
    issues.push('A duração do arquivo não pôde ser confirmada pelo navegador.')
  } else if (Math.abs(duration - expected.clipSeconds) > tolerance) {
    issues.push(
      `Duração gravada (${duration.toFixed(1)}s) distante do trecho de ${expected.clipSeconds.toFixed(1)}s.`,
    )
  }
  return issues
}
