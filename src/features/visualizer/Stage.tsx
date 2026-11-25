import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { VisualEngine } from './VisualEngine'
import { setVisualEngine } from './engine-registry'
import { useProjectStore } from '../project/project.store'
import { useRecorderStore } from '../recording/recording.store'
import { getClipEnd } from '../project/project.types'
import { getOutputDimensions } from '../project/project.types'
import { getAudioEngine } from '../audio/AudioEngine'
import { fitStageSize } from './stage-size'
import { CompositionOverlay } from './CompositionOverlay'
import styles from './stage.module.css'

/**
 * Stage — canvas WebGL independente da UI. Toda a composição do vídeo final
 * vive aqui dentro (incluindo tipografia via CanvasTexture).
 */
export function Stage({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }): JSX.Element {
  const engineRef = useRef<VisualEngine | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [available, setAvailable] = useState({ width: 0, height: 0 })

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
  const elements = useProjectStore((s) => s.config.elements)
  const cameraPreset = useProjectStore((s) => s.config.cameraPreset ?? 'auto')
  const cameraIntensity = useProjectStore((s) => s.config.cameraIntensity ?? 1)

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
    engine.setElements(store.config.elements)
    engine.start()
    if (import.meta.env.DEV) {
      // Apenas em desenvolvimento: permite inspecionar/auditar os layouts no navegador.
      ;(window as unknown as Record<string, unknown>).__drazyxEngine = engine
      ;(window as unknown as Record<string, unknown>).__drazyxStore = useProjectStore
      ;(window as unknown as Record<string, unknown>).__drazyxRecorder = useRecorderStore
      ;(window as unknown as Record<string, unknown>).__drazyxAudio = getAudioEngine()
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

  useEffect(() => {
    engineRef.current?.setCameraPreset(cameraPreset, cameraIntensity)
  }, [cameraPreset, cameraIntensity])

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

  // Camadas editáveis (o overlay HTML apenas manipula; o WebGL desenha)
  useEffect(() => {
    engineRef.current?.setElements(elements)
  }, [elements])

  const dims = getOutputDimensions(aspect, quality)

  // O CSS sozinho não preserva a razão quando a largura é limitada e a altura
  // continua em 100%: medimos o espaço real e ajustamos o retângulo.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = (): void => {
      const style = window.getComputedStyle(frame)
      const padX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
      const padY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
      const next = {
        width: Math.max(0, frame.clientWidth - padX),
        height: Math.max(0, frame.clientHeight - padY),
      }
      setAvailable((prev) =>
        Math.abs(prev.width - next.width) < 1 && Math.abs(prev.height - next.height) < 1 ? prev : next,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    window.addEventListener('orientationchange', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  const fitted = fitStageSize(dims, available)
  const stageStyle = fitted.width > 0
    ? { width: `${fitted.width}px`, height: `${fitted.height}px`, aspectRatio: `${dims.width} / ${dims.height}` }
    : { aspectRatio: `${dims.width} / ${dims.height}` }

  return (
    <div className={styles.stageFrame} ref={frameRef}>
      <div className={styles.stageInner} style={stageStyle}>
        <canvas ref={canvasRef as React.Ref<HTMLCanvasElement>} width={dims.width} height={dims.height} className={styles.canvas} />
        <CompositionOverlay />
      </div>
    </div>
  )
}
