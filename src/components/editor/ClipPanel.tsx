import { useProjectStore } from '../../features/project/project.store'
import { useAudioEngineMeta } from '../../features/audio/useAudioEngine'
import { getClipEnd, getClipReadiness } from '../../features/project/project.types'
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, VISUAL_LIMITS } from '../../features/project/project.defaults'
import { getMaxClipSeconds } from '../../features/project/clip-limit'
import { formatTime, formatTimePrecise } from '../../lib/format-time'
import { Panel, Slider } from '../ui/ui'
import { WaveformTimeline } from './WaveformTimeline'
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
  const readiness = getClipReadiness(config, audioDuration, MIN_CLIP_SECONDS)
  const effective = readiness.effective
  const hasAudio = audioDuration != null && audioDuration > 0
  const isFull = config.productionMode === 'full'
  const limit = getMaxClipSeconds(config, audioDuration)
  const available = hasAudio
    ? Math.max(0.5, Math.min(limit, audioDuration - config.clipStart))
    : MAX_CLIP_SECONDS
  const sliderMin = hasAudio ? Math.min(MIN_CLIP_SECONDS, available) : MIN_CLIP_SECONDS
  const sliderMax = Math.max(sliderMin, available)

  return (
    <Panel
      title={isFull ? 'Trecho do music video' : 'Trecho do vídeo'}
      hint={isFull ? 'No modo completo a faixa inteira é permitida; você ainda pode começar em outro ponto.' : `Escolha o pedaço da faixa que vira vídeo (até ${MAX_CLIP_SECONDS}s).`}
    >
      <WaveformTimeline />
      <div className={styles.clipSummary}>
        <span className={styles.clipRange}>
          {formatTime(config.clipStart)} → {formatTime(clipEnd)}
        </span>
        <span className={`${styles.clipBadge} ${!isFull && effective > MAX_CLIP_SECONDS - 0.01 ? styles.clipBadgeMax : ''}`}>
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
        hint="Onde o trecho começa na faixa. O fim é limitado pela duração real do áudio."
        onChange={(value) => setClipStart(value, audioDuration)}
      />
      <Slider
        label="Duração"
        min={sliderMin}
        max={sliderMax}
        step={0.5}
        value={Math.min(Math.max(config.clipDuration, sliderMin), sliderMax)}
        format={clipSecondsLabel}
        hint={isFull ? 'No modo completo o máximo é a faixa inteira; não há teto de 45 s.' : 'Quanto tempo do trecho entra no vídeo; o máximo respeita o que resta da faixa.'}
        onChange={(value) => setClipDuration(value, audioDuration)}
      />

      {!hasAudio ? (
        <p className={styles.panelNote}>Carregue um áudio para posicionar o trecho com precisão.</p>
      ) : (
        <p className={styles.panelNote}>
          Faixa inteira: {formatTime(audioDuration)} · máximo disponível: {formatTimePrecise(available)}{isFull ? ' (sem teto social)' : ''}.
        </p>
      )}
      {!readiness.recordable ? <p className={styles.panelWarn}>{readiness.reason}</p> : null}
    </Panel>
  )
}

export { VISUAL_LIMITS }
