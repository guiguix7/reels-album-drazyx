import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectStore } from '../features/project/project.store'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { LAYOUT_LIST } from '../features/visualizer/templates/registry'

describe('project.store', () => {
  beforeEach(() => {
    // Reset do estado entre testes
    useProjectStore.setState({
      config: structuredCloneSafe(),
      audioStatus: 'idle',
      audioMeta: null,
      audioError: null,
      coverMeta: null,
    })
  })

  it('estado inicial = DEFAULT_PROJECT', () => {
    expect(useProjectStore.getState().config.clipDuration).toBe(30)
    expect(useProjectStore.getState().config.templateId).toBe('mirage')
  })

  it('setTemplate aceita id válido', () => {
    useProjectStore.getState().setTemplate('t3')
    expect(useProjectStore.getState().config.templateId).toBe('t3')
  })

  it('aceita todos os oito layouts exibidos na galeria', () => {
    const store = useProjectStore.getState()
    for (const layout of LAYOUT_LIST) {
      store.setTemplate(layout.id)
      expect(useProjectStore.getState().config.templateId).toBe(layout.id)
    }
  })

  it('setTemplate rejeita id desconhecido', () => {
    const before = useProjectStore.getState().config.templateId
    // @ts-expect-error teste de proteção em runtime
    useProjectStore.getState().setTemplate('inexistente')
    expect(useProjectStore.getState().config.templateId).toBe(before)
  })

  it('setClipStart clampa dentro da faixa e re-clampa duração', () => {
    const s = useProjectStore.getState()
    s.setClipStart(95, 100)
    expect(useProjectStore.getState().config.clipStart).toBe(95)
    // duração deve re-clampar para 5 (fim da faixa) — clamp de duração mínima
    expect(useProjectStore.getState().config.clipDuration).toBeLessThanOrEqual(5)
  })

  it('setClipDuration aceita 45s e limita acima disso', () => {
    const s = useProjectStore.getState()
    s.setClipDuration(45, 300)
    expect(useProjectStore.getState().config.clipDuration).toBe(45)
    s.setClipDuration(120, 300)
    expect(useProjectStore.getState().config.clipDuration).toBe(45)
  })

  it('setClipDuration usa o que resta a partir do início, não 45 s absolutos', () => {
    const s = useProjectStore.getState()
    s.setClipStart(90, 97.4)
    expect(useProjectStore.getState().config.clipDuration).toBeCloseTo(7.4, 1)
    s.setClipDuration(20, 97.4)
    expect(useProjectStore.getState().config.clipStart + useProjectStore.getState().config.clipDuration).toBeLessThanOrEqual(97.4)
  })

  it('setClipRange respeita o áudio restante e o teto de 45s', () => {
    const s = useProjectStore.getState()
    s.setClipRange(0, 50, 97.4)
    expect(useProjectStore.getState().config.clipDuration).toBe(45)
    s.setClipRange(90, 97.4, 97.4)
    const config = useProjectStore.getState().config
    expect(config.clipStart).toBeGreaterThanOrEqual(90)
    expect(config.clipStart + config.clipDuration).toBeLessThanOrEqual(97.4)
  })

  it('áudio de 2 s não cria range impossível', () => {
    useProjectStore.getState().setAudioMeta({ fileName: 'short.wav', objectUrl: '', duration: 2 })
    const config = useProjectStore.getState().config
    expect(config.clipStart).toBe(0)
    expect(config.clipDuration).toBe(2)
  })

  it('setAudioMeta re-clampa o trecho quando o áudio novo é mais curto', () => {
    const s = useProjectStore.getState()
    s.setClipDuration(30, 300)
    s.setAudioMeta({ fileName: 'short.wav', objectUrl: '', duration: 12 })
    let config = useProjectStore.getState().config
    expect(config.clipStart).toBe(0)
    expect(config.clipDuration).toBe(12)

    s.setClipStart(20, 300)
    s.setAudioMeta({ fileName: 'shorter.wav', objectUrl: '', duration: 12 })
    config = useProjectStore.getState().config
    expect(config.clipStart).toBeLessThanOrEqual(11.5)
    expect(config.clipStart + config.clipDuration).toBeLessThanOrEqual(12)
    expect(config.clipDuration).toBeGreaterThanOrEqual(0.5)

    useProjectStore.getState().clearAudio()
    expect(useProjectStore.getState().config.clipDuration).toBe(30)
  })

  it('setVisual aplica patch parcial', () => {
    const s = useProjectStore.getState()
    s.setVisual({ intensity: 0.9 })
    expect(useProjectStore.getState().config.visual.intensity).toBe(0.9)
    expect(useProjectStore.getState().config.visual.glow).toBe(DEFAULT_PROJECT.visual.glow)
  })

  it('resetVisualToTemplateDefault volta aos padrões do template', () => {
    const s = useProjectStore.getState()
    s.setTemplate('void')
    s.setVisual({ intensity: 1, glow: 1 })
    s.resetVisualToTemplateDefault()
    const visual = useProjectStore.getState().config.visual
    expect(visual.intensity).toBe(0.5)
    expect(visual.glow).toBe(0.3)
    expect(visual.glitch).toBe('off')
  })
})

function structuredCloneSafe(): typeof DEFAULT_PROJECT {
  return JSON.parse(JSON.stringify(DEFAULT_PROJECT))
}
