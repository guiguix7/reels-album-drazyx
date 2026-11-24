import type { MotionProfileDefinition, MotionProfileId } from './motion.types'

/**
 * Perfis de movimento do master prompt. Cada um muda a curva do trecho inteiro —
 * não é apenas uma cor: muda o quanto o grave empurra a cena, o quanto a câmera
 * caminha, a densidade de partículas e como um transiente entra.
 */
export const MOTION_PROFILES: Record<MotionProfileId, MotionProfileDefinition> = {
  dream: {
    id: 'dream',
    label: 'Dream',
    description: 'Deriva lenta, brilho contínuo e resposta macia aos graves.',
    intensity: [0.82, 0.95],
    bassForce: [0.8, 0.9],
    glow: [0.9, 1.05],
    cameraSpeed: [0.45, 0.65],
    particleCount: [0.9, 1.05],
    transientKick: 0.15,
    jitter: 0.04,
    loopSafe: true,
  },
  pulse: {
    id: 'pulse',
    label: 'Pulse',
    description: 'Pulso de batida acentuado com câmera estável.',
    intensity: [1, 1.1],
    bassForce: [1.2, 1.35],
    glow: [1, 1.15],
    cameraSpeed: [0.65, 0.85],
    particleCount: [1, 1.1],
    transientKick: 0.35,
    jitter: 0.02,
    loopSafe: true,
  },
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Dolly contínuo e revelação progressiva com pico controlado.',
    intensity: [0.85, 1.05],
    bassForce: [0.85, 1],
    glow: [0.85, 1],
    cameraSpeed: [0.75, 1.15],
    particleCount: [0.85, 1],
    transientKick: 0.2,
    jitter: 0.05,
    loopSafe: false,
  },
  fragment: {
    id: 'fragment',
    label: 'Fragment',
    description: 'Textura instável com saltos curtos em eventos fortes.',
    intensity: [1.05, 0.9],
    bassForce: [1.1, 1.2],
    glow: [1.05, 0.95],
    cameraSpeed: [0.9, 1.1],
    particleCount: [1.05, 0.95],
    transientKick: 0.5,
    jitter: 0.18,
    loopSafe: false,
  },
  organic: {
    id: 'organic',
    label: 'Organic',
    description: 'Respiração irregular e movimento contínuo mesmo em silêncio.',
    intensity: [0.9, 1.05],
    bassForce: [0.95, 1.1],
    glow: [0.9, 1.05],
    cameraSpeed: [0.55, 0.75],
    particleCount: [0.95, 1.1],
    transientKick: 0.25,
    jitter: 0.12,
    loopSafe: true,
  },
  intense: {
    id: 'intense',
    label: 'Intense',
    description: 'Máxima reação ao áudio para o pico do storyboard.',
    intensity: [1.1, 1.2],
    bassForce: [1.25, 1.4],
    glow: [1.1, 1.2],
    cameraSpeed: [0.85, 1.05],
    particleCount: [1.1, 1.2],
    transientKick: 0.6,
    jitter: 0.06,
    loopSafe: false,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Poucos elementos, luz baixa e quase nenhum movimento de câmera.',
    intensity: [0.7, 0.8],
    bassForce: [0.6, 0.7],
    glow: [0.7, 0.8],
    cameraSpeed: [0.3, 0.4],
    particleCount: [0.5, 0.6],
    transientKick: 0.1,
    jitter: 0.01,
    loopSafe: true,
  },
}

export const MOTION_PROFILE_IDS = Object.keys(MOTION_PROFILES) as MotionProfileId[]

export const MOTION_PROFILE_OPTIONS: Array<{ value: MotionProfileId; label: string }> = MOTION_PROFILE_IDS.map(
  (id) => ({ value: id, label: MOTION_PROFILES[id].label }),
)
