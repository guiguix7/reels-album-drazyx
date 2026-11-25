import { useCallback, useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import {
  deleteMetric,
  listExportManifests,
  listMetrics,
  saveMetric,
} from '../../features/persistence/db'
import { makeRetentionMetric, parseMetricsCsv, retentionRates, summarizeRetention } from '../../features/retention/retention.utils'
import type { RetentionMetric } from '../../features/retention/retention.types'
import { Button, Notice, Panel, TextInput } from '../ui/ui'
import styles from './panels.module.css'

const EMPTY_FORM = {
  label: '',
  views: '',
  views3s: '',
  avgWatchSeconds: '',
  saves: '',
  shares: '',
  clicks: '',
  notes: '',
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function percent(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`
}

function seconds(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}s`
}

/**
 * Retention Lab: métricas informadas manualmente ou importadas de CSV.
 * Nenhum dado é coletado automaticamente e nenhuma causalidade é afirmada.
 */
export function RetentionLabPanel(): JSX.Element {
  const config = useProjectStore((s) => s.config)
  const [metrics, setMetrics] = useState<RetentionMetric[]>([])
  const [exportsCount, setExportsCount] = useState(0)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const csvRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [stored, manifests] = await Promise.all([listMetrics(), listExportManifests(200)])
      setMetrics(stored)
      setExportsCount(manifests.length)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ler as métricas locais.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const context = {
    platform: config.platform,
    hook: config.storyboard.hook.type,
    layoutId: config.templateId,
    motionProfile: config.visual.motionProfile,
  }

  const addFromForm = async (): Promise<void> => {
    if (!form.label.trim()) {
      setError('Dê um nome à variante antes de salvar.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveMetric(
        makeRetentionMetric(
          {
            label: form.label.trim(),
            views: toNumber(form.views),
            views3s: toNumber(form.views3s),
            avgWatchSeconds: toNumber(form.avgWatchSeconds),
            saves: toNumber(form.saves),
            shares: toNumber(form.shares),
            clicks: toNumber(form.clicks),
            notes: form.notes.trim(),
          },
          context,
        ),
      )
      setForm({ ...EMPTY_FORM })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar a métrica.')
    } finally {
      setBusy(false)
    }
  }

  const importCsv = async (file: File | undefined): Promise<void> => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const rows = parseMetricsCsv(await file.text())
      for (const row of rows) await saveMetric(makeRetentionMetric(row, context))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar o CSV.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string): Promise<void> => {
    setBusy(true)
    try {
      await deleteMetric(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir a métrica.')
    } finally {
      setBusy(false)
    }
  }

  const summary = summarizeRetention(metrics)
  const fields: Array<{ key: keyof typeof EMPTY_FORM; label: string; step?: string }> = [
    { key: 'views', label: 'Views' },
    { key: 'views3s', label: 'Views 3s' },
    { key: 'avgWatchSeconds', label: 'Tempo médio (s)', step: '0.1' },
    { key: 'saves', label: 'Saves' },
    { key: 'shares', label: 'Shares' },
    { key: 'clicks', label: 'Cliques' },
  ]

  return (
    <Panel
      title="Retention Lab"
      hint="Métricas informadas por você (manual ou CSV). Sem coleta automática e sem afirmar causalidade."
      actions={
        <Button onClick={() => void refresh()} disabled={busy}>
          Atualizar
        </Button>
      }
    >
      <p className={styles.panelNote}>
        {exportsCount} export{exportsCount === 1 ? '' : 's'} registrado{exportsCount === 1 ? '' : 's'} localmente.
        Comparações usam views como denominador; sem views, a taxa fica indefinida (—).
      </p>

      <TextInput label="Variante" value={form.label} maxLength={60} onChange={(label) => setForm({ ...form, label })} />

      <div className={styles.numberGrid}>
        {fields.map((field) => (
          <label key={field.key} className={styles.numberField}>
            <span>{field.label}</span>
            <input
              type="number"
              min={0}
              step={field.step ?? '1'}
              className={styles.numberInput}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          </label>
        ))}
      </div>

      <div className={styles.sbToolbar}>
        <Button variant="primary" onClick={() => void addFromForm()} disabled={busy}>
          Salvar métrica
        </Button>
        <Button onClick={() => csvRef.current?.click()} disabled={busy}>
          Importar CSV
        </Button>
        <input
          ref={csvRef}
          type="file"
          accept="text/csv,.csv"
          hidden
          onChange={(e) => {
            void importCsv(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <p className={styles.panelNote}>
        CSV: cabeçalho com <code>variante</code> e <code>views</code>; opcionais <code>views3s</code>,{' '}
        <code>tempomedio</code>, <code>saves</code>, <code>shares</code>, <code>cliques</code>, <code>notas</code>.
      </p>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCell}>
          <span className={styles.summaryLabel}>Variantes</span>
          <span className={styles.summaryValue}>{summary.variants}</span>
        </div>
        <div className={styles.summaryCell}>
          <span className={styles.summaryLabel}>Views</span>
          <span className={styles.summaryValue}>{summary.views}</span>
        </div>
        <div className={styles.summaryCell}>
          <span className={styles.summaryLabel}>Retenção 3s</span>
          <span className={styles.summaryValue}>{percent(summary.holdRate)}</span>
        </div>
        <div className={styles.summaryCell}>
          <span className={styles.summaryLabel}>Tempo médio</span>
          <span className={styles.summaryValue}>{seconds(summary.avgWatchSeconds)}</span>
        </div>
        <div className={styles.summaryCell}>
          <span className={styles.summaryLabel}>Saves</span>
          <span className={styles.summaryValue}>{percent(summary.saveRate)}</span>
        </div>
        <div className={styles.summaryCell}>
          <span className={styles.summaryLabel}>Cliques</span>
          <span className={styles.summaryValue}>{percent(summary.clickRate)}</span>
        </div>
      </div>

      {metrics.length === 0 ? (
        <p className={styles.panelNote}>Nenhuma métrica registrada ainda.</p>
      ) : (
        <ul className={styles.metricList}>
          {metrics.map((metric) => {
            const rates = retentionRates(metric)
            return (
              <li key={metric.id} className={styles.metricItem}>
                <div className={styles.projectHead}>
                  <span className={styles.projectName}>{metric.label}</span>
                  <span className={styles.projectDate}>{metric.views} views</span>
                </div>
                <span className={styles.batchJobMeta}>
                  {metric.platform.toUpperCase()} · {metric.layoutId.toUpperCase()} · {metric.motionProfile.toUpperCase()} ·{' '}
                  {metric.hook}
                </span>
                <span className={styles.batchJobMeta}>
                  3s {percent(rates.holdRate)} · médio {seconds(rates.avgWatchSeconds)} · saves {percent(rates.saveRate)} ·
                  cliques {percent(rates.clickRate)}
                </span>
                {metric.notes ? <span className={styles.panelNote}>{metric.notes}</span> : null}
                <Button variant="danger" onClick={() => void remove(metric.id)} disabled={busy}>
                  Excluir
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
