import { useRef } from 'react'
import { Stage } from '../features/visualizer/Stage'
import { useRecordingFlow } from '../features/recording/useRecordingFlow'
import { useProjectStore } from '../features/project/project.store'
import { APP_NAME } from '../features/project/project.defaults'
import { SourcePanel } from '../components/editor/SourcePanel'
import { TemplateGallery } from '../components/editor/TemplateGallery'
import { ClipPanel } from '../components/editor/ClipPanel'
import { VisualPanel, TextPanel } from '../components/editor/VisualPanel'
import { FormatPanel } from '../components/editor/FormatPanel'
import { Transport } from '../components/editor/Transport'
import { RecordPanel } from '../components/editor/RecordPanel'
import styles from './app.module.css'

export function EditorLayout(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { startRecording, cancelRecording } = useRecordingFlow(canvasRef)
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const audioLoading = useProjectStore((s) => s.audioStatus === 'loading')

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>DRAZYX</span>
          <span className={styles.brandRest}>VISUALIZER STUDIO</span>
        </div>
        <p className={styles.topbarNote}>{APP_NAME} — local-first · nada sai do seu navegador</p>
      </header>

      <main className={styles.grid}>
        <section className={styles.stageCol}>
          <div className={styles.stageHolder}>
            <Stage canvasRef={canvasRef} />
            {!audioMeta && !audioLoading ? (
              <div className={styles.stageOverlay}>
                <div className={styles.overlayCard}>
                  <p className={styles.overlayTitle}>Sem áudio carregado</p>
                  <p className={styles.overlayText}>
                    A cena está rodando com a arte padrão. Carregue um arquivo de áudio no painel
                    <strong> Fonte</strong> para montar o visualizer real.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <Transport />
        </section>

        <aside className={styles.panelCol} aria-label="Painéis do editor">
          <SourcePanel />
          <TemplateGallery />
          <ClipPanel />
          <VisualPanel />
          <TextPanel />
          <FormatPanel />
          <RecordPanel onStart={startRecording} onCancel={cancelRecording} />
        </aside>
      </main>
    </div>
  )
}
