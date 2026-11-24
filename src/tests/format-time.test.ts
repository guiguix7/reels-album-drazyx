import { describe, expect, it } from 'vitest'
import { formatTime, formatTimePrecise } from '../lib/format-time'

describe('formatTime', () => {
  it('formata mm:ss com zero à esquerda', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(754)).toBe('12:34')
  })

  it('trata null/undefined/NaN', () => {
    expect(formatTime(null)).toBe('00:00')
    expect(formatTime(undefined)).toBe('00:00')
    expect(formatTime(Number.NaN)).toBe('00:00')
    expect(formatTime(-5)).toBe('00:00')
  })

  it('arredonda para baixo', () => {
    expect(formatTime(65.9)).toBe('01:05')
  })
})

describe('formatTimePrecise', () => {
  it('inclui décimos', () => {
    expect(formatTimePrecise(0)).toBe('00:00.0')
    expect(formatTimePrecise(30)).toBe('00:30.0')
    expect(formatTimePrecise(65.45)).toBe('01:05.4')
  })

  it('trata valores inválidos', () => {
    expect(formatTimePrecise(null)).toBe('00:00.0')
    expect(formatTimePrecise(undefined)).toBe('00:00.0')
  })
})
