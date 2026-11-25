import { describe, expect, it } from 'vitest'
import { getClipReadiness } from '../features/project/project.types'

describe('clip readiness', () => {
  it('bloqueia áudio de 2 s com motivo explícito', () => {
    const readiness = getClipReadiness({ clipStart: 0, clipDuration: 2 }, 2)
    expect(readiness.recordable).toBe(false)
    expect(readiness.effective).toBe(2)
    expect(readiness.reason).toContain('mínimo')
  })

  it('permite trecho de 5 s', () => {
    const readiness = getClipReadiness({ clipStart: 0, clipDuration: 5 }, 10)
    expect(readiness.recordable).toBe(true)
    expect(readiness.reason).toBeNull()
  })

  it('respeita o fim real da faixa', () => {
    const readiness = getClipReadiness({ clipStart: 8, clipDuration: 30 }, 10)
    expect(readiness.effective).toBe(2)
    expect(readiness.recordable).toBe(false)
  })

  it('sem áudio não é gravável', () => {
    const readiness = getClipReadiness({ clipStart: 0, clipDuration: 30 }, null)
    expect(readiness.recordable).toBe(false)
    expect(readiness.reason).toContain('Carregue')
  })
})
