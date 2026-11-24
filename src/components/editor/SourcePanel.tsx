import { useRef, useState } from 'react'
import { useAudioEngineMeta } from '../../features/audio/useAudioEngine'
import { useProjectStore } from '../../features/project/project.store'
import { validateImageFile } from '../../lib/file-validation'
import { extractPaletteFromUrl } from '../../features/palette/palette'
import { formatTime } from '../../lib/format-time'
import { Button, Notice, Panel } from '../ui/ui'
import styles from './panels.module.css'

export function SourcePanel(): JSX.Element {
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { engine, meta } = useAudioEngineMeta()
  const audioStatus = useProjectStore((s) => s.audioStatus)
  const audioError = useProjectStore((s) => s.audioError)
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const coverMeta = useProjectStore((s) => s.coverMeta)
  const setAudioMeta = useProjectStore((s) => s.setAudioMeta)
  const setAudioStatus = useProjectStore((s) => s.setAudioStatus)
  const clearAudio = useProjectStore((s) => s.clearAudio)
  const setCoverMeta = useProjectStore((s) => s.setCoverMeta)
  const setCoverPalette = useProjectStore((s) => s.setCoverPalette)
  const clearCover = useProjectStore((s) => s.clearCover)
  const [coverError, setCoverError] = useState<string | null>(null)

  const onAudioFile = async (file: File | undefined): Promise<void> => {
    if (!file) return
    setCoverError(null)
    setAudioStatus('loading')
    const ok = await engine.load(file)
    if (ok) {
      const duration = engine.getMeta().duration
      setAudioMeta({ fileName: file.name, objectUrl: engine.getObjectUrl() ?? '', duration })
    } else {
      setAudioStatus('error', engine.getMeta().error ?? 'Falha ao carregar o áudio.')
    }
  }

  const onCoverFile = (file: File | undefined): void => {
    if (!file) return
    const validation = validateImageFile(file)
    if (!validation.ok) {
      setCoverError(validation.error ?? 'Imagem inválida.')
      return
    }
    setCoverError(null)
    const objectUrl = URL.createObjectURL(file)
    setCoverMeta({ fileName: file.name, objectUrl })
    // Paleta automática: lê a capa em segundo plano e aplica se o modo for 'auto'.
    void extractPaletteFromUrl(objectUrl)
      .then((palette) => setCoverPalette(palette))
      .catch(() => setCoverPalette(null))
  }

  const statusMessage =
    audioStatus === 'loading'
      ? 'Decodificando áudio...'
      : audioError
        ? audioError
        : meta.error
          ? meta.error
          : null

  return (
    <Panel title="Fonte" hint="Áudio e capa ficam no navegador — nada é enviado para fora.">
      <div className={styles.fileRow}>
        <Button variant="primary" onClick={() => audioInputRef.current?.click()}>
          {audioMeta ? 'Trocar áudio' : 'Carregar áudio'}
        </Button>
        <div className={styles.fileMeta}>
          <span className={styles.fileName} title={audioMeta?.fileName}>
            {audioMeta ? audioMeta.fileName : 'Nenhum arquivo de áudio'}
          </span>
          {audioMeta ? <span className={styles.fileInfo}>{formatTime(audioMeta.duration)}</span> : null}
        </div>
        {audioMeta ? (
          <button type="button" className={styles.linkButton} onClick={() => clearAudio()}>
            Remover
          </button>
        ) : null}
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.opus"
          hidden
          onChange={(e) => {
            void onAudioFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <div className={styles.fileRow}>
        <Button onClick={() => coverInputRef.current?.click()}>
          {coverMeta ? 'Trocar capa' : 'Carregar capa'}
        </Button>
        <div className={styles.fileMeta}>
          <span className={styles.fileName} title={coverMeta?.fileName}>
            {coverMeta ? coverMeta.fileName : 'Sem capa (usando arte padrão)'}
          </span>
        </div>
        {coverMeta ? (
          <button type="button" className={styles.linkButton} onClick={() => clearCover()}>
            Remover
          </button>
        ) : null}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp"
          hidden
          onChange={(e) => {
            onCoverFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {coverError ? <Notice tone="error">{coverError}</Notice> : null}
      {statusMessage && audioStatus !== 'ready' ? (
        <Notice tone={audioStatus === 'error' ? 'error' : 'info'}>{statusMessage}</Notice>
      ) : null}
      {audioStatus === 'ready' || audioStatus === 'playing' || audioStatus === 'paused' ? (
        <Notice tone="ok">
          Áudio pronto. Duração {formatTime(meta.duration)}.
          {meta.bpm > 0 ? ` Ritmo detectado: ${meta.bpm} BPM.` : ''}
        </Notice>
      ) : null}
    </Panel>
  )
}
