import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import type { CompositionElement, CompositionElementType } from '../../features/project/project.types'
import { ELEMENT_TYPE_LABELS } from '../../features/composition/composition.defaults'
import {
  loadCompositionPresets,
  parseCompositionFile,
  removeCompositionPreset,
  saveCompositionPreset,
  serializeComposition,
} from '../../features/composition/composition.presets'
import type { CompositionPreset } from '../../features/composition/composition.presets'
import { Button, ColorField, Notice, Panel, Select, Slider, TextInput, Toggle } from '../ui/ui'
import styles from './panels.module.css'

const TYPE_ORDER: CompositionElementType[] = ['text', 'artwork', 'shape', 'waveform', 'progress', 'player']

const FONT_OPTIONS: Array<{ value: 'title' | 'ui'; label: string }> = [
  { value: 'title', label: 'Título / display' },
  { value: 'ui', label: 'Interface' },
]

const WEIGHT_OPTIONS: Array<{ value: '400' | '500' | '600' | '700'; label: string }> = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Médio' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
]

const ALIGN_OPTIONS: Array<{ value: 'left' | 'center' | 'right'; label: string }> = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
]

const MOTION_OPTIONS: Array<{ value: 'none' | 'float' | 'pulse'; label: string }> = [
  { value: 'none', label: 'Estático' },
  { value: 'float', label: 'Flutuar' },
  { value: 'pulse', label: 'Pulsar com graves' },
]

function downloadText(fileName: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CompositionPanel(): JSX.Element {
  const elements = useProjectStore((s) => s.config.elements)
  const type = useProjectStore((s) => s.config.type)
  const selectedId = useProjectStore((s) => s.selectedElementId)
  const addElement = useProjectStore((s) => s.addElement)
  const updateElement = useProjectStore((s) => s.updateElement)
  const removeElement = useProjectStore((s) => s.removeElement)
  const duplicateElement = useProjectStore((s) => s.duplicateElement)
  const moveElementLayer = useProjectStore((s) => s.moveElementLayer)
  const replaceElements = useProjectStore((s) => s.replaceElements)
  const clearElements = useProjectStore((s) => s.clearElements)
  const selectElement = useProjectStore((s) => s.selectElement)

  const [presets, setPresets] = useState<CompositionPreset[]>([])
  const [presetName, setPresetName] = useState('Minha composição')
  const [presetId, setPresetId] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setPresets(loadCompositionPresets())
  }, [])

  const selected = elements.find((element) => element.id === selectedId) ?? null

  const savePreset = (): void => {
    const next = saveCompositionPreset(presetName, elements)
    setPresets(next)
    setPresetId(next[0]?.id ?? '')
    setMessage('Composição salva neste navegador.')
  }

  const applyPreset = (): void => {
    const preset = presets.find((entry) => entry.id === presetId)
    if (!preset) return
    replaceElements(structuredClone(preset.elements))
    setMessage(`Preset “${preset.name}” aplicado.`)
  }

  const deletePreset = (): void => {
    setPresets(removeCompositionPreset(presetId))
    setPresetId('')
    setMessage('Preset removido.')
  }

  const exportComposition = (): void => {
    downloadText('drazyx-composicao.json', serializeComposition(presetName, elements))
  }

  const importComposition = async (file: File | undefined): Promise<void> => {
    if (!file) return
    try {
      const parsed = parseCompositionFile(await file.text())
      replaceElements(parsed.elements)
      setPresetName(parsed.name)
      setMessage(`“${parsed.name}” importado.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível importar.')
    }
  }

  const patch = (next: Partial<CompositionElement>): void => {
    if (selected) updateElement(selected.id, next)
  }

  return (
    <Panel
      title="Elementos"
      hint="Adicione e mova camadas por cima do template. Tudo entra no vídeo gravado."
      actions={elements.length ? <Button onClick={() => clearElements()}>Limpar</Button> : undefined}
    >
      <div className={styles.compAddRow}>
        {TYPE_ORDER.map((elementType) => (
          <Button key={elementType} onClick={() => addElement(elementType)}>
            + {ELEMENT_TYPE_LABELS[elementType]}
          </Button>
        ))}
      </div>
      <div className={styles.compAddRow}>
        <span className={styles.rowLabel}>Do lançamento:</span>
        <Button onClick={() => addElement('text', { name: 'Artista', text: type.artistName, fontSize: 3.2, width: 52 })}>+ Artista</Button>
        <Button onClick={() => addElement('text', { name: 'Faixa', text: type.trackTitle, fontSize: 4.5, width: 68 })}>+ Faixa</Button>
        <Button onClick={() => addElement('text', { name: 'CTA', text: type.ctaText, fontSize: 3.2, width: 62, color: '#cf8aff' })}>+ CTA</Button>
      </div>

      {elements.length ? (
        <div className={styles.compLayerList} aria-label="Camadas (frente para trás)">
          {[...elements].reverse().map((element) => (
            <div key={element.id} className={`${styles.compLayerRow} ${selected?.id === element.id ? styles.compLayerRowActive : ''}`}>
              <button
                type="button"
                className={styles.compLayerName}
                onClick={() => selectElement(element.id)}
                aria-pressed={selected?.id === element.id}
              >
                {element.name}
                <span>{ELEMENT_TYPE_LABELS[element.type]}</span>
              </button>
              <button
                type="button"
                className={styles.compIconButton}
                aria-label={element.visible ? 'Ocultar camada' : 'Mostrar camada'}
                aria-pressed={!element.visible}
                onClick={() => updateElement(element.id, { visible: !element.visible })}
              >
                {element.visible ? '◉' : '○'}
              </button>
              <button
                type="button"
                className={styles.compIconButton}
                aria-label={element.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                aria-pressed={element.locked}
                onClick={() => updateElement(element.id, { locked: !element.locked })}
              >
                {element.locked ? '■' : '□'}
              </button>
              <button type="button" className={styles.compIconButton} aria-label="Trazer para frente" onClick={() => moveElementLayer(element.id, 1)}>
                ↑
              </button>
              <button type="button" className={styles.compIconButton} aria-label="Enviar para trás" onClick={() => moveElementLayer(element.id, -1)}>
                ↓
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.panelNote}>Nenhuma camada extra. O template continua intacto até você adicionar um elemento.</p>
      )}

      {selected ? (
        <div className={styles.compInspector}>
          <div className={styles.compInspectorHead}>
            <strong>{selected.name}</strong>
            <div className={styles.compInspectorActions}>
              <Button onClick={() => duplicateElement(selected.id)}>Duplicar</Button>
              <Button variant="danger" onClick={() => removeElement(selected.id)}>Remover</Button>
            </div>
          </div>

          <TextInput label="Nome da camada" value={selected.name} maxLength={32} onChange={(name) => patch({ name })} />
          <p className={styles.groupLabel}>Posição</p>
          <Slider label="X" min={-20} max={120} step={0.5} value={selected.x} onChange={(x) => patch({ x })} format={(v) => `${v.toFixed(0)}%`} hint="Centro horizontal do elemento no palco." />
          <Slider label="Y" min={-20} max={120} step={0.5} value={selected.y} onChange={(y) => patch({ y })} format={(v) => `${v.toFixed(0)}%`} hint="Centro vertical do elemento no palco." />
          <p className={styles.groupLabel}>Tamanho</p>
          <Slider label="Largura" min={2} max={160} step={1} value={selected.width} onChange={(width) => patch({ width })} format={(v) => `${v.toFixed(0)}%`} />
          <Slider label="Altura" min={1} max={100} step={1} value={selected.height} onChange={(height) => patch({ height })} format={(v) => `${v.toFixed(0)}%`} />
          <Slider label="Rotação" min={-180} max={180} step={1} value={selected.rotation} onChange={(rotation) => patch({ rotation })} format={(v) => `${v.toFixed(0)}°`} />
          <Slider label="Opacidade" min={0} max={1} step={0.01} value={selected.opacity} onChange={(opacity) => patch({ opacity })} format={(v) => `${Math.round(v * 100)}%`} />

          {selected.type === 'player' ? (
            <TextInput label="Faixa no player" value={selected.text} maxLength={90} onChange={(text) => patch({ text })} />
          ) : null}

          {selected.type === 'text' ? (
            <>
              <p className={styles.groupLabel}>Tipografia</p>
              <TextInput label="Texto" value={selected.text} maxLength={90} onChange={(text) => patch({ text })} />
              <Select label="Fonte" value={selected.font} options={FONT_OPTIONS} onChange={(font) => patch({ font })} />
              <Select
                label="Peso"
                value={String(selected.weight) as '400' | '500' | '600' | '700'}
                options={WEIGHT_OPTIONS}
                onChange={(weight) => patch({ weight: Number(weight) })}
              />
              <Select label="Alinhamento" value={selected.align} options={ALIGN_OPTIONS} onChange={(align) => patch({ align })} />
              <Slider label="Tamanho do texto" min={1} max={30} step={0.5} value={selected.fontSize} onChange={(fontSize) => patch({ fontSize })} format={(v) => `${v.toFixed(1)}%`} />
              <Slider label="Tracking" min={-2} max={24} step={1} value={selected.tracking} onChange={(tracking) => patch({ tracking })} />
            </>
          ) : null}

          {selected.type !== 'artwork' ? <ColorField label="Cor" value={selected.color} onChange={(color) => patch({ color })} /> : null}

          <p className={styles.groupLabel}>Movimento</p>
          <Select label="Animação" value={selected.motion} options={MOTION_OPTIONS} onChange={(motion) => patch({ motion })} />
          <Slider label="Intensidade do movimento" min={0} max={100} step={1} value={selected.motionAmount} onChange={(motionAmount) => patch({ motionAmount })} format={(v) => `${v.toFixed(0)}%`} />
          <Toggle label="Reagir aos graves" checked={selected.reactive} onChange={(reactive) => patch({ reactive })} />
          <Toggle label="Camada visível" checked={selected.visible} onChange={(visible) => patch({ visible })} />
          <Toggle label="Bloquear no Stage" checked={selected.locked} onChange={(locked) => patch({ locked })} />
        </div>
      ) : null}

      <details className={styles.compPresets}>
        <summary>Presets de composição</summary>
        <p className={styles.panelNote}>Salve a composição atual neste navegador e reutilize em outro lançamento.</p>
        <TextInput label="Nome" value={presetName} maxLength={32} onChange={setPresetName} />
        <div className={styles.compPresetRow}>
          <Button onClick={savePreset} disabled={!elements.length}>Salvar atual</Button>
          <Button onClick={exportComposition} disabled={!elements.length}>Exportar JSON</Button>
          <Button onClick={() => importRef.current?.click()}>Importar JSON</Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenInput}
            aria-label="Importar composição JSON"
            onChange={(event) => void importComposition(event.target.files?.[0])}
          />
        </div>
        {presets.length ? (
          <div className={styles.compPresetRow}>
            <label className={styles.sbField}>
              <span>Preset salvo</span>
              <select className={styles.sbSelect} value={presetId} onChange={(event) => setPresetId(event.target.value)}>
                <option value="">Selecione…</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
            </label>
            <Button onClick={applyPreset} disabled={!presetId}>Aplicar</Button>
            <Button variant="danger" onClick={deletePreset} disabled={!presetId}>Excluir</Button>
          </div>
        ) : null}
      </details>

      {message ? <Notice tone="info">{message}</Notice> : null}
    </Panel>
  )
}
