import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { getClipEnd } from '../../features/project/project.types'
import { getAudioEngine } from '../../features/audio/AudioEngine'
import { loadWaveformPeaks } from '../../features/audio/waveform'
import { formatTimePrecise } from '../../lib/format-time'
import { Button } from '../ui/ui'
import styles from './panels.module.css'

function fraction(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, value / total))
}

/** Waveform do áudio local; as bordas selecionam início/fim sem esconder os sliders precisos. */
export function WaveformTimeline(): JSX.Element {
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const config = useProjectStore((s) => s.config)
  const setClipRange = useProjectStore((s) => s.setClipRange)
  const [peaks, setPeaks] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<'start' | 'end' | null>(null)

  const duration = audioMeta?.duration ?? 0
  const clipEnd = getClipEnd(config, duration || null)

  useEffect(() => {
    const url = audioMeta?.objectUrl
    if (!url || !duration) {
      setPeaks([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    loadWaveformPeaks(url)
      .then((next) => {
        if (!cancelled) setPeaks(next)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível desenhar a waveform; use os sliders precisos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [audioMeta?.objectUrl, duration])

  if (!audioMeta || duration <= 0) {
    return <p className={styles.waveformEmpty}>Carregue um áudio para ver a waveform e arrastar o trecho.</p>
  }

  const startPct = fraction(config.clipStart, duration) * 100
  const endPct = fraction(clipEnd, duration) * 100

  const timeAt = (clientX: number): number => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))) * duration
  }

  const moveBoundary = (kind: 'start' | 'end', clientX: number): void => {
    const time = timeAt(clientX)
    const min = 0.5
    if (kind === 'start') {
      setClipRange(Math.min(time, clipEnd - min), clipEnd, duration)
    } else {
      setClipRange(config.clipStart, Math.max(time, config.clipStart + min), duration)
    }
  }

  const beginDrag = (kind: 'start' | 'end') => (event: React.PointerEvent<HTMLButtonElement>): void => {
    dragRef.current = kind
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const nudge = (kind: 'start' | 'end', delta: number): void => {
    if (kind === 'start') setClipRange(Math.max(0, config.clipStart + delta), clipEnd, duration)
    else setClipRange(config.clipStart, Math.max(config.clipStart + 0.5, clipEnd + delta), duration)
  }

  const preview = (): void => {
    getAudioEngine().playClip(config.clipStart, clipEnd)
  }

  return (
    <div className={styles.waveform}>
      <div className={styles.waveformHead}>
        <span>Waveform · arraste as bordas</span>
        <span className={styles.waveformTime}>{formatTimePrecise(config.clipDuration)}</span>
      </div>
      <div
        className={styles.waveformTrack}
        ref={trackRef}
        onPointerMove={(event) => {
          if (dragRef.current) moveBoundary(dragRef.current, event.clientX)
        }}
        onPointerUp={() => {
          dragRef.current = null
        }}
        onPointerCancel={() => {
          dragRef.current = null
        }}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) return
          getAudioEngine().seek(timeAt(event.clientX))
        }}
        role="presentation"
      >
        <div className={styles.waveformBars} aria-hidden="true">
          {(peaks.length ? peaks : new Array(80).fill(0.2)).map((peak, index) => (
            <span
              key={index}
              className={index >= Math.floor((startPct / 100) * peaks.length) && index < Math.ceil((endPct / 100) * peaks.length) ? styles.waveformBarActive : styles.waveformBar}
              style={{ height: `${Math.max(8, peak * 100)}%` }}
            />
          ))}
        </div>
        <div className={styles.waveformSelection} style={{ left: `${startPct}%`, width: `${Math.max(0.6, endPct - startPct)}%` }} />
        <button
          type="button"
          className={styles.waveformHandle}
          style={{ left: `${startPct}%` }}
          aria-label="Ajustar início do trecho"
          onPointerDown={beginDrag('start')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') nudge('start', -0.5)
            if (event.key === 'ArrowRight') nudge('start', 0.5)
          }}
        />
        <button
          type="button"
          className={styles.waveformHandle}
          style={{ left: `${endPct}%` }}
          aria-label="Ajustar fim do trecho"
          onPointerDown={beginDrag('end')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') nudge('end', -0.5)
            if (event.key === 'ArrowRight') nudge('end', 0.5)
          }}
        />
      </div>
      <div className={styles.waveformActions}>
        <Button onClick={preview}>Ouvir trecho</Button>
        <span className={styles.waveformTime}>
          {formatTimePrecise(config.clipStart)} → {formatTimePrecise(clipEnd)}
        </span>
        {loading ? <span className={styles.waveformTime}>Lendo…</span> : null}
      </div>
      {error ? <p className={styles.panelWarn}>{error}</p> : null}
    </div>
  )
}
