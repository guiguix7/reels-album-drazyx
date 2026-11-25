import type { CompositionElement, CompositionElementType } from '../project/project.types'

export const ELEMENT_TYPE_LABELS: Record<CompositionElementType, string> = {
  text: 'Texto',
  artwork: 'Capa',
  shape: 'Forma',
  waveform: 'Waveform',
  progress: 'Progresso',
  player: 'Player',
}

let sequence = 0

function nextId(): string {
  sequence += 1
  return `el-${Date.now().toString(36)}-${sequence.toString(36)}`
}

/**
 * Cria um elemento com posição inicial legível. width/height são porcentagens
 * do palco; a capa nasce quadrada no formato atual (height = width × razão).
 */
export function createCompositionElement(
  type: CompositionElementType,
  aspectRatio: number,
  overrides: Partial<CompositionElement> = {},
): CompositionElement {
  const base: CompositionElement = {
    id: nextId(),
    type,
    name: ELEMENT_TYPE_LABELS[type],
    x: 50,
    y: type === 'text' ? 38 : type === 'artwork' ? 70 : type === 'waveform' ? 76 : type === 'progress' ? 88 : type === 'player' ? 95 : 55,
    width: type === 'artwork' ? 30 : type === 'waveform' ? 60 : type === 'progress' ? 55 : type === 'shape' ? 30 : type === 'player' ? 64 : 58,
    height:
      type === 'artwork'
        ? Math.min(80, Math.max(8, 30 * aspectRatio))
        : type === 'waveform'
          ? 10
          : type === 'progress'
            ? 2.2
            : type === 'shape'
              ? 14
              : type === 'player'
                ? 12
                : 10,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    color: '#cf8aff',
    text: type === 'text' ? 'SEU TEXTO' : type === 'player' ? 'WAKE UP (SLOWED + REVERB)' : '',
    font: type === 'text' ? 'title' : 'ui',
    fontSize: 5,
    weight: 600,
    align: 'center',
    tracking: 3,
    motion: 'none',
    motionAmount: 30,
    reactive: false,
  }
  return { ...base, ...overrides, id: overrides.id ?? base.id }
}
