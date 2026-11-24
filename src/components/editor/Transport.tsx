import { useEffect, useRef, useState } from 'react'
import { useAudioEngineMeta } from '../../features/audio/useAudioEngine'
import { useProjectStore } from '../../features/project/project.store'
import { formatTime } from '../../lib/format-time'
import styles from './panels.module.css'

export function Transport(): JSX.Element {
  const { engine, meta } = useAudioEngineMeta()
  const [displayTime, setDisplayTime] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const scrubRef = useRef(0)
  const config = useProjectStore((s) => s.config)
  const audioStatus = useProjectStore((s) => s.audioStatus)

  useEffect(() => {
    // Relógio da UI lido do elemento de áudio: continua correto mesmo em aba oculta,
    // onde requestAnimationFrame (que alimenta frame.time) fica pausado.
    const id = window.setInterval(() => {
      if (!scrubbing) setDisplayTime(engine.getCurrentTime())
    }, 150)
    return () => window.clearInterval(id)
  }, [engine, scrubbing])

  const playing = meta.status === 'playing'
  const canPlay = meta.duration > 0
  const shownTime = scrubbing ? scrubRef.current : displayTime

  const toggle = async (): Promise<void> => {
    if (playing) {
      engine.pause()
      return
    }
    if (!canPlay) return
    // Se o playhead passou do fim do trecho selecionado, volta ao início do trecho.
    const clipEnd = config.clipStart + config.clipDuration
    if (displayTime > clipEnd - 0.05 || displayTime < config.clipStart - 0.05) {
      engine.seek(config.clipStart)
    }
    await engine.play()
  }

  const onScrubStart = (value: number): void => {
    scrubRef.current = value
    setScrubbing(true)
  }
  const onScrubChange = (value: number): void => {
    scrubRef.current = value
  }
  const onScrubEnd = (): void => {
    engine.seek(scrubRef.current)
    setScrubbing(false)
  }

  const maxTime = meta.duration || 1

  return (
    <div className={styles.transport}>
      <button
        type="button"
        className={`${styles.playButton} ${playing ? styles.playing : ''}`}
        onClick={() => void toggle()}
        disabled={!canPlay}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing ? (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M4 2h3v12H4zM9 2h3v12H9z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M4 2l10 6-10 6z" fill="currentColor" />
          </svg>
        )}
      </button>

      <input
        type="range"
        className={styles.scrubber}
        min={0}
        max={maxTime}
        step={0.1}
        value={Math.min(shownTime, maxTime)}
        onMouseDown={(e) => onScrubStart(Number(e.currentTarget.value))}
        onTouchStart={(e) => onScrubStart(Number(e.currentTarget.value))}
        onChange={(e) => onScrubChange(Number(e.target.value))}
        onMouseUp={onScrubEnd}
        onTouchEnd={onScrubEnd}
        disabled={!canPlay}
        aria-label="Posição da faixa"
      />

      <span className={styles.timeLabel}>
        {formatTime(shownTime)} / {formatTime(meta.duration)}
      </span>

      <span className={`${styles.statusDot} ${audioStatus === 'error' ? styles.statusError : playing ? styles.statusPlaying : ''}`} />
    </div>
  )
}
