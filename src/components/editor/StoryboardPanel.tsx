import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import type { TemplateId } from '../../features/project/project.types'
import { getAudioEngine } from '../../features/audio/AudioEngine'
import { analyzeClipAudio } from '../../features/audio/offline-analysis'
import { TEMPLATE_LIST } from '../../features/visualizer/templates/registry'
import { HOOK_OPTIONS, MOTION_OPTIONS, ROLE_LABELS, TRANSITION_OPTIONS } from '../../features/storyboard/storyboard.utils'
import type { SceneMotion, SceneRole, SceneTransition } from '../../features/storyboard/storyboard.types'
import { formatTime } from '../../lib/format-time'
import { Button, Notice, Panel, Slider, TextInput, Toggle } from '../ui/ui'
import styles from './panels.module.css'

function segmentClass(role: SceneRole): string {
  switch (role) {
    case 'hook':
      return styles.sbSegHook
    case 'reveal':
      return styles.sbSegReveal
    case 'peak':
      return styles.sbSegPeak
    case 'payoff':
      return styles.sbSegPayoff
    default:
      return styles.sbSegDevelopment
  }
}

export function StoryboardPanel(): JSX.Element {
  const storyboard = useProjectStore((s) => s.config.storyboard)
  const clipStart = useProjectStore((s) => s.config.clipStart)
  const clipDuration = useProjectStore((s) => s.config.clipDuration)
  const audioMeta = useProjectStore((s) => s.audioMeta)
  const setStoryboardEnabled = useProjectStore((s) => s.setStoryboardEnabled)
  const applyStoryboardPreset = useProjectStore((s) => s.applyStoryboardPreset)
  const setAutoStoryboard = useProjectStore((s) => s.setAutoStoryboard)
  const setHook = useProjectStore((s) => s.setHook)
  const updateScene = useProjectStore((s) => s.updateScene)
  const setSceneDuration = useProjectStore((s) => s.setSceneDuration)
  const addScene = useProjectStore((s) => s.addScene)
  const duplicateScene = useProjectStore((s) => s.duplicateScene)
  const removeScene = useProjectStore((s) => s.removeScene)
  const moveScene = useProjectStore((s) => s.moveScene)

  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const playheadRef = useRef<HTMLSpanElement | null>(null)

  const { scenes, hook, enabled } = storyboard
  const hookScene = scenes[0]?.role === 'hook' ? scenes[0] : null
  const hookMax = Math.min(5, Math.max(0.5, clipDuration - 0.5 * Math.max(0, scenes.length - 1)))
  const sceneMax = Math.max(0.5, clipDuration - 0.5 * Math.max(0, scenes.length - 1))

  // Playhead lê o tempo real do áudio sem re-renderizar o painel.
  useEffect(() => {
    let raf = 0
    const tick = (): void => {
      raf = requestAnimationFrame(tick)
      const element = playheadRef.current
      if (!element) return
      const time = getAudioEngine().getFrame().time
      const progress = clipDuration > 0 ? (time - clipStart) / clipDuration : 0
      element.style.left = `${Math.max(0, Math.min(1, progress)) * 100}%`
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clipStart, clipDuration])

  /** Toca o trecho a partir da cena escolhida, usando o tempo real do áudio. */
  const previewScene = async (sceneStart: number): Promise<void> => {
    if (!audioMeta) return
    const engine = getAudioEngine()
    const absolute = Math.min(clipStart + sceneStart, clipStart + clipDuration - 0.1)
    engine.seek(Math.max(clipStart, absolute))
    await engine.play()
  }

  const handleAuto = async (): Promise<void> => {
    if (!audioMeta || analyzing) return
    setAnalyzing(true)
    setError(null)
    try {
      const analysis = await analyzeClipAudio(audioMeta.objectUrl, clipStart, clipDuration)
      setAutoStoryboard(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível analisar o áudio.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Panel
      title="Storyboard"
      hint="Hook, revelação, desenvolvimento, pico e fechamento sincronizados com o tempo real do áudio."
    >
      <Toggle label="Ativar storyboard" checked={enabled} onChange={setStoryboardEnabled} />

      <div className={styles.sbToolbar}>
        <Button onClick={() => applyStoryboardPreset(15)}>Preset 15s</Button>
        <Button onClick={() => applyStoryboardPreset(30)}>Preset 30s</Button>
        <Button variant="primary" onClick={() => void handleAuto()} disabled={!audioMeta || analyzing}>
          {analyzing ? 'Analisando…' : 'Auto pelo áudio'}
        </Button>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {enabled ? (
        <>
          <div className={styles.sbHook}>
            <label className={styles.sbField}>
              <span>Tipo de hook</span>
              <select
                className={styles.sbSelect}
                value={hook.type}
                onChange={(event) => setHook({ type: event.target.value as typeof hook.type })}
              >
                {HOOK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <TextInput label="Frase do hook" value={hook.text} maxLength={90} onChange={(text) => setHook({ text })} />
            {hookScene ? (
              <Slider
                label="Duração do hook"
                min={0.5}
                max={hookMax}
                step={0.5}
                value={hookScene.end - hookScene.start}
                format={(value) => `${value.toFixed(1)}s`}
                onChange={(seconds) => setSceneDuration(hookScene.id, seconds)}
              />
            ) : null}
            <p className={styles.sbNote}>
              Interesse em 0–1s · curiosidade em 1–3s · revelação em 3–5s. Total: {formatTime(clipDuration)}.
            </p>
          </div>

          <div className={styles.sbTimeline} aria-hidden="true">
            {scenes.map((scene) => (
              <span
                key={scene.id}
                className={`${styles.sbSegment} ${segmentClass(scene.role)}`}
                style={{ flexGrow: Math.max(0.01, scene.end - scene.start) }}
                title={`${ROLE_LABELS[scene.role]} · ${formatTime(scene.start)} → ${formatTime(scene.end)}`}
              />
            ))}
            <span ref={playheadRef} className={styles.sbPlayhead} />
          </div>

          <div className={styles.sbSceneList}>
            {scenes.map((scene, index) => (
              <div key={scene.id} className={styles.sbScene}>
                <div className={styles.sbSceneHead}>
                  <span className={styles.sbSceneRole}>{ROLE_LABELS[scene.role]}</span>
                  <span className={styles.sbSceneActions}>
                    <span className={styles.sbSceneTime}>
                      {formatTime(scene.start)} → {formatTime(scene.end)}
                    </span>
                    <Button onClick={() => void previewScene(scene.start)} disabled={!audioMeta}>
                      ▶ Cena
                    </Button>
                  </span>
                </div>

                <div className={styles.sbSceneGrid}>
                  <label className={styles.sbField}>
                    <span>Layout</span>
                    <select
                      className={styles.sbSelect}
                      value={scene.layoutId}
                      onChange={(event) => updateScene(scene.id, { layoutId: event.target.value as TemplateId })}
                    >
                      {TEMPLATE_LIST.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.sbField}>
                    <span>Paleta</span>
                    <select
                      className={styles.sbSelect}
                      value={scene.visualStyleId}
                      onChange={(event) =>
                        updateScene(scene.id, { visualStyleId: event.target.value as 'album' | 'violet' })
                      }
                    >
                      <option value="album">Da capa</option>
                      <option value="violet">Violeta Drazyx</option>
                    </select>
                  </label>
                  <label className={styles.sbField}>
                    <span>Transição</span>
                    <select
                      className={styles.sbSelect}
                      value={scene.transition}
                      onChange={(event) =>
                        updateScene(scene.id, { transition: event.target.value as SceneTransition })
                      }
                    >
                      {TRANSITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.sbField}>
                    <span>Movimento</span>
                    <select
                      className={styles.sbSelect}
                      value={scene.motion}
                      onChange={(event) => updateScene(scene.id, { motion: event.target.value as SceneMotion })}
                    >
                      {MOTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <Slider
                  label="Duração"
                  min={0.5}
                  max={sceneMax}
                  step={0.5}
                  value={scene.end - scene.start}
                  format={(value) => `${value.toFixed(1)}s`}
                  onChange={(seconds) => setSceneDuration(scene.id, seconds)}
                />
                <Slider
                  label="Intensidade"
                  min={0.3}
                  max={1}
                  step={0.05}
                  value={scene.audioIntensity}
                  format={(value) => `${Math.round(value * 100)}%`}
                  onChange={(audioIntensity) => updateScene(scene.id, { audioIntensity })}
                />

                <TextInput
                  label="Frase da cena"
                  value={scene.text}
                  maxLength={90}
                  placeholder="Opcional"
                  onChange={(text) => updateScene(scene.id, { text })}
                />
                <Toggle
                  label="Mostrar frase"
                  checked={scene.showText}
                  onChange={(showText) => updateScene(scene.id, { showText })}
                />

                <div className={styles.sbActions}>
                  <Button onClick={() => moveScene(scene.id, -1)} disabled={index === 0}>
                    ↑
                  </Button>
                  <Button onClick={() => moveScene(scene.id, 1)} disabled={index === scenes.length - 1}>
                    ↓
                  </Button>
                  <Button onClick={() => duplicateScene(scene.id)}>Duplicar</Button>
                  <Button onClick={() => addScene(scene.id)}>Adicionar após</Button>
                  <Button variant="danger" onClick={() => removeScene(scene.id)} disabled={scenes.length <= 1}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className={styles.sbNote}>Preview e gravação usam este mesmo storyboard e o tempo real do áudio.</p>
        </>
      ) : (
        <p className={styles.sbNote}>
          Ative para substituir o template fixo por uma sequência de cenas com hook, revelação, pico e CTA.
        </p>
      )}
    </Panel>
  )
}
