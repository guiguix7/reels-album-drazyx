import { useEffect, useRef } from 'react'
import { VisualEngine } from './VisualEngine'
import { setVisualEngine } from './engine-registry'
import { useProjectStore } from '../project/project.store'
import { getClipEnd } from '../project/project.types'
import { getOutputDimensions } from '../project/project.types'
import { getAudioEngine } from '../audio/AudioEngine'
import styles from './stage.module.css'

/**
 * Stage — canvas WebGL independente da UI. Toda a composição do vídeo final
 * vive aqui dentro (incluindo tipografia via CanvasTexture).
 */
export function Stage({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }): JSX.Element {
  const engineRef = useRef<VisualEngine | null>(null)

  const templateId = useProjectStore((s) => s.config.templateId)
  const aspect = useProjectStore((s) => s.config.aspectRatio)
  const quality = useProjectStore((s) => s.config.quality)
  const clipStart = useProjectStore((s) => s.config.clipStart)
  const clipDuration = useProjectStore((s) => s.config.clipDuration)
  const visual = useProjectStore((s) => s.config.visual)
  const type = useProjectStore((s) => s.config.type)
  const palette = useProjectStore((s) => s.config.palette)
  const storyboard = useProjectStore((s) => s.config.storyboard)
  const coverUrl = useProjectStore((s) => s.coverMeta?.objectUrl ?? null)

  // Criação única do engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const store = useProjectStore.getState()
    const engine = new VisualEngine(canvas, store.config.visual, store.config.type)
    engineRef.current = engine
    setVisualEngine(engine)
    engine.setPalette(store.config.palette)
    engine.setStoryboard(store.config.storyboard, store.config.templateId)
    engine.start()
    if (import.meta.env.DEV) {
      // Apenas em desenvolvimento: permite inspecionar/auditar os layouts no navegador.
      ;(window as unknown as Record<string, unknown>).__drazyxEngine = engine
      ;(window as unknown as Record<string, unknown>).__drazyxStore = useProjectStore
    }

    const onVisibility = (): void => engine.handleVisibility(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      engine.dispose()
      setVisualEngine(null)
      engineRef.current = null
    }
    // canvasRef é estável durante a vida do componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Troca de template (ignorada enquanto o storyboard controla as cenas)
  useEffect(() => {
    if (!useProjectStore.getState().config.storyboard.enabled) {
      engineRef.current?.setTemplate(templateId)
    }
  }, [templateId])

  // Storyboard: sequência de cenas + template de fallback
  useEffect(() => {
    engineRef.current?.setStoryboard(storyboard, templateId)
  }, [storyboard, templateId])

  // Resolução / proporção
  useEffect(() => {
    const dims = getOutputDimensions(aspect, quality)
    engineRef.current?.setResolution(dims.width, dims.height)
  }, [aspect, quality])

  // Trecho selecionado (fonte de verdade para o storyboard)
  useEffect(() => {
    const duration = getAudioEngine().getMeta().duration
    const end = getClipEnd({ clipStart, clipDuration }, duration || null)
    engineRef.current?.setClip(clipStart, end)
  }, [clipStart, clipDuration])

  // Config visual/tipográfica
  useEffect(() => {
    engineRef.current?.setConfig(visual, type)
  }, [visual, type])

  // Paleta automática da capa / manual do usuário
  useEffect(() => {
    engineRef.current?.setPalette(palette)
  }, [palette])

  // Capa
  useEffect(() => {
    engineRef.current?.setCoverUrl(coverUrl)
  }, [coverUrl])

  const dims = getOutputDimensions(aspect, quality)

  return (
    <div className={styles.stageFrame}>
      <div className={styles.stageInner} style={{ aspectRatio: `${dims.width} / ${dims.height}` }}>
        <canvas ref={canvasRef as React.Ref<HTMLCanvasElement>} width={dims.width} height={dims.height} className={styles.canvas} />
      </div>
    </div>
  )
}
