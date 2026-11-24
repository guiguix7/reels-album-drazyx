import { useProjectStore } from '../../features/project/project.store'
import { getOutputDimensions } from '../../features/project/project.types'
import type { AspectRatioId, OutputQuality, PlatformId } from '../../features/project/project.types'
import { PLATFORM_OPTIONS, PLATFORM_PROFILES } from '../../features/platform/platform.profiles'
import { Panel, Segmented, Select } from '../ui/ui'
import styles from './panels.module.css'

const ASPECTS: Array<{ value: AspectRatioId; label: string }> = [
  { value: '9:16', label: '9:16 Reels' },
  { value: '1:1', label: '1:1 Feed' },
  { value: '16:9', label: '16:9 Wide' },
]

const QUALITIES: Array<{ value: OutputQuality; label: string }> = [
  { value: 'full', label: 'Full 1080' },
  { value: 'light', label: 'Leve 720' },
]

const FPS_OPTIONS: Array<{ value: 30 | 60; label: string }> = [
  { value: 30, label: '30 fps' },
  { value: 60, label: '60 fps' },
]

export function FormatPanel(): JSX.Element {
  const config = useProjectStore((s) => s.config)
  const setAspect = useProjectStore((s) => s.setAspect)
  const setQuality = useProjectStore((s) => s.setQuality)
  const setFps = useProjectStore((s) => s.setFps)
  const setPlatform = useProjectStore((s) => s.setPlatform)

  const dims = getOutputDimensions(config.aspectRatio, config.quality)
  const platform = config.platform === 'custom' ? null : PLATFORM_PROFILES[config.platform]

  return (
    <Panel title="Formato" hint={`Saída atual: ${dims.width}×${dims.height} px`}>
      <Select
        label="Plataforma"
        value={config.platform}
        options={PLATFORM_OPTIONS}
        onChange={(id) => setPlatform(id as PlatformId)}
      />
      {platform ? <p className={styles.panelNote}>{platform.note}</p> : null}
      <div className={styles.inlineField}>
        <span className={styles.rowLabel}>Proporção</span>
        <Segmented options={ASPECTS} value={config.aspectRatio} onChange={(v) => setAspect(v)} />
      </div>
      <div className={styles.inlineField}>
        <span className={styles.rowLabel}>Resolução</span>
        <Segmented options={QUALITIES} value={config.quality} onChange={(v) => setQuality(v)} />
      </div>
      <div className={styles.inlineField}>
        <span className={styles.rowLabel}>Taxa</span>
        <Segmented options={FPS_OPTIONS} value={config.fps} onChange={(v) => setFps(v)} />
      </div>
    </Panel>
  )
}
