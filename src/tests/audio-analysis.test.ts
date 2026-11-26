import { describe, expect, it } from 'vitest'
import { computeWaveformPeaks } from '../features/audio/waveform'
import { loadWaveformPeaks, analyzeLocalRhythm, invalidateAnalysis } from '../features/audio/audio-analysis'

describe('shared audio analysis', () => {
  it('computeWaveformPeaks é puro e testável sem AudioContext', () => {
    const channels = [
      new Float32Array([0, 0.5, -0.5, 0.25, -0.25]),
      new Float32Array([0, 0.4, -0.4, 0.2, -0.2]),
    ]
    const peaks = computeWaveformPeaks(channels, 44100, 4)
    expect(peaks).toHaveLength(4)
    expect(peaks.every((value) => typeof value === 'number' && Number.isFinite(value))).toBe(true)
  })

  it('computeWaveformPeaks devolve zeros para áudio vazio', () => {
    const channels = [new Float32Array(0)]
    const peaks = computeWaveformPeaks(channels, 44100, 5)
    expect(peaks).toHaveLength(5)
    expect(peaks.every((value) => value === 0)).toBe(true)
  })

  it('loadWaveformPeaks e analyzeLocalRhythm existem e são assinaturas públicas válidas', () => {
    expect(typeof loadWaveformPeaks).toBe('function')
    expect(typeof analyzeLocalRhythm).toBe('function')
    expect(typeof invalidateAnalysis).toBe('function')
  })

  it('invalidateAnalysis aceita string e é idempotente', () => {
    expect(typeof invalidateAnalysis).toBe('function')
    expect(invalidateAnalysis.length).toBe(1)
    expect(() => invalidateAnalysis('blob:discarded-audio')).not.toThrow()
  })
})
