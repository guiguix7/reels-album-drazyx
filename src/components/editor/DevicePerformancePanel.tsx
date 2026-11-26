import { useCallback } from 'react'
import type { RenderProfileId } from '../../features/visualizer/render-profile'
import type { DevicePerformanceManager, ProfileOption } from '../../features/visualizer/device-performance'
import styles from './device-performance-panel.module.css'

interface Props {
  manager: DevicePerformanceManager
  selectedProfile?: (profileId: RenderProfileId) => void
  className?: string
}

/**
 * Painel de perfil de desempenho.
 *
 * Mostra um resumo legível dos perfis (AUTO, PERFORMANCE, BALANCED, QUALITY,
 * EXPORT) com label, descrição curta e o que cada um altera. O usuário
 * seleciona um perfil e o manager recebe a escolha. O componente não emite
 * decisões de desempenho por si só; apenas renderiza a UI do gerenciador.
 */
export function DevicePerformancePanel({ manager, selectedProfile, className }: Props): JSX.Element {
  const choose = useCallback(
    (profileId: RenderProfileId): void => {
      if (selectedProfile) selectedProfile(profileId)
    },
    [selectedProfile],
  )

  return (
    <div className={`${styles.devicePerformancePanel} ${className ?? ''}`}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Desempenho e qualidade</h2>
        <span className={styles.subtitle}>
          Presença: {manager.effectiveProfileId === 'auto' ? 'Automático' : manager.effectiveProfileId}
        </span>
      </div>
      <p className={styles.paragraph}>
        {manager.capabilities
          ? `Detecção do dispositivo: ${manager.capabilities.deviceMemory > 0 ? `${manager.capabilities.deviceMemory} GB` : 'indeterminado'} de memória, ${manager.capabilities.hardwareConcurrency} núcleos indicados.`
          : 'Detecção do dispositivo indisponível. Use os perfis abaixo para ajustar.'}
      </p>
      <ul className={styles.list}>
        {PROFILE_OPTIONS.map((option) => {
          const effective =
            manager.requestedProfile === 'auto'
              ? manager.computedProfileId
              : manager.requestedProfile
          const isSelected = effective === option.id
          return (
            <li
              key={option.id}
              className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
              onClick={() => choose(option.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <span className={styles.optionHead}>
                <span className={styles.optionId}>{option.id}</span>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionPressure}>{option.pressure}</span>
              </span>
              <span className={styles.optionDescription}>{option.description}</span>
              {option.id === 'auto' && (
                <span className={styles.optionHint}>
                  → {manager.computedProfileId}
                  {manager.computedProfileId === 'performance' ? ' (dispositivo limitado)' : ''}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className={styles.footnote}>
        {manager.degraded
          ? 'A qualidade foi ajustada automaticamente para a lentidão do dispositivo. Escolha um perfil acima para retomar o controle.'
          : 'Se o dispositivo ficar lento, escolha Desempenho. A gravação sempre mantém a resolução exata do formato.'}
      </p>
    </div>
  )
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    id: 'auto',
    label: 'Automático',
    description: 'Escolhe configurações baseado no dispositivo detectado.',
    pressure: 'medium',
  },
  {
    id: 'performance',
    label: 'Desempenho',
    description: 'Prioriza fluidez: preview menor, menos amostragem e efeitos opcionais.',
    pressure: 'low',
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Boa qualidade no preview com pressão moderada na GPU.',
    pressure: 'medium',
  },
  {
    id: 'quality',
    label: 'Qualidade',
    description: 'Mais detalhe e efeitos em dispositivos capazes.',
    pressure: 'high',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Resolução e qualidade cheias durante a gravação.',
    pressure: 'high',
  },
]
