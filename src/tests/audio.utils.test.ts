import { describe, expect, it } from 'vitest'
import {
  TransientDetector,
  averageByteRange,
  bandCurve,
  designLogBars,
  envelope,
  spectralFlux,
} from '../features/audio/audio.utils'

describe('averageByteRange', () => {
  it('média sobre o intervalo pedido normalizada 0–1 (fim exclusivo)', () => {
    const data = new Uint8Array([0, 100, 200, 255])
    expect(averageByteRange(data, 0, 2)).toBeCloseTo((0 + 100) / 2 / 255, 5)
  })

  it('retorna 0 em intervalo vazio', () => {
    expect(averageByteRange(new Uint8Array(4), 2, 2)).toBe(0)
  })

  it('clamp de índices fora do array', () => {
    const data = new Uint8Array([255, 255])
    expect(averageByteRange(data, 0, 100)).toBe(1)
  })
})

describe('designLogBars', () => {
  it('gera faixas log-espaciadas cobrindo a faixa pedida', () => {
    const ranges = designLogBars(64, 40, 12000, 48000, 2048)
    expect(ranges).toHaveLength(64)
    // primeira faixa começa no bin de 40Hz (arredondado)
    expect(ranges[0][0]).toBe(2)
    // primeiras faixas monotônicas e com largura positiva (podem encostar, mínimo 0.5 bin)
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i][0]).toBeGreaterThanOrEqual(ranges[i - 1][0])
      expect(ranges[i][1]).toBeGreaterThan(ranges[i][0])
    }
    // última faixa termina dentro do array de bins (1043Hz..12000Hz → bin ≤ 512)
    expect(ranges[63][1]).toBeLessThanOrEqual(1024)
  })
})

describe('envelope', () => {
  it('subida rápida com attack', () => {
    const value = envelope(0, 1, 0.04, 0.3, 0.016)
    expect(value).toBeGreaterThan(0.3)
  })

  it('queda lenta com release', () => {
    const value = envelope(1, 0, 0.04, 0.3, 0.016)
    expect(value).toBeGreaterThan(0.85)
  })

  it('clamp em 0–1', () => {
    expect(envelope(1.2, 5, 0.1, 0.1, 0.5)).toBeLessThanOrEqual(1)
    expect(envelope(0, 0, 0.1, 0.1, 0.5)).toBeGreaterThanOrEqual(0)
  })
})

describe('TransientDetector', () => {
  it('não dispara em sinal constante', () => {
    const detector = new TransientDetector()
    let fired = false
    for (let i = 0; i < 60; i++) {
      fired = detector.maybeFire(0.5, i * 0.016) || fired
    }
    expect(fired).toBe(false)
  })

  it('dispara em pico e respeita cooldown', () => {
    const detector = new TransientDetector()
    let firedCount = 0
    // Aquece o histórico com sinal baixo
    for (let i = 0; i < 60; i++) detector.maybeFire(0.1, i * 0.016)
    // Pico
    firedCount += detector.maybeFire(0.9, 61 * 0.016) ? 1 : 0
    // Imediatamente outro pico — cooldown impede
    firedCount += detector.maybeFire(0.95, 62 * 0.016) ? 1 : 0
    expect(firedCount).toBe(1)
  })
})

describe('spectralFlux', () => {
  it('soma apenas deltas positivos, normalizado por bins*255 (ignora bin 0)', () => {
    const cur = new Uint8Array([10, 200, 0, 100])
    const prev = new Uint8Array([100, 100, 100, 100])
    const flux = spectralFlux(cur, prev, 4)
    expect(flux).toBeCloseTo(100 / (4 * 255), 5)
  })

  it('limita o cálculo até o bin pedido', () => {
    const cur = new Uint8Array([255, 255, 255])
    const prev = new Uint8Array([0, 0, 0])
    expect(spectralFlux(cur, prev, 2)).toBeCloseTo(255 / (2 * 255), 5)
  })
})

describe('bandCurve', () => {
  it('realce não linear do valor', () => {
    expect(bandCurve(0)).toBe(0)
    expect(bandCurve(1)).toBe(1)
    expect(bandCurve(0.5)).toBeLessThan(0.5)
  })
})
