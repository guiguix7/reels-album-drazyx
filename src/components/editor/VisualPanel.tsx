import { useProjectStore } from '../../features/project/project.store'
import { VISUAL_LIMITS } from '../../features/project/project.defaults'
import { Button, Panel, Segmented, Slider, TextInput, Toggle } from '../ui/ui'
import type { GlitchLevel } from '../../features/project/project.types'
import styles from './panels.module.css'

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

const GLITCH_OPTIONS: Array<{ value: GlitchLevel; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'low', label: 'Sutil' },
  { value: 'medium', label: 'Forte' },
]

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
