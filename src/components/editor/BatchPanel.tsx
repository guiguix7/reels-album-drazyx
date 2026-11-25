import { useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { useBatchStore } from '../../features/batch/batch.store'
import { buildBatchJobs, MAX_BATCH_JOBS } from '../../features/batch/batch.utils'
import { PLATFORM_OPTIONS } from '../../features/platform/platform.profiles'
import { RECIPE_IDS, RECIPES } from '../../features/recipes/recipes'
import type { RecipeId } from '../../features/recipes/recipes'
import type { PlatformId } from '../../features/project/project.types'
import { Button, Notice, Panel, Segmented, Select, Toggle } from '../ui/ui'
import styles from './panels.module.css'

function bytesLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

const COUNT_OPTIONS: Array<{ value: 3 | 4 | 5; label: string }> = [
  { value: 3, label: '3 peças' },
  { value: 4, label: '4 peças' },
  { value: 5, label: '5 peças' },
]

const STATUS_LABELS: Record<string, string> = {
  queued: 'Na fila',
  recording: 'Gravando',
  processing: 'Finalizando',
  done: 'Pronto',
  error: 'Erro',
}

/** Batch Creator: fila sequencial de variações com o mesmo pipeline de gravação. */
export function BatchPanel({
  onStart,
  onCancel,
}: {
  onStart: () => Promise<void>
  onCancel: () => Promise<void>
}): JSX.Element {
  const config = useProjectStore((s) => s.config)
  const setPlatform = useProjectStore((s) => s.setPlatform)
  const audioStatus = useProjectStore((s) => s.audioStatus)
  const audioReady = audioStatus === 'ready' || audioStatus === 'playing' || audioStatus === 'paused'
  const jobs = useBatchStore((s) => s.jobs)
  const running = useBatchStore((s) => s.running)
  const error = useBatchStore((s) => s.error)
  const setJobs = useBatchStore((s) => s.setJobs)
  const clear = useBatchStore((s) => s.clear)

  const [count, setCount] = useState<3 | 4 | 5>(3)
  const [selected, setSelected] = useState<RecipeId[]>([...RECIPE_IDS])

  const toggleRecipe = (id: RecipeId): void => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const generate = (): void => {
    setJobs(
      buildBatchJobs({
        base: config,
        recipeIds: selected,
        platformId: config.platform,
        count: Math.min(count, MAX_BATCH_JOBS),
      }),
    )
  }

  return (
    <Panel
      title="Batch Creator"
      hint="Grava a fila em sequência e devolve um arquivo por variação. A configuração original volta ao fim."
    >
      <Select
        label="Plataforma"
        value={config.platform}
        options={PLATFORM_OPTIONS}
        onChange={(id) => setPlatform(id as PlatformId)}
      />

      <div className={styles.inlineField}>
        <span className={styles.rowLabel}>Peças</span>
        <Segmented options={COUNT_OPTIONS} value={count} onChange={(value) => setCount(value)} />
      </div>

      <div className={styles.recipeToggles}>
        {RECIPE_IDS.map((id) => (
          <Toggle
            key={id}
            label={RECIPES[id].name}
            checked={selected.includes(id)}
            onChange={() => toggleRecipe(id)}
          />
        ))}
      </div>

      <div className={styles.sbToolbar}>
        <Button onClick={generate} disabled={running || selected.length === 0}>
          Gerar fila
        </Button>
        {running ? (
          <Button variant="danger" onClick={() => void onCancel()}>
            Cancelar lote
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void onStart()} disabled={!audioReady || jobs.length === 0}>
            Gravar lote
          </Button>
        )}
        {jobs.length > 0 && !running ? <Button onClick={clear}>Limpar</Button> : null}
      </div>

      {!audioReady ? <Notice tone="info">Carregue um áudio para habilitar o lote.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {jobs.length > 0 ? (
        <ul className={styles.batchList}>
          {jobs.map((job) => (
            <li key={job.id} className={styles.batchJob}>
              <div className={styles.batchJobHead}>
                <span className={styles.batchJobLabel}>{job.label}</span>
                <span className={styles.batchStatus} data-status={job.status}>
                  {STATUS_LABELS[job.status] ?? job.status}
                </span>
              </div>
              <span className={styles.batchJobMeta}>
                {job.platformId.toUpperCase()} · {job.config.aspectRatio} ·{' '}
                {job.config.quality === 'full' ? '1080' : '720'}
              </span>
              {job.error ? <span className={styles.batchError}>{job.error}</span> : null}
              {job.result ? (
                <div className={styles.batchResult}>
                  <span className={styles.batchJobMeta}>
                    {job.result.width}×{job.result.height} · {bytesLabel(job.result.sizeBytes)}
                  </span>
                  <a href={job.result.url} download={job.result.fileName} className={styles.downloadLink}>
                    <Button>Baixar</Button>
                  </a>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.panelNote}>Gere a fila para ver as variações antes de gravar.</p>
      )}
    </Panel>
  )
}
