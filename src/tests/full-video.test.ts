import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectStore } from '../features/project/project.store'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { getMaxClipSeconds } from '../features/project/clip-limit'

describe('full music video mode', () => {
  beforeEach(() => {
    useProjectStore.setState({
      config: structuredClone(DEFAULT_PROJECT),
      audioMeta: { fileName: 'full.wav', objectUrl: '', duration: 147.4 },
      selectedElementId: null,
    })
  })

  it('usa a faixa inteira e 16:9 no modo completo', () => {
    useProjectStore.getState().setProductionMode('full')
    const config = useProjectStore.getState().config
    expect(config.productionMode).toBe('full')
    expect(config.aspectRatio).toBe('16:9')
    expect(config.clipStart).toBe(0)
    expect(config.clipDuration).toBeCloseTo(147.4, 3)
    expect(getMaxClipSeconds(config, 147.4)).toBeCloseTo(147.4, 3)
  })

  it('não aplica o teto de 45 s ao modo completo', () => {
    useProjectStore.getState().setProductionMode('full')
    useProjectStore.getState().setClipDuration(200, 147.4)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(147.4, 3)
    useProjectStore.getState().setClipRange(100, 147.4, 147.4)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(47.4, 3)
  })

  it('volta ao social em 9:16 com teto de 45 s', () => {
    useProjectStore.getState().setProductionMode('full')
    useProjectStore.getState().setProductionMode('social')
    const config = useProjectStore.getState().config
    expect(config.productionMode).toBe('social')
    expect(config.aspectRatio).toBe('9:16')
    expect(config.clipDuration).toBeLessThanOrEqual(45)
  })

  it('trocar o áudio no modo completo mantém a faixa inteira', () => {
    useProjectStore.getState().setProductionMode('full')
    useProjectStore.getState().setAudioMeta({ fileName: 'novo.wav', objectUrl: '', duration: 62 })
    const config = useProjectStore.getState().config
    expect(config.clipStart).toBe(0)
    expect(config.clipDuration).toBe(62)
  })
})
