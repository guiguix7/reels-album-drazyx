import { describe, expect, it } from 'vitest'
import { makeRetentionMetric, parseMetricsCsv, retentionRates, summarizeRetention } from '../features/retention/retention.utils'
import type { ParsedMetricRow, RetentionMetric } from '../features/retention/retention.types'

const row: ParsedMetricRow = {
  label: 'Atmosfera A',
  views: 1000,
  views3s: 640,
  avgWatchSeconds: 9.5,
  saves: 40,
  shares: 12,
  clicks: 75,
  notes: '',
}

function metric(overrides: Partial<RetentionMetric> = {}): RetentionMetric {
  const base = makeRetentionMetric(row, undefined, new Date('2026-11-24T10:00:00Z'))
  return { ...base, ...overrides }
}

describe('retention metrics', () => {
  it('calcula taxas com denominador real', () => {
    const rates = retentionRates(metric())
    expect(rates.holdRate).toBeCloseTo(0.64, 5)
    expect(rates.saveRate).toBeCloseTo(0.04, 5)
    expect(rates.shareRate).toBeCloseTo(0.012, 5)
    expect(rates.clickRate).toBeCloseTo(0.075, 5)
    expect(rates.avgWatchSeconds).toBe(9.5)
  })

  it('devolve null quando não há views', () => {
    const rates = retentionRates(metric({ views: 0, views3s: 0 }))
    expect(rates.holdRate).toBeNull()
    expect(rates.saveRate).toBeNull()
    expect(rates.avgWatchSeconds).toBeNull()
  })

  it('agrega somando numeradores e ponderando tempo por views', () => {
    const a = metric({ views: 1000, views3s: 640, avgWatchSeconds: 9.5, saves: 40 })
    const b = metric({ views: 500, views3s: 200, avgWatchSeconds: 3.5, saves: 10 })
    const summary = summarizeRetention([a, b])
    expect(summary.variants).toBe(2)
    expect(summary.views).toBe(1500)
    expect(summary.holdRate).toBeCloseTo(840 / 1500, 5)
    expect(summary.saveRate).toBeCloseTo(50 / 1500, 5)
    expect(summary.avgWatchSeconds).toBeCloseTo((9.5 * 1000 + 3.5 * 500) / 1500, 5)
    expect(summarizeRetention([]).views).toBe(0)
    expect(summarizeRetention([]).holdRate).toBeNull()
  })

  it('limita views3s às views e aceita vírgula decimal no CSV com ponto e vírgula', () => {
    const metrics = makeRetentionMetric({ ...row, views3s: 5000 })
    expect(metrics.views3s).toBe(metrics.views)

    const csv = 'variante;views;views3s;tempomedio;saves;cliques\nA;1000;640;9,5;40;75\nB;500;200;3,5;10;20'
    const rows = parseMetricsCsv(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].label).toBe('A')
    expect(rows[0].avgWatchSeconds).toBe(9.5)
    expect(rows[1].clicks).toBe(20)
  })

  it('aceita cabeçalhos em inglês com vírgula e rejeita CSV inválido', () => {
    const rows = parseMetricsCsv('label,views,views3s,avgWatchSeconds,saves,shares,clicks\nTeste,120,60,4,2,1,3')
    expect(rows[0]).toEqual({
      label: 'Teste',
      views: 120,
      views3s: 60,
      avgWatchSeconds: 4,
      saves: 2,
      shares: 1,
      clicks: 3,
      notes: '',
    })
    expect(() => parseMetricsCsv('foo,bar\n1,2')).toThrow(/variante/)
    expect(() => parseMetricsCsv('variante,views')).toThrow(/vazio/)
  })
})
