import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { FinishPass } from '../features/visualizer/objects/finish-pass'
import { RENDER_PROFILES, chooseProfileFromCapabilities } from '../features/visualizer/render-profile'
import type { FinishParams } from '../features/visualizer/objects/finish-pass'

describe('render profile selection', () => {
  it('devolve um perfil explícito quando não for auto', () => {
    expect(chooseProfileFromCapabilities('export', null)).toBe('export')
    expect(chooseProfileFromCapabilities('performance', { deviceMemory: 8, hardwareConcurrency: 8, maxTextureSize: 16384 })).toBe('performance')
  })

  it('escolhe performance para dispositivos com pouca memória ou textura pequena', () => {
    expect(chooseProfileFromCapabilities('auto', { deviceMemory: 2, hardwareConcurrency: 4, maxTextureSize: 4096 })).toBe('performance')
    expect(chooseProfileFromCapabilities('auto', { deviceMemory: 0, hardwareConcurrency: 0, maxTextureSize: 2048 })).toBe('performance')
  })

  it('escolhe balanced para dispositivos normais quando auto', () => {
    expect(chooseProfileFromCapabilities('auto', { deviceMemory: 8, hardwareConcurrency: 8, maxTextureSize: 16384 })).toBe('balanced')
  })
})

describe('render profiles catalog', () => {
  it('export força qualidade cheia de acabamento', () => {
    const p = RENDER_PROFILES.export
    expect(p.finishSamples).toBe(4)
    expect(p.finishHalfFloat).toBe(true)
    expect(p.finishEnabled).toBe(true)
    expect(p.maxScale).toBe(1)
    expect(p.minScale).toBe(1)
    expect(p.antialias).toBe(false)
  })

  it('performance reduz amostragem, usa byte e desativa antialiasing', () => {
    const p = RENDER_PROFILES.performance
    expect(p.finishSamples).toBe(0)
    expect(p.finishHalfFloat).toBe(false)
    expect(p.antialias).toBe(false)
    expect(p.finishEnabled).toBe(true)
  })
})

describe('finish pass profile modes', () => {
  it('renderiza direto no canvas quando desabilitado, sem o render target intermediário', () => {
    const { finish, renderer } = makeFinishPass({ samples: 0, type: 'byte' })
    finish.setEnabled(false)
    const scene = { layers: [] } as unknown as THREE.Scene
    const camera = {} as THREE.PerspectiveCamera
    const params: FinishParams = { time: 0, grain: 0, vignette: 0, chroma: 0, scan: 0, glitch: 0 }
    finish.render(scene, camera, params)
    expect(renderer.setRenderTarget).toHaveBeenCalledWith(null)
    expect(renderer.clear).toHaveBeenCalled()
    expect(renderer.render).toHaveBeenCalledWith(scene, camera)
  })

  it('usa o render target intermediário quando habilitado', () => {
    const { finish, renderer } = makeFinishPass({ samples: 0, type: 'byte' })
    finish.setEnabled(true)
    const scene = { layers: [] } as unknown as THREE.Scene
    const camera = {} as THREE.PerspectiveCamera
    const params: FinishParams = { time: 0, grain: 0, vignette: 0, chroma: 0, scan: 0, glitch: 0 }
    finish.render(scene, camera, params)
    expect(renderer.setRenderTarget).toHaveBeenCalledTimes(2)
  })

  it('muda as configurações do render target ao reconstruir com outro perfil', () => {
    const { finish } = makeFinishPass({ samples: 4, type: 'half-float' })
    finish.setEnabled(false)
    expect(finish).toBeDefined()
  })
})

function makeFinishPass(options: { samples: number; type: 'half-float' | 'byte' }) {
  const renderer: THREE.WebGLRenderer = {
    domElement: document.createElement('canvas'),
    setRenderTarget: vi.fn(),
    clear: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    setSize: vi.fn(),
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
  } as unknown as THREE.WebGLRenderer
  const finish = new FinishPass(renderer, 100, 100, options)
  return { finish, renderer }
}
