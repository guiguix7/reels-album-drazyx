import { useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { VISUAL_LIMITS } from '../../features/project/project.defaults'
import { extractPaletteFromUrl } from '../../features/palette/palette'
import { Button, ColorField, Notice, Panel, Segmented, Select, Slider, TextInput, Toggle } from '../ui/ui'
import { MOTION_PROFILES, MOTION_PROFILE_OPTIONS } from '../../features/visualizer/motion/motion.profiles'
import type { GlitchLevel, PaletteMode } from '../../features/project/project.types'
import styles from './panels.module.css'

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

const GLITCH_OPTIONS: Array<{ value: GlitchLevel; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'low', label: 'Sutil' },
  { value: 'medium', label: 'Forte' },
]

const PALETTE_MODES: Array<{ value: PaletteMode; label: string }> = [
  { value: 'auto', label: 'Da capa' },
  { value: 'manual', label: 'Manual' },
]

/** Paleta do vídeo: extraída da capa ou definida à mão. */
export function PalettePanel(): JSX.Element {
  const palette = useProjectStore((s) => s.config.palette)
  const coverMeta = useProjectStore((s) => s.coverMeta)
  const coverPalette = useProjectStore((s) => s.coverPalette)
  const setPalette = useProjectStore((s) => s.setPalette)
  const setPaletteMode = useProjectStore((s) => s.setPaletteMode)
  const setCoverPalette = useProjectStore((s) => s.setCoverPalette)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractFromCover = async (): Promise<void> => {
    if (!coverMeta) return
    setExtracting(true)
    setError(null)
    try {
      const extracted = await extractPaletteFromUrl(coverMeta.objectUrl)
      setCoverPalette(extracted)
    } catch {
      setError('Não foi possível ler as cores desta capa.')
    } finally {
      setExtracting(false)
    }
  }

  const swatches: Array<{ label: string; color: string }> = [
    { label: 'Acento', color: palette.accent },
    { label: 'Secundária', color: palette.secondary },
    { label: 'Brilho', color: palette.glow },
  ]

  return (
    <Panel
      title="Paleta"
      hint="Cores do vídeo a partir da capa ou escolhidas à mão."
      actions={
        <Button onClick={() => void extractFromCover()} disabled={!coverMeta || extracting}>
          {extracting ? 'Lendo...' : 'Extrair'}
        </Button>
      }
    >
      <div className={styles.inlineField}>
        <span className={styles.rowLabel}>Modo</span>
        <Segmented options={PALETTE_MODES} value={palette.mode} onChange={(mode) => setPaletteMode(mode)} />
      </div>

      <div className={styles.paletteSwatches}>
        {swatches.map((swatch) => (
          <div key={swatch.label} className={styles.swatch}>
            <span className={styles.swatchChip} style={{ background: swatch.color }} />
            <span className={styles.swatchLabel}>{swatch.label}</span>
            <span className={styles.swatchValue}>{swatch.color.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {palette.mode === 'manual' ? (
        <>
          <ColorField label="Acento" value={palette.accent} onChange={(accent) => setPalette({ accent })} />
          <ColorField label="Secundária" value={palette.secondary} onChange={(secondary) => setPalette({ secondary })} />
          <ColorField label="Brilho" value={palette.glow} onChange={(glow) => setPalette({ glow })} />
        </>
      ) : (
        <p className={styles.panelNote}>
          {coverMeta
            ? coverPalette
              ? 'Cores extraídas da capa. Toque em Extrair para recalcular.'
              : 'Ainda sem cores da capa — usando a paleta padrão.'
            : 'Sem capa: paleta Drazyx padrão.'}
        </p>
      )}

      {error ? <Notice tone="error">{error}</Notice> : null}
    </Panel>
  )
}

export function VisualPanel(): JSX.Element {
  const visual = useProjectStore((s) => s.config.visual)
  const setVisual = useProjectStore((s) => s.setVisual)
  const setGlitch = useProjectStore((s) => s.setGlitch)
  const resetVisual = useProjectStore((s) => s.resetVisualToTemplateDefault)

  return (
    <Panel
      title="Visual"
      hint="Ajustes finos da cena ativa. Cada template tem seus padrões."
      actions={
        <Button onClick={() => resetVisual()} variant="ghost">
          Redefinir
        </Button>
      }
    >
      <Slider label="Intensidade" min={VISUAL_LIMITS.intensity.min} max={VISUAL_LIMITS.intensity.max} step={VISUAL_LIMITS.intensity.step} value={visual.intensity} onChange={(v) => setVisual({ intensity: v })} format={percent} />
      <Slider label="Partículas" min={VISUAL_LIMITS.particleCount.min} max={VISUAL_LIMITS.particleCount.max} step={VISUAL_LIMITS.particleCount.step} value={visual.particleCount} onChange={(v) => setVisual({ particleCount: v })} format={percent} />
      <Slider label="Força do grave" min={VISUAL_LIMITS.bassForce.min} max={VISUAL_LIMITS.bassForce.max} step={VISUAL_LIMITS.bassForce.step} value={visual.bassForce} onChange={(v) => setVisual({ bassForce: v })} format={percent} />
      <Slider label="Brilho" min={VISUAL_LIMITS.glow.min} max={VISUAL_LIMITS.glow.max} step={VISUAL_LIMITS.glow.step} value={visual.glow} onChange={(v) => setVisual({ glow: v })} format={percent} />
      <Slider label="Grão" min={VISUAL_LIMITS.grain.min} max={VISUAL_LIMITS.grain.max} step={VISUAL_LIMITS.grain.step} value={visual.grain} onChange={(v) => setVisual({ grain: v })} format={percent} />
      <Slider label="Câmera" min={VISUAL_LIMITS.cameraSpeed.min} max={VISUAL_LIMITS.cameraSpeed.max} step={VISUAL_LIMITS.cameraSpeed.step} value={visual.cameraSpeed} onChange={(v) => setVisual({ cameraSpeed: v })} format={percent} />
      <div className={styles.inlineField}>
        <span className={styles.rowLabel}>Glitch</span>
        <Segmented options={GLITCH_OPTIONS} value={visual.glitch} onChange={(v) => setGlitch(v)} />
      </div>
      <Select
        label="Movimento"
        value={visual.motionProfile}
        options={MOTION_PROFILE_OPTIONS}
        onChange={(motionProfile) => setVisual({ motionProfile })}
      />
      <p className={styles.panelNote}>{MOTION_PROFILES[visual.motionProfile].description}</p>
      <Toggle
        label="Loop visual (fecha no início do trecho)"
        checked={visual.loopVisual}
        onChange={(loopVisual) => setVisual({ loopVisual })}
      />
    </Panel>
  )
}

export function TextPanel(): JSX.Element {
  const type = useProjectStore((s) => s.config.type)
  const setType = useProjectStore((s) => s.setType)

  return (
    <Panel title="Tipografia do vídeo" hint="Renderizado dentro do Stage — faz parte do arquivo final.">
      <TextInput label="Artista" value={type.artistName} onChange={(v) => setType({ artistName: v })} maxLength={40} />
      <TextInput label="Faixa" value={type.trackTitle} onChange={(v) => setType({ trackTitle: v })} maxLength={60} />
      <TextInput label="Álbum" value={type.albumTitle} onChange={(v) => setType({ albumTitle: v })} maxLength={60} />
      <TextInput label="CTA" value={type.ctaText} onChange={(v) => setType({ ctaText: v })} maxLength={48} />
      <TextInput label="Tagline" value={type.tagline} onChange={(v) => setType({ tagline: v })} maxLength={60} />
      <div className={styles.toggleGrid}>
        <Toggle label="Artista" checked={type.showArtist} onChange={(v) => setType({ showArtist: v })} />
        <Toggle label="Faixa" checked={type.showTrack} onChange={(v) => setType({ showTrack: v })} />
        <Toggle label="Álbum" checked={type.showAlbum} onChange={(v) => setType({ showAlbum: v })} />
        <Toggle label="CTA" checked={type.showCta} onChange={(v) => setType({ showCta: v })} />
        <Toggle label="Tagline" checked={type.showTagline} onChange={(v) => setType({ showTagline: v })} />
      </div>
      <Slider label="Escala" min={VISUAL_LIMITS.typeScale.min} max={VISUAL_LIMITS.typeScale.max} step={VISUAL_LIMITS.typeScale.step} value={type.scale} onChange={(v) => setType({ scale: v })} format={percent} />
      <Slider label="Tracking" min={VISUAL_LIMITS.tracking.min} max={VISUAL_LIMITS.tracking.max} step={VISUAL_LIMITS.tracking.step} value={type.tracking} onChange={(v) => setType({ tracking: v })} />
    </Panel>
  )
}
