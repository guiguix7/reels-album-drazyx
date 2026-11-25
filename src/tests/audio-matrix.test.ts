import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectStore } from '../features/project/project.store'
import { DEFAULT_PROJECT, DEFAULT_CLIP_SECONDS } from '../features/project/project.defaults'

function load(duration: number): void {
  useProjectStore.getState().setAudioMeta({ fileName: 'faixa.wav', objectUrl: '', duration })
}

describe('matriz de duração de áudio e trecho', () => {
  beforeEach(() => {
    useProjectStore.setState({
      config: structuredClone(DEFAULT_PROJECT),
      audioMeta: null,
      selectedElementId: null,
      audioStatus: 'ready',
    })
  })

  it.each([2, 5, 15, 30, 45, 90])('aplica o teto correto em %ss', (duration) => {
    load(duration)
    useProjectStore.getState().setClipDuration(999, duration)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(Math.min(45, duration), 3)

    useProjectStore.getState().setProductionMode('full')
    useProjectStore.getState().setClipDuration(999, duration)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(duration, 3)
    useProjectStore.getState().setClipRange(0, duration, duration)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(duration, 3)
  })

  it('reclampa ao trocar por uma faixa mais curta e restaura o padrão ao remover', () => {
    load(90)
    useProjectStore.getState().setClipRange(30, 90, 90)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(45, 3)
    load(10)
    const config = useProjectStore.getState().config
    expect(config.clipStart).toBeLessThanOrEqual(9.5)
    expect(config.clipDuration).toBeLessThanOrEqual(10)
    useProjectStore.getState().clearAudio()
    expect(useProjectStore.getState().config.clipDuration).toBe(DEFAULT_CLIP_SECONDS)
  })
})
