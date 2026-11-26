/** Perfis de renderização que abrangem não só a escala de resolução, mas também
 * custo de GPU: amostragem, tipo do render target e se o pass de acabamento
 * (grain/vignette/CA/glitch) deve rodar. Export mantém qualidade cheia.
 */

export type RenderProfileId = 'auto' | 'performance' | 'balanced' | 'quality' | 'export'

export interface RenderProfile {
  id: RenderProfileId
  label: string
  description: string
  /** Escala máxima de renderização do preview (1 = resolução de saída). */
  maxScale: number
  /** Escala mínima antes de desistir de reduzir. */
  minScale: number
  /** MSAA amostra do render target do pass de acabamento. 0 = sem MSAA. */
  finishSamples: number
  /** Usa half-float no render target do pass de acabamento. */
  finishHalfFloat: boolean
  /** Roda o pass de acabamento (grain/vignette/CA/glitch). Em modo leve pode
   * pular o pass e renderizar a cena direto no canvas para economizar GPU. */
  finishEnabled: boolean
  /** Antialiasing do renderer (sempre falso durante export para não dobrar o custo). */
  antialias: boolean
}

export const RENDER_PROFILES: Record<RenderProfileId, RenderProfile> = {
  auto: {
    id: 'auto',
    label: 'Automático',
    description: 'Escolhe configurações baseado no dispositivo detectado.',
    maxScale: 1,
    minScale: 0.55,
    finishSamples: 4,
    finishHalfFloat: true,
    finishEnabled: true,
    antialias: true,
  },
  performance: {
    id: 'performance',
    label: 'Desempenho',
    description: 'Prioriza fluidez: preview menor, menos amostragem e efeitos opcionais.',
    maxScale: 0.75,
    minScale: 0.5,
    finishSamples: 0,
    finishHalfFloat: false,
    finishEnabled: true,
    antialias: false,
  },
  balanced: {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Boa qualidade no preview com pressão moderada na GPU.',
    maxScale: 1,
    minScale: 0.55,
    finishSamples: 2,
    finishHalfFloat: true,
    finishEnabled: true,
    antialias: true,
  },
  quality: {
    id: 'quality',
    label: 'Qualidade',
    description: 'Mais detalhe e efeitos em dispositivos capazes.',
    maxScale: 1,
    minScale: 0.7,
    finishSamples: 4,
    finishHalfFloat: true,
    finishEnabled: true,
    antialias: true,
  },
  export: {
    id: 'export',
    label: 'Export',
    description: 'Resolução e qualidade cheias durante a gravação.',
    maxScale: 1,
    minScale: 1,
    finishSamples: 4,
    finishHalfFloat: true,
    finishEnabled: true,
    antialias: false,
  },
}

/** Lê indícios do dispositivo uma vez e escolhe um perfil base razoável.
 * Não substitui a escolha explícita do usuário; só decide o padrão quando o
 * perfil pedido for 'auto'.
 */
export function chooseProfileFromCapabilities(
  requested: RenderProfileId,
  caps: { deviceMemory: number; hardwareConcurrency: number; maxTextureSize: number } | null,
): RenderProfileId {
  if (requested !== 'auto') return requested
  if (!caps) return 'balanced'

  // Dispositivos muito limitados pela memória disponível ou por textura máxima.
  const lowMemory = caps.deviceMemory > 0 && caps.deviceMemory < 4
  const lowTexture = caps.maxTextureSize > 0 && caps.maxTextureSize < 4096

  if (lowMemory || lowTexture) return 'performance'
  if (caps.hardwareConcurrency > 0 && caps.hardwareConcurrency < 4) return 'performance'
  return 'balanced'
}
