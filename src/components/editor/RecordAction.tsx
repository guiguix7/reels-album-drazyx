import { useEffect, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { getClipReadiness } from '../../features/project/project.types'
import { MIN_CLIP_SECONDS } from '../../features/project/project.defaults'
import { useRecorderStore } from '../../features/recording/recording.store'
import { formatTimePrecise } from '../../lib/format-time'
import styles from '../../app/app.module.css'

/**
 * Ação primária persistente: fica no topo, fora do palco, e nunca exige rolar
 * todos os painéis. O painel de gravação continua com preview/download.
 */
export function RecordAction({
  onStart,
  onCancel,
}: {
  onStart: () => Promise<void>
  onCancel: () => Promise<void>
}): JSX.Element {
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const config = useProjectStore((s) => s.config)
  const status = useRecorderStore((s) => s.status)
  const readiness = getClipReadiness(config, audioMeta?.duration ?? null, MIN_CLIP_SECONDS)
  const busy = status === 'preparing' || status === 'recording' || status === 'processing'
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'recording') {
      setElapsed(0)
      return
    }
    const startedAt = performance.now()
    const id = window.setInterval(() => setElapsed((performance.now() - startedAt) / 1000), 250)
    return () => window.clearInterval(id)
  }, [status])

  const actionLabel = config.productionMode === 'full' ? 'Gravar music video' : 'Gravar clipe'
  const label = busy
    ? status === 'recording'
      ? `Gravando ${formatTimePrecise(elapsed)}`
      : status === 'processing'
        ? 'Finalizando...'
        : 'Preparando...'
    : actionLabel

  return (
    <div className={styles.productionAction}>
      <span className={`${styles.recordState} ${busy ? styles.recordStateBusy : ''}`} aria-live="polite">
        <span className={styles.recordDot} aria-hidden="true" />
        {busy ? label : readiness.recordable ? `Pronto · ${formatTimePrecise(readiness.effective)}` : 'Gravação bloqueada'}
      </span>
      <button
        type="button"
        className={`${styles.recordButton} ${busy ? styles.recordButtonCancel : ''}`}
        onClick={() => void (busy ? onCancel() : onStart())}
        disabled={!busy && !readiness.recordable}
        title={!busy && readiness.reason ? readiness.reason : undefined}
        aria-describedby={!busy && readiness.reason ? 'record-block-reason' : undefined}
      >
        {busy ? 'Cancelar' : actionLabel}
      </button>
      {!busy && readiness.reason ? (
        <span id="record-block-reason" className={styles.recordReason}>
          {readiness.reason}
        </span>
      ) : null}
    </div>
  )
}
