/**
 * Gera um WAV sintético de teste (mono 16-bit 44.1 kHz) com kicks de grave,
 * hihat e uma melodia simples — usado para QA visual no navegador.
 * Uso: node scripts/generate-test-audio.mjs <saida.wav>
 */
import { writeFileSync } from 'node:fs'

const outPath = process.argv[2] ?? 'test-audio.wav'
const sampleRate = 44100
const duration = 34
const numSamples = sampleRate * duration
const bytesPerSample = 2
const dataSize = numSamples * bytesPerSample

const buffer = Buffer.alloc(44 + dataSize)
buffer.write('RIFF', 0, 'ascii')
buffer.writeUInt32LE(36 + dataSize, 4)
buffer.write('WAVE', 8, 'ascii')
buffer.write('fmt ', 12, 'ascii')
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20) // PCM
buffer.writeUInt16LE(1, 22) // mono
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(sampleRate * bytesPerSample, 28)
buffer.writeUInt16LE(bytesPerSample, 32)
buffer.writeUInt16LE(16, 34)
buffer.write('data', 36, 'ascii')
buffer.writeUInt32LE(dataSize, 40)

// Pseudo-random estável para hats
let seed = 12345
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

const scale = [0, 3, 5, 7, 10, 12, 15, 12, 10, 7, 5, 3]
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate
  const beatPhase = t % 0.5
  const kickEnv = Math.exp(-beatPhase * 14)
  let sample = 0
  // Kick de grave (55 Hz com sweep para baixo)
  sample += kickEnv * Math.sin(2 * Math.PI * (55 - beatPhase * 20) * t) * 0.72
  // Sub grave contínuo
  sample += Math.sin(2 * Math.PI * 41 * t) * 0.18 * (0.6 + 0.4 * Math.sin(t * 0.8))
  // Hat nos offbeats
  const hatEnv = t % 1 >= 0.25 && t % 1 < 0.3 ? 1 : 0
  if (hatEnv > 0) sample += (rand() * 2 - 1) * 0.22 * Math.exp(-(t % 0.05) * 60)
  // Melodia (nota muda a cada 0.5s)
  const step = Math.floor(t / 0.5) % scale.length
  const freq = 220 * Math.pow(2, scale[step] / 12)
  const noteEnv = Math.exp(-(t % 0.5) * 3.2)
  sample += noteEnv * Math.sin(2 * Math.PI * freq * t) * 0.26
  sample = Math.max(-0.98, Math.min(0.98, sample))
  buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * bytesPerSample)
}

writeFileSync(outPath, buffer)
console.log(`OK: ${outPath} (${duration}s, ${numSamples} samples)`)
