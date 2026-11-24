import { useProjectStore } from '../../features/project/project.store'
import { useAudioEngineMeta } from '../../features/audio/useAudioEngine'
import { getClipEnd, getEffectiveClipSeconds } from '../../features/project/project.types'
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, VISUAL_LIMITS } from '../../features/project/project.defaults'
import { formatTime, formatTimePrecise } from '../../lib/format-time'
import { Panel, Slider } from '../ui/ui'
import styles from './panels.module.css'

function clipSecondsLabel(seconds: number): string {
  return `${formatTimePrecise(seconds)}`
}

export function ClipPanel(): JSX.Element {
  const { meta } = useAudioEngineMeta()
  const config = useProjectStore((s) => s.config)
  const setClipStart = useProjectStore((s) => s.setClipStart)
  const setClipDuration = useProjectStore((s) => s.setClipDuration)

  const audioDuration = meta.duration || null
  const clipEnd = getClipEnd(config, audioDuration)
  const effective = getEffectiveClipSeconds(config, audioDuration)
  const hasAudio = audioDuration != null && audioDuration > 0

  return (
    <Panel
      title="Trecho do vídeo"
      hint={`Escolha o pedaço da faixa que vira vídeo (até ${MAX_CLIP_SECONDS}s).`}
    >
      <div className={styles.clipSummary}>
        <span className={styles.clipRange}>
          {formatTime(config.clipStart)} → {formatTime(clipEnd)}
        </span>
        <span className={`${styles.clipBadge} ${effective > MAX_CLIP_SECONDS - 0.01 ? styles.clipBadgeMax : ''}`}>
          {formatTimePrecise(effective)}
        </span>
      </div>

      <Slider
        label="Início"
        min={0}
        max={Math.max(0.5, hasAudio ? audioDuration : 60)}
        step={0.5}
        value={config.clipStart}
        format={clipSecondsLabel}
        onChange={(value) => setClipStart(value, audioDuration)}
      />
      <Slider
        label="Duração"
        min={MIN_CLIP_SECONDS}
        max={hasAudio ? Math.min(MAX_CLIP_SECONDS, Math.max(MIN_CLIP_SECONDS, audioDuration)) : MAX_CLIP_SECONDS}
        step={0.5}
        value={config.clipDuration}
        format={clipSecondsLabel}
        onChange={(value) => setClipDuration(value, audioDuration)}
      />

      {!hasAudio ? (
        <p className={styles.panelNote}>Carregue um áudio para posicionar o trecho com precisão.</p>
      ) : (
        <p className={styles.panelNote}>
          Faixa inteira: {formatTime(audioDuration)} · cada vídeo usa no máximo {MAX_CLIP_SECONDS}s.
        </p>
      )}
    </Panel>
  )
}

export { VISUAL_LIMITS }
