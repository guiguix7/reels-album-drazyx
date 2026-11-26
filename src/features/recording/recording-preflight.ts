/** Estimativa honesta de recursos para gravação.

 * Não é telemetria de memória real — é uma estimativa baseada nos parâmetros
 * reais da gravação e em indícios do navegador. Serve para avisar antes de
 * uma gravação longa e para sugerir alternativas mais leves quando o dispositivo
 * parece limitado.
 */

export interface RecorderEstimate {
  /** Tamanho estimado do arquivo final em bytes. */
  estimatedBytes: number
  /** Duração efetiva da gravação em segundos. */
  durationSeconds: number
  /** Largura × altura de exportação. */
  resolution: { width: number; height: number }
  /** FPS solicitado. */
  fps: number
  /** Taxa de vídeo configurada (bits por segundo). */
  videoBitsPerSecond: number
  /** Taxa de áudio configurada (bits por segundo). */
  audioBitsPerSecond: number
  /** Estimativa de memória adicional durante a gravação (chunks + blob final),
   * em bytes. É uma cota superior, não uma medição. */
  estimatedMemoryBytes: number
  /** Se a gravação parece segura para o dispositivo com os parâmetros atuais. */
  seemsSafe: boolean
  /** Nível de recomendação: 'ok' | 'caution' | 'high-memory'. */
  level: 'ok' | 'caution' | 'high-memory'
  /** Alternativas mais leves que podem ser sugeridas ao usuário. */
  alternatives: RecorderEstimateAlternative[]
}

export interface RecorderEstimateAlternative {
  label: string
  explanation: string
  /** Novo bitrate de vídeo proposto (ou null para manter). */
  videoBitsPerSecond: number | null
  /** Nova resolução proposta (ou null para manter). */
  resolution: { width: number; height: number } | null
  /** Novo FPS proposto (ou null para manter). */
  fps: number | null
  /** Novo tempo estimado de gravação (ou null para manter). */
  durationSeconds: number | null
  /** Novo tamanho estimado em bytes (ou null para não calcular). */
  estimatedBytes: number | null
  /** Nova estimativa de memória (ou null para não calcular). */
  estimatedMemoryBytes: number | null
}

/** Limiares de nível de memória estimada. São valores de referência, não
 * garantias de estabilidade. */
const ONE_MILLION_BYTES = 1_000_000

const LEVEL_BYTES = {
  caution: 60 * ONE_MILLION_BYTES,
  highMemory: 250 * ONE_MILLION_BYTES,
} as const

export function estimateRecording(
  params: {
    width: number
    height: number
    fps: number
    videoBitsPerSecond: number
    audioBitsPerSecond: number
    durationSeconds: number
  },
  hints?: { deviceMemory?: number },
): RecorderEstimate {
  const { width, height, fps, videoBitsPerSecond, audioBitsPerSecond, durationSeconds } = params
  const totalBitsPerSecond = videoBitsPerSecond + audioBitsPerSecond
  const estimatedBytes = Math.round((totalBitsPerSecond / 8) * durationSeconds)
  // Cota superior de memória durante a gravação: chunks acumulados + blob final
  // + object URL de preview. Não é uma medição; é um limitante conservador.
  const estimatedMemoryBytes = Math.round(estimatedBytes * 2.6)

  const deviceMemory = hints?.deviceMemory
  let level: RecorderEstimate['level'] = 'ok'
  if (estimatedMemoryBytes >= LEVEL_BYTES.highMemory && (deviceMemory == null || deviceMemory < 4)) {
    level = 'high-memory'
  } else if (estimatedMemoryBytes >= LEVEL_BYTES.caution && (deviceMemory == null || deviceMemory < 4)) {
    level = 'caution'
  }

  const alternatives: RecorderEstimateAlternative[] = []
  if (level !== 'ok') {
    alternatives.push(
      makeAlternative('Grabar em resolução menor', 'Reduz a resolução de saída para 720p na mesma proporção.', params, { width: 720, height: Math.round((720 * params.height) / params.width) }),
    )
    if (params.videoBitsPerSecond > 4_000_000) {
      alternatives.push(makeAlternative('Usar bitrate de vídeo menor', 'Reduz a taxa de vídeo para 4 Mbps (qualidade equilibrada).', params, null, 4_000_000))
    }
  }

  return {
    estimatedBytes,
    durationSeconds,
    resolution: { width, height },
    fps,
    videoBitsPerSecond,
    audioBitsPerSecond,
    estimatedMemoryBytes,
    seemsSafe: level === 'ok',
    level,
    alternatives,
  }
}

function makeAlternative(
  label: string,
  explanation: string,
  original: { width: number; height: number; fps: number; videoBitsPerSecond: number; audioBitsPerSecond: number; durationSeconds: number },
  resolution: { width: number; height: number } | null,
  videoBitsPerSecond: number | null = null,
  fps: number | null = null,
): RecorderEstimateAlternative {
  const nextVideoBitsPerSecond = videoBitsPerSecond ?? original.videoBitsPerSecond
  const nextFps = fps ?? original.fps
  const nextResolution = resolution ?? { width: original.width, height: original.height }
  const totalBitsPerSecond = nextVideoBitsPerSecond + original.audioBitsPerSecond
  const durationSeconds = Math.max(1, (fps ?? original.fps) / original.fps * original.durationSeconds)
  const estimatedBytes = Math.round((totalBitsPerSecond / 8) * durationSeconds)
  return {
    label,
    explanation,
    videoBitsPerSecond: nextVideoBitsPerSecond,
    resolution: nextResolution,
    fps: nextFps,
    durationSeconds,
    estimatedBytes,
    estimatedMemoryBytes: Math.round(estimatedBytes * 2.6),
  }
}
