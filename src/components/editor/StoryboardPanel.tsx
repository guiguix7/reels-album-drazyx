import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import type { TemplateId } from '../../features/project/project.types'
import { getAudioEngine } from '../../features/audio/AudioEngine'
import { analyzeClipAudio } from '../../features/audio/offline-analysis'
import { TEMPLATE_LIST } from '../../features/visualizer/templates/registry'
import {
  HOOK_OPTIONS,
  MOTION_OPTIONS,
  ROLE_HINTS,
  ROLE_LABELS,
  TRANSITION_OPTIONS,
} from '../../features/storyboard/storyboard.utils'
import type { SceneMotion, SceneRole, SceneTransition } from '../../features/storyboard/storyboard.types'
import { formatTime } from '../../lib/format-time'
import { Button, Notice, Panel, Select, Slider, TextInput, Toggle } from '../ui/ui'
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

  const [selectedId, setSelectedId] = useState<string | null>(storyboard.scenes[0]?.id ?? null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const playheadRef = useRef<HTMLSpanElement | null>(null)

  const { scenes, hook, enabled } = storyboard
  const selected = scenes.find((scene) => scene.id === selectedId) ?? scenes[0] ?? null
  const selectedIndex = selected ? scenes.findIndex((scene) => scene.id === selected.id) : -1
  const sceneMax = Math.max(0.5, clipDuration - 0.5 * Math.max(0, scenes.length - 1))
  const clipEnd = clipStart + clipDuration

  useEffect(() => {
    if (!scenes.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !scenes.some((scene) => scene.id === selectedId)) setSelectedId(scenes[0].id)
  }, [scenes, selectedId])

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

  const previewScene = (id: string): void => {
    if (!audioMeta) return
    const scene = scenes.find((item) => item.id === id)
    if (!scene) return
    setSelectedId(id)
    getAudioEngine().playClip(clipStart + scene.start, clipStart + scene.end)
  }

  const previewStory = (): void => {
    if (!audioMeta) return
    getAudioEngine().playClip(clipStart, clipEnd)
  }

  const seekScene = (scene: (typeof scenes)[number]): void => {
    setSelectedId(scene.id)
    getAudioEngine().seek(clipStart + scene.start)
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
      hint="Uma sequência de cenas; selecione uma para editar. O playhead usa o tempo real do áudio."
    >
      <div className={styles.sbTop}>
        <Toggle label="Ativar storyboard" checked={enabled} onChange={setStoryboardEnabled} />
        <div className={styles.sbToolbar}>
          <Button onClick={() => applyStoryboardPreset(15)}>15s</Button>
          <Button onClick={() => applyStoryboardPreset(30)}>30s</Button>
          <Button onClick={() => applyStoryboardPreset(45)}>45s</Button>
          <Button variant="primary" onClick={() => void handleAuto()} disabled={!audioMeta || analyzing}>
            {analyzing ? 'Analisando…' : 'Auto pelo áudio'}
          </Button>
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {!enabled ? (
        <p className={styles.sbNote}>
          Ative para trocar o template fixo por uma sequência de cenas com abertura, revelação, desenvolvimento, pico e fechamento.
        </p>
      ) : (
        <>
          <div className={styles.sbTimeline} role="group" aria-label="Linha de cenas do storyboard">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                className={`${styles.sbSegment} ${segmentClass(scene.role)} ${selected?.id === scene.id ? styles.sbSegmentActive : ''}`}
                style={{ flexGrow: Math.max(0.01, scene.end - scene.start) }}
                onClick={() => seekScene(scene)}
                aria-label={`${ROLE_LABELS[scene.role]} de ${formatTime(scene.start)} a ${formatTime(scene.end)}`}
                aria-current={selected?.id === scene.id ? 'true' : undefined}
              >
                <span>{ROLE_LABELS[scene.role]}</span>
              </button>
            ))}
            <span ref={playheadRef} className={styles.sbPlayhead} aria-hidden="true" />
          </div>

          <div className={styles.sbSceneStrip} aria-label="Cenas">
            {scenes.map((scene, index) => (
              <button
                key={scene.id}
                type="button"
                className={`${styles.sbSceneCard} ${selected?.id === scene.id ? styles.sbSceneCardActive : ''}`}
                onClick={() => setSelectedId(scene.id)}
                aria-pressed={selected?.id === scene.id}
              >
                <span className={styles.sbSceneCardIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.sbSceneCardRole}>{ROLE_LABELS[scene.role]}</span>
                <span className={styles.sbSceneCardTime}>
                  {formatTime(scene.start)}–{formatTime(scene.end)}
                </span>
              </button>
            ))}
          </div>

          {selected ? (
            <div className={styles.sbInspector}>
              <div className={styles.sbInspectorHead}>
                <div>
                  <strong>{ROLE_LABELS[selected.role]}</strong>
                  <span>
                    {formatTime(selected.start)} → {formatTime(selected.end)} · {(selected.end - selected.start).toFixed(1)}s
                  </span>
                </div>
                <Button onClick={() => previewScene(selected.id)} disabled={!audioMeta}>
                  Ouvir cena
                </Button>
              </div>
              <p className={styles.sbNote}>{ROLE_HINTS[selected.role]}</p>

              <Slider
                label="Duração"
                min={0.5}
                max={sceneMax}
                step={0.5}
                value={selected.end - selected.start}
                format={(value) => `${value.toFixed(1)}s`}
                hint="A duração total do trecho é fixa; ajustar esta cena redistribui as outras."
                onChange={(seconds) => setSceneDuration(selected.id, seconds)}
              />

              {selected.role === 'hook' ? (
                <>
                  <Select
                    label="Tipo de hook"
                    value={hook.type}
                    options={HOOK_OPTIONS}
                    onChange={(type) => setHook({ type })}
                  />
                  <TextInput label="Frase do hook" value={hook.text} maxLength={90} onChange={(text) => setHook({ text })} />
                </>
              ) : (
                <TextInput
                  label="Frase da cena"
                  value={selected.text}
                  maxLength={90}
                  placeholder="Opcional"
                  onChange={(text) => updateScene(selected.id, { text })}
                />
              )}
              <Toggle
                label="Mostrar frase nesta cena"
                checked={selected.showText}
                onChange={(showText) => updateScene(selected.id, { showText })}
              />
              <p className={styles.sbNote}>
                A frase entra como tagline; os metadados globais (artista, faixa, álbum, CTA) continuam sendo controlados em Tipografia.
              </p>

              <div className={styles.sbSceneGrid}>
                <label className={styles.sbField}>
                  <span>Layout</span>
                  <select
                    className={styles.sbSelect}
                    value={selected.layoutId}
                    onChange={(event) => updateScene(selected.id, { layoutId: event.target.value as TemplateId })}
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
                    value={selected.visualStyleId}
                    onChange={(event) =>
                      updateScene(selected.id, { visualStyleId: event.target.value as 'album' | 'violet' })
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
                    value={selected.transition}
                    onChange={(event) =>
                      updateScene(selected.id, { transition: event.target.value as SceneTransition })
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
                    value={selected.motion}
                    onChange={(event) => updateScene(selected.id, { motion: event.target.value as SceneMotion })}
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
                label="Intensidade"
                min={0.3}
                max={1}
                step={0.05}
                value={selected.audioIntensity}
                format={(value) => `${Math.round(value * 100)}%`}
                hint="Multiplica a reação ao áudio apenas nesta cena."
                onChange={(audioIntensity) => updateScene(selected.id, { audioIntensity })}
              />

              <div className={styles.sbActions}>
                <Button onClick={() => moveScene(selected.id, -1)} disabled={selectedIndex <= 0} aria-label="Mover cena para cima">
                  ↑
                </Button>
                <Button onClick={() => moveScene(selected.id, 1)} disabled={selectedIndex >= scenes.length - 1} aria-label="Mover cena para baixo">
                  ↓
                </Button>
                <Button onClick={() => duplicateScene(selected.id)}>Duplicar</Button>
                <Button onClick={() => addScene(selected.id)}>Adicionar após</Button>
                <Button variant="danger" onClick={() => removeScene(selected.id)} disabled={scenes.length <= 1}>
                  Remover
                </Button>
              </div>
            </div>
          ) : null}

          <div className={styles.sbFooter}>
            <span>{scenes.length} cenas · total {formatTime(clipDuration)}</span>
            <Button onClick={previewStory} disabled={!audioMeta}>
              Tocar história
            </Button>
          </div>
          <p className={styles.sbNote}>Preview e gravação usam este storyboard e o tempo real do áudio; o áudio para no fim do trecho.</p>
        </>
      )}
    </Panel>
  )
}
