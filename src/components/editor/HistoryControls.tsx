import { useEditHistory } from '../../features/history/useEditHistory'
import styles from '../../app/app.module.css'

/** Desfazer/refazer com snapshots da configuração; atalho Ctrl/Cmd+Z e Shift. */
export function HistoryControls(): JSX.Element {
  const { undo, redo, canUndo, canRedo } = useEditHistory()
  return (
    <div className={styles.historyControls} role="group" aria-label="Histórico de edição">
      <button
        type="button"
        className={styles.historyButton}
        onClick={undo}
        disabled={!canUndo}
        title="Desfazer (Ctrl+Z)"
        aria-label="Desfazer"
      >
        ↶
      </button>
      <button
        type="button"
        className={styles.historyButton}
        onClick={redo}
        disabled={!canRedo}
        title="Refazer (Ctrl+Shift+Z)"
        aria-label="Refazer"
      >
        ↷
      </button>
    </div>
  )
}
