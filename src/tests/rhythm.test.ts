import { describe, expect, it } from 'vitest'
import { computeOnsetEnvelope, estimateTempo } from '../features/audio/rhythm'

/** Envelope sintético com pulsos a cada `period` frames (rate em Hz). */
function clickEnvelope(frames: number, period: number, rate: number): Float32Array {
  const envelope = new Float32Array(frames)
  for (let i = 0; i < frames; i += period) envelope[i] = 1
  void rate
  return envelope
}

describe('computeOnsetEnvelope', () => {
  it('silêncio gera envelope zerado', () => {
    const samples = new Float32Array(8000)
    const envelope = computeOnsetEnvelope(samples, 8000, 100)
    expect(envelope.length).toBe(100)
    expect(Math.max(...envelope)).toBe(0)
  })

  it('pulsos de energia geram onsets normalizados em 0–1', () => {
    const sampleRate = 8000
    const samples = new Float32Array(sampleRate)
    // Rajadas curtas a cada 0,5 s (a primeira após o início, para gerar onset).
    for (let start = Math.round(sampleRate * 0.1); start < sampleRate; start += Math.round(sampleRate * 0.5)) {
      for (let i = 0; i < Math.round(sampleRate * 0.05); i++) samples[start + i] = 1
    }
    const envelope = computeOnsetEnvelope(samples, sampleRate, 100)
    const peak = Math.max(...envelope)
    const onsetFrames = Array.from(envelope).filter((v) => v > 0.4)
    expect(peak).toBeCloseTo(1, 5)
    expect(onsetFrames.length).toBeGreaterThanOrEqual(2)
  })
})

describe('estimateTempo', () => {
  it('detecta 120 BPM em envelope de pulsos', () => {
    // rate 100 Hz → 120 BPM = pulso a cada 50 frames.
    const envelope = clickEnvelope(1000, 50, 100)
    const result = estimateTempo(envelope, 100)
    expect(result.bpm).toBeGreaterThanOrEqual(117)
    expect(result.bpm).toBeLessThanOrEqual(123)
    expect(result.confidence).toBeGreaterThan(0.12)
  })

  it('detecta 80 BPM (pulso a cada 75 frames a 100 Hz)', () => {
    const envelope = clickEnvelope(1200, 75, 100)
    const result = estimateTempo(envelope, 100)
    expect(result.bpm).toBeGreaterThanOrEqual(77)
    expect(result.bpm).toBeLessThanOrEqual(83)
  })

  it('silêncio não inventa BPM', () => {
    const result = estimateTempo(new Float32Array(1000), 100)
    expect(result.bpm).toBe(0)
    expect(result.confidence).toBe(0)
  })

  it('envelope curto demais retorna 0', () => {
    expect(estimateTempo(new Float32Array(50), 100).bpm).toBe(0)
  })
})
