import { TEMPLATE_LIST } from '../../features/visualizer/templates/registry'
import { useProjectStore } from '../../features/project/project.store'
import type { TemplateId } from '../../features/project/project.types'
import { Panel } from '../ui/ui'
import styles from './panels.module.css'

export function TemplateGallery(): JSX.Element {
  const templateId = useProjectStore((s) => s.config.templateId)
  const setTemplate = useProjectStore((s) => s.setTemplate)

  return (
    <Panel title="Template" hint="Troque a qualquer momento — a cena se recompõe no Stage.">
      <div className={styles.gallery} role="listbox" aria-label="Escolher template">
        {TEMPLATE_LIST.map((template, index) => (
          <button
            key={template.id}
            type="button"
            role="option"
            aria-selected={templateId === template.id}
            className={`${styles.templateCard} ${templateId === template.id ? styles.templateActive : ''}`}
            onClick={() => setTemplate(template.id as TemplateId)}
          >
            <span className={styles.templateIndex}>{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.templateName}>{template.name}</span>
            <span className={styles.templateDesc}>{template.description}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}
