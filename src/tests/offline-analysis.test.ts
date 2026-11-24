import { describe, expect, it } from 'vitest'
import { analyzeSamples } from '../features/audio/offline-analysis'

function burstSignal(sampleRate: number, seconds: number, from: number, to: number): Float32Array {
  const data = new Float32Array(sampleRate * seconds)
  for (let i = Math.floor(from * sampleRate); i < Math.floor(to * sampleRate); i += 1) {
    data[i] = Math.sin((2 * Math.PI * 5 * i) / sampleRate) * 0.8
  }
  return data
}

describe('analyzeSamples', () => {
  it('detecta onset e pico de um burst real no meio do silêncio', () => {
    const sampleRate = 100
    const result = analyzeSamples([burstSignal(sampleRate, 10, 4, 6)], sampleRate, 0, 10)
    expect(result.duration).toBeCloseTo(10, 3)
    expect(result.energy.length).toBe(100)
    expect(result.events.length).toBeGreaterThan(0)
    expect(result.onsetTime).toBeGreaterThanOrEqual(3.9)
    expect(result.onsetTime).toBeLessThanOrEqual(4.8)
    expect(result.peakTime).toBeGreaterThanOrEqual(4)
    expect(result.peakTime).toBeLessThanOrEqual(6)
  })

  it('silêncio não inventa eventos', () => {
    const result = analyzeSamples([new Float32Array(300)], 100, 0, 3)
    expect(result.events).toHaveLength(0)
    expect(result.peakTime).toBeCloseTo(0.05, 3)
    expect(result.onsetTime).toBeCloseTo(0.5, 3)
  })

  it('respeita o recorte de início e duração', () => {
    const result = analyzeSamples([burstSignal(100, 10, 4, 6)], 100, 4, 2)
    expect(result.duration).toBeCloseTo(2, 3)
    expect(result.peakTime).toBeGreaterThanOrEqual(4)
    expect(result.peakTime).toBeLessThanOrEqual(6)
  })
})
