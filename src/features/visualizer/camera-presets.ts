export type CameraPreset = 'auto' | 'static' | 'dolly-in' | 'dolly-out' | 'pan' | 'tilt' | 'orbit' | 'drift'

export interface CameraPose {
  x: number
  y: number
  z: number
}

/** Pose determinística por progresso do trecho; `auto` preserva o template. */
export function cameraPose(
  preset: CameraPreset,
  progress: number,
  time: number,
  intensity: number,
): CameraPose | null {
  if (preset === 'auto') return null
  const p = Math.max(0, Math.min(1, progress))
  const amount = Math.max(0, Math.min(2, intensity))
  switch (preset) {
    case 'static':
      return { x: 0, y: 0, z: 10 }
    case 'dolly-in':
      return { x: 0, y: 0, z: 10 - p * 1.5 * amount }
    case 'dolly-out':
      return { x: 0, y: 0, z: 10 - (1 - p) * 1.5 * amount }
    case 'pan':
      return { x: (p - 0.5) * 2.4 * amount, y: 0, z: 10 }
    case 'tilt':
      return { x: 0, y: (p - 0.5) * 1.6 * amount, z: 10 }
    case 'orbit': {
      const angle = p * Math.PI * 2
      return { x: Math.sin(angle) * 1.2 * amount, y: 0.3 * amount, z: 10 - Math.cos(angle) * 1.2 * amount }
    }
    case 'drift':
      return {
        x: Math.sin(time * 0.07) * 0.4 * amount,
        y: Math.cos(time * 0.05) * 0.25 * amount,
        z: 10 - p * 0.5 * amount,
      }
  }
}
