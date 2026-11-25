import { describe, expect, it } from 'vitest'
import { computeWaveformPeaks } from '../features/audio/waveform'

describe('waveform peaks', () => {
  it('normaliza os picos e devolve a quantidade pedida', () => {
    const samples = new Float32Array(1000)
    for (let i = 0; i < samples.length; i += 1) samples[i] = i < 500 ? 0.1 : 0.8
    const peaks = computeWaveformPeaks([samples], 48000, 20)
    expect(peaks).toHaveLength(20)
    expect(Math.max(...peaks)).toBeCloseTo(1, 5)
    expect(peaks[0]).toBeLessThan(peaks[peaks.length - 1])
  })

  it('lida com áudio vazio sem quebrar', () => {
    expect(computeWaveformPeaks([], 48000, 8)).toEqual(new Array(8).fill(0))
    expect(computeWaveformPeaks([new Float32Array(0)], 48000, 8)).toEqual(new Array(8).fill(0))
  })
})
