import { useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { useRecorderStore } from '../../features/recording/recording.store'
import styles from '../../app/app.module.css'

const STORAGE_KEY = 'drazyx-onboarding-dismissed'

const STEPS = [
  { label: 'Música e capa', detail: 'Carregue os dois arquivos no painel Fonte.' },
  { label: 'Trecho', detail: 'Escolha o início e a duração do clipe.' },
  { label: 'Composição', detail: 'Selecione um dos oito layouts ou um estilo.' },
  { label: 'Aparência', detail: 'Ajuste paleta, visual e tipografia.' },
  { label: 'Preview e export', detail: 'Reproduza e grave o Stage com áudio.' },
]

function initiallyHidden(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Guia curto e dispensável; não bloqueia usuários experientes. */
export function Onboarding(): JSX.Element | null {
  const [hidden, setHidden] = useState(initiallyHidden)
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const coverMeta = useProjectStore((s) => s.coverMeta)
  const clipDuration = useProjectStore((s) => s.config.clipDuration)
  const preview = useRecorderStore((s) => s.preview)
  const [expanded, setExpanded] = useState(true)

  if (hidden) return null

  const done = [
    Boolean(audioMeta && coverMeta),
    Boolean(audioMeta && clipDuration > 0),
    Boolean(useProjectStore.getState().config.templateId),
    Boolean(audioMeta),
    Boolean(preview),
  ]
  const firstPending = done.findIndex((value) => !value)
  const current = firstPending === -1 ? done.length - 1 : firstPending

  const dismiss = (): void => {
    setHidden(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* armazenamento indisponível: esconde só nesta sessão */
    }
  }

  return (
    <section className={styles.onboarding} aria-label="Guia rápido de produção">
      <div className={styles.onboardingHead}>
        <strong>Guia rápido</strong>
        <span>{current + 1} de 5</span>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Recolher' : 'Abrir'}
        </button>
        <button type="button" onClick={dismiss} aria-label="Dispensar guia rápido">
          ×
        </button>
      </div>
      {expanded ? (
        <ol className={styles.onboardingSteps}>
          {STEPS.map((step, index) => (
            <li key={step.label} className={index === current ? styles.onboardingCurrent : undefined}>
              <span className={styles.onboardingNumber} aria-hidden="true">
                {done[index] ? '✓' : index + 1}
              </span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
