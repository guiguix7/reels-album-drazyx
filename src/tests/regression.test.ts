import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { buildBatchJobs } from '../features/batch/batch.utils'
import { parseMetricsCsv } from '../features/retention/retention.utils'
import { safeArea } from '../features/visualizer/templates/template-utils'
import { capTextWidth, MAX_TEXT_WORLD_WIDTH } from '../features/visualizer/text-metrics'
import { VIEW_HEIGHT } from '../features/visualizer/visual.types'

const VIEW_WIDTHS: Record<string, number> = {
  '9:16': VIEW_HEIGHT * (9 / 16),
  '1:1': VIEW_HEIGHT,
  '16:9': VIEW_HEIGHT * (16 / 9),
}

describe('regressão de geometria do palco', () => {
  it('mantém as zonas seguras dentro do palco nas três proporções', () => {
    for (const [label, viewWidth] of Object.entries(VIEW_WIDTHS)) {
      const safe = safeArea(viewWidth, VIEW_HEIGHT)
      expect(safe.leftX, label).toBeLessThan(safe.rightX)
      expect(safe.bottomY, label).toBeLessThan(safe.topY)
      expect(safe.leftX, label).toBeGreaterThanOrEqual(-viewWidth / 2)
      expect(safe.rightX, label).toBeLessThanOrEqual(viewWidth / 2)
      expect(safe.bottomY, label).toBeGreaterThanOrEqual(-VIEW_HEIGHT / 2)
      expect(safe.topY, label).toBeLessThanOrEqual(VIEW_HEIGHT / 2)
      expect(safe.width, label).toBe(viewWidth)
      expect(safe.height, label).toBe(VIEW_HEIGHT)
    }
  })

  it('limita a largura do texto a 60% da altura do palco', () => {
    expect(MAX_TEXT_WORLD_WIDTH).toBeCloseTo(VIEW_HEIGHT * 0.6, 6)
    expect(capTextWidth(4.3875)).toBeCloseTo(4.3875, 6)
    expect(capTextWidth(6)).toBe(6)
    expect(capTextWidth(13.9)).toBe(MAX_TEXT_WORLD_WIDTH)
    expect(capTextWidth(Number.POSITIVE_INFINITY)).toBe(0)
    expect(capTextWidth(-2)).toBe(0)
  })
})

describe('regressão de lote e métricas', () => {
  it('gera jobs sem mutar a configuração base do projeto', () => {
    const base = structuredClone(DEFAULT_PROJECT)
    buildBatchJobs({ base, count: 5, platformId: 'tiktok' })
    expect(base).toEqual(DEFAULT_PROJECT)
  })

  it('CSV ignora colunas desconhecidas e preserva notas', () => {
    const csv = 'variante,views,formato,notas,views3s\nA,100,tiktok,teste com espaço,60'
    const rows = parseMetricsCsv(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].views3s).toBe(60)
    expect(rows[0].notes).toBe('teste com espaço')
  })
})
