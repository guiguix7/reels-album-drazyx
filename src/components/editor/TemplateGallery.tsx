import { LAYOUT_LIST, STYLE_LIST } from '../../features/visualizer/templates/registry'
import type { TemplateEntry } from '../../features/visualizer/templates/registry'
import { useProjectStore } from '../../features/project/project.store'
import type { TemplateId } from '../../features/project/project.types'
import { Panel } from '../ui/ui'
import styles from './panels.module.css'

function GalleryCard({ entry, selected, index }: { entry: TemplateEntry; selected: boolean; index: number }): JSX.Element {
  const setTemplate = useProjectStore((s) => s.setTemplate)
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`${styles.templateCard} ${selected ? styles.templateActive : ''}`}
      onClick={() => setTemplate(entry.id as TemplateId)}
    >
      <span className={styles.thumb} data-kind={entry.id} aria-hidden="true">
        <span className={styles.thumbA} />
        <span className={styles.thumbB} />
      </span>
      <span className={styles.templateIndex}>{String(index + 1).padStart(2, '0')}</span>
      <span className={styles.templateName}>{entry.name}</span>
      <span className={styles.templateDesc}>{entry.description}</span>
    </button>
  )
}

export function TemplateGallery(): JSX.Element {
  const templateId = useProjectStore((s) => s.config.templateId)

  return (
    <Panel title="Composição" hint="Oito layouts distintos; os presets originais continuam disponíveis como estilo.">
      <p className={styles.galleryLabel}>Layouts</p>
      <div className={styles.gallery} role="listbox" aria-label="Escolher layout">
        {LAYOUT_LIST.map((entry, index) => (
          <GalleryCard key={entry.id} entry={entry} index={index} selected={templateId === entry.id} />
        ))}
      </div>

      <p className={styles.galleryLabel}>Estilos</p>
      <div className={styles.gallery} role="listbox" aria-label="Escolher estilo visual">
        {STYLE_LIST.map((entry, index) => (
          <GalleryCard key={entry.id} entry={entry} index={index} selected={templateId === entry.id} />
        ))}
      </div>
    </Panel>
  )
}
