import type { PlatformId, TemplateId } from '../project/project.types'
import type { MotionProfileId } from '../visualizer/motion/motion.types'
import type { HookType } from '../storyboard/storyboard.types'
import type { ParsedMetricRow, RetentionMetric, RetentionRates, RetentionSummary } from './retention.types'

const DEFAULT_CONTEXT: {
  platform: PlatformId
  hook: HookType
  layoutId: TemplateId
  motionProfile: MotionProfileId
} = {
  platform: 'custom',
  hook: 'emotional',
  layoutId: 'mirage',
  motionProfile: 'dream',
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

/** Taxas só existem quando o denominador é real (views > 0). */
export function retentionRates(metric: Pick<RetentionMetric, 'views' | 'views3s' | 'avgWatchSeconds' | 'saves' | 'shares' | 'clicks'>): RetentionRates {
  return {
    holdRate: ratio(metric.views3s, metric.views),
    saveRate: ratio(metric.saves, metric.views),
    shareRate: ratio(metric.shares, metric.views),
    clickRate: ratio(metric.clicks, metric.views),
    avgWatchSeconds: metric.views > 0 ? metric.avgWatchSeconds : null,
  }
}

/**
 * Agrega variantes. Tempo médio é ponderado por views; taxas usam a soma dos
 * numeradores e denominadores (não a média das médias). Sem views → null.
 */
export function summarizeRetention(metrics: RetentionMetric[]): RetentionSummary {
  const views = metrics.reduce((sum, metric) => sum + metric.views, 0)
  const views3s = metrics.reduce((sum, metric) => sum + metric.views3s, 0)
  const saves = metrics.reduce((sum, metric) => sum + metric.saves, 0)
  const shares = metrics.reduce((sum, metric) => sum + metric.shares, 0)
  const clicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0)
  const watchSeconds = metrics.reduce((sum, metric) => sum + metric.avgWatchSeconds * metric.views, 0)
  return {
    variants: metrics.length,
    views,
    saves,
    shares,
    clicks,
    holdRate: ratio(views3s, views),
    saveRate: ratio(saves, views),
    shareRate: ratio(shares, views),
    clickRate: ratio(clicks, views),
    avgWatchSeconds: views > 0 ? watchSeconds / views : null,
  }
}

const HEADER_ALIASES: Record<string, keyof ParsedMetricRow> = {
  label: 'label',
  variante: 'label',
  nome: 'label',
  views: 'views',
  visualizacoes: 'views',
  visualizações: 'views',
  views3s: 'views3s',
  '3s': 'views3s',
  'views_3s': 'views3s',
  avgwatchseconds: 'avgWatchSeconds',
  avgwatch: 'avgWatchSeconds',
  tempomedio: 'avgWatchSeconds',
  tempomédio: 'avgWatchSeconds',
  saves: 'saves',
  salvamentos: 'saves',
  shares: 'shares',
  compartilhamentos: 'shares',
  clicks: 'clicks',
  cliques: 'clicks',
  notes: 'notes',
  notas: 'notes',
}

function normalizeHeader(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '')
}

function parseNumber(value: string | undefined, delimiter: string): number {
  if (!value) return 0
  const normalized = value.trim().replace(/\s/g, '')
  const withDot = delimiter === ';' ? normalized.replace(',', '.') : normalized
  const parsed = Number(withDot)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/**
 * CSV com cabeçalho. Aceita `,` ou `;` como separador e nomes em PT/EN.
 * Colunas obrigatórias: variante/label e views. Números ausentes viram 0.
 */
export function parseMetricsCsv(text: string): ParsedMetricRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) throw new Error('CSV vazio: inclua um cabeçalho e ao menos uma linha.')
  const delimiter = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(delimiter).map(normalizeHeader)
  const columns: Partial<Record<keyof ParsedMetricRow, number>> = {}
  headers.forEach((header, index) => {
    const key = HEADER_ALIASES[header]
    if (key) columns[key] = index
  })
  if (columns.label === undefined || columns.views === undefined) {
    throw new Error('O CSV precisa das colunas "variante" (ou label) e "views".')
  }

  const rows: ParsedMetricRow[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(delimiter)
    const label = (cells[columns.label] ?? '').trim()
    if (!label) continue
    const value = (key: keyof ParsedMetricRow): string | undefined =>
      columns[key] === undefined ? undefined : cells[columns[key] as number]
    rows.push({
      label,
      views: Math.round(parseNumber(value('views'), delimiter)),
      views3s: Math.round(parseNumber(value('views3s'), delimiter)),
      avgWatchSeconds: parseNumber(value('avgWatchSeconds'), delimiter),
      saves: Math.round(parseNumber(value('saves'), delimiter)),
      shares: Math.round(parseNumber(value('shares'), delimiter)),
      clicks: Math.round(parseNumber(value('clicks'), delimiter)),
      notes: (value('notes') ?? '').trim(),
    })
  }
  if (!rows.length) throw new Error('Nenhuma linha válida encontrada no CSV.')
  return rows
}

/** Cria a métrica com o contexto do projeto atual no momento da entrada. */
export function makeRetentionMetric(
  row: ParsedMetricRow,
  context: {
    platform: PlatformId
    hook: HookType
    layoutId: TemplateId
    motionProfile: MotionProfileId
  } = DEFAULT_CONTEXT,
  createdAt = new Date(),
): RetentionMetric {
  return {
    id: `metric-${createdAt.getTime().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    createdAt: createdAt.toISOString(),
    label: row.label,
    platform: context.platform,
    hook: context.hook,
    layoutId: context.layoutId,
    motionProfile: context.motionProfile,
    views: Math.max(0, Math.round(row.views)),
    views3s: Math.max(0, Math.min(row.views3s, row.views)),
    avgWatchSeconds: Math.max(0, row.avgWatchSeconds),
    saves: Math.max(0, Math.round(row.saves)),
    shares: Math.max(0, Math.round(row.shares)),
    clicks: Math.max(0, Math.round(row.clicks)),
    notes: row.notes,
  }
}
