import { useRef } from 'react'
import { Stage } from '../features/visualizer/Stage'
import { useRecordingFlow } from '../features/recording/useRecordingFlow'
import { useBatchExport } from '../features/batch/useBatchExport'
import { useProjectStore } from '../features/project/project.store'
import { APP_NAME } from '../features/project/project.defaults'
import { SourcePanel } from '../components/editor/SourcePanel'
import { TemplateGallery } from '../components/editor/TemplateGallery'
import { CompositionPanel } from '../components/editor/CompositionPanel'
import { StoryboardPanel } from '../components/editor/StoryboardPanel'
import { ClipPanel } from '../components/editor/ClipPanel'
import { PalettePanel, VisualPanel, TextPanel } from '../components/editor/VisualPanel'
import { FormatPanel } from '../components/editor/FormatPanel'
import { ProjectPanel } from '../components/editor/ProjectPanel'
import { RetentionLabPanel } from '../components/editor/RetentionLabPanel'
import { Transport } from '../components/editor/Transport'
import { RecordPanel } from '../components/editor/RecordPanel'
import { RecipePanel } from '../components/editor/RecipePanel'
import { BatchPanel } from '../components/editor/BatchPanel'
import { RecordAction } from '../components/editor/RecordAction'
import { HistoryControls } from '../components/editor/HistoryControls'
import { Onboarding } from '../components/editor/Onboarding'
import styles from './app.module.css'

export function EditorLayout(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { startRecording, cancelRecording, recording } = useRecordingFlow(canvasRef)
  const { startBatch, cancelBatch } = useBatchExport(canvasRef)
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const audioLoading = useProjectStore((s) => s.audioStatus === 'loading')

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>DRAZYX</span>
          <span className={styles.brandRest}>VISUALIZER STUDIO</span>
        </div>
        <HistoryControls />
        <p className={styles.topbarNote}>{APP_NAME} — local-first · nada sai do seu navegador</p>
        <RecordAction onStart={startRecording} onCancel={cancelRecording} />
      </header>

      <main className={styles.grid}>
        <section className={styles.stageCol}>
          <div className={styles.stageHolder}>
            <Stage canvasRef={canvasRef} />
          </div>
          {!audioMeta && !audioLoading ? (
            <div className={styles.emptyHint} role="status">
              <strong>Sem áudio carregado.</strong> A arte padrão está no Stage; carregue o áudio no
              painel Fonte para liberar o trecho e a gravação.
            </div>
          ) : null}
          <Transport />
        </section>

        <aside className={styles.panelCol} aria-label="Painéis do editor">
          <Onboarding />
          <fieldset className={styles.panelFieldset} disabled={recording}>
            <SourcePanel />
            <RecipePanel />
            <TemplateGallery />
            <CompositionPanel />
            <StoryboardPanel />
            <PalettePanel />
            <ClipPanel />
            <VisualPanel />
            <TextPanel />
            <FormatPanel />
            <ProjectPanel />
            <RetentionLabPanel />
          </fieldset>
          <RecordPanel onStart={startRecording} onCancel={cancelRecording} />
          <BatchPanel onStart={startBatch} onCancel={cancelBatch} />
        </aside>
      </main>
    </div>
  )
}
