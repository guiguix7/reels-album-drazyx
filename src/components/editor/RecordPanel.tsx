import { useRecorderStore } from '../../features/recording/recording.store'
import type { RecorderStatus } from '../../features/recording/recording.store'
import { useProjectStore } from '../../features/project/project.store'
import { formatTimePrecise } from '../../lib/format-time'
import { Button, Notice, Panel } from '../ui/ui'
import styles from './panels.module.css'

function bytesLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

const STATUS_COPY: Record<RecorderStatus, string | null> = {
  idle: null,
  preparing: 'Preparando gravação...',
  recording: 'Gravando o trecho selecionado...',
  processing: 'Finalizando o arquivo...',
  done: 'Gravação concluída.',
  error: null,
}

export function RecordPanel({
  onStart,
  onCancel,
}: {
  onStart: () => Promise<void>
  onCancel: () => Promise<void>
}): JSX.Element {
  const status = useRecorderStore((s) => s.status)
  const statusMessage = useRecorderStore((s) => s.statusMessage)
  const error = useRecorderStore((s) => s.error)
  const preview = useRecorderStore((s) => s.preview)
  const reset = useRecorderStore((s) => s.reset)
  const audioStatus = useProjectStore((s) => s.audioStatus)
  const audioReady = audioStatus === 'ready' || audioStatus === 'playing' || audioStatus === 'paused'
  const busy = status === 'preparing' || status === 'recording' || status === 'processing'

  return (
    <Panel title="Gravação" hint="Grava o Stage + áudio sincronizado. Mantenha esta aba visível.">
      <div className={styles.recordRow}>
        {busy ? (
          <Button variant="danger" onClick={() => void onCancel()}>
            Cancelar
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => void onStart()}
            disabled={!audioReady}
          >
            {status === 'done' ? 'Gravar novamente' : 'Gravar trecho'}
          </Button>
        )}
        <span className={styles.recHint}>
          {preview ? `${preview.extension.toUpperCase()} · ${bytesLabel(preview.sizeBytes)}` : 'Vídeo com áudio em um arquivo'}
        </span>
      </div>

      {statusMessage && STATUS_COPY[status] ? <Notice tone="info">{STATUS_COPY[status]}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!audioReady && status === 'idle' ? (
        <Notice tone="info">Carregue um áudio para habilitar a gravação.</Notice>
      ) : null}

      {preview ? (
        <div className={styles.previewBlock}>
          <video
            src={preview.url}
            controls
            playsInline
            className={styles.previewVideo}
            style={{ aspectRatio: `${preview.width} / ${preview.height}` }}
            onLoadedMetadata={(e) => {
              // WebM gerado por MediaRecorder não traz a duração no cabeçalho:
              // um seek para o fim força o navegador a calcular e libera o scrub.
              const video = e.currentTarget
              if (Number.isFinite(video.duration)) return
              const onTimeUpdate = (): void => {
                video.removeEventListener('timeupdate', onTimeUpdate)
                video.currentTime = 0
              }
              video.addEventListener('timeupdate', onTimeUpdate)
              video.currentTime = 1e101
            }}
          />
          {preview.warnings.map((warning) => (
            <Notice key={warning} tone="info">
              {warning}
            </Notice>
          ))}
          <div className={styles.previewMeta}>
            <span className={styles.fileName} title={preview.fileName}>
              {preview.fileName}
            </span>
            <span className={styles.fileInfo}>
              {preview.width}×{preview.height} · {formatTimePrecise(preview.durationSeconds)} · {bytesLabel(preview.sizeBytes)}
            </span>
          </div>
          <div className={styles.previewActions}>
            <a href={preview.url} download={preview.fileName} className={styles.downloadLink}>
              <Button variant="primary">Baixar vídeo</Button>
            </a>
            <Button onClick={() => reset()}>Descartar</Button>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
