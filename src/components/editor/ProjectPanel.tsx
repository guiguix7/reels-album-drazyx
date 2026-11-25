import { useCallback, useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { parseProjectFile, serializeProject } from '../../features/persistence/project-io'
import { loadAutosave, writeAutosave } from '../../features/persistence/autosave'
import { resetEditHistory } from '../../features/history/edit-history'
import { applyBrandPreset, deleteBrandPreset, listBrandPresets, saveBrandPreset } from '../../features/presets/brand-presets'
import type { BrandPreset } from '../../features/presets/brand-presets'
import {
  deleteProject,
  duplicateProject,
  listProjects,
  renameProject,
  saveProject,
} from '../../features/persistence/db'
import type { StoredProject } from '../../features/persistence/db'
import { Button, Notice, Panel, TextInput } from '../ui/ui'
import styles from './panels.module.css'

function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  // Revoga depois do clique; o navegador já iniciou o download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function dateLabel(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR')
}

/** Projetos locais em IndexedDB: salvar/carregar/duplicar/renomear/excluir e JSON. */
export function ProjectPanel(): JSX.Element {
  const config = useProjectStore((s) => s.config)
  const setConfig = useProjectStore((s) => s.setConfig)
  const [restored] = useState(() => loadAutosave())
  const [name, setName] = useState(restored?.name ?? 'Meu projeto')
  const [autosaveAt, setAutosaveAt] = useState<string | null>(restored?.savedAt ?? null)
  const [autosaveError, setAutosaveError] = useState(false)
  const hydrated = useRef(false)
  const [brandName, setBrandName] = useState('')
  const [brandPresets, setBrandPresets] = useState<BrandPreset[]>(() => listBrandPresets())
  const [brandError, setBrandError] = useState<string | null>(null)
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setProjects(await listProjects())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ler os projetos locais.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Restaura o último autosave uma vez; mídia (áudio/capa) é sempre da sessão.
  useEffect(() => {
    if (restored) {
      setConfig(restored.config)
      // Restauração não é uma edição: não deve aparecer no desfazer.
      resetEditHistory()
    }
    hydrated.current = true
  }, [restored, setConfig])

  useEffect(() => {
    if (!hydrated.current) return
    const timer = window.setTimeout(() => {
      const savedAt = writeAutosave(name, config)
      if (savedAt) {
        setAutosaveAt(savedAt)
        setAutosaveError(false)
      } else {
        setAutosaveError(true)
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [config, name])

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na operação de projeto.')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = (): Promise<void> =>
    run(async () => {
      const saved = await saveProject(name, config, activeId ?? undefined)
      setActiveId(saved.id)
      await refresh()
    })

  const handleImport = async (file: File | undefined): Promise<void> => {
    if (!file) return
    await run(async () => {
      const parsed = parseProjectFile(await file.text())
      setConfig(parsed.config)
      setName(parsed.name)
    })
  }

  return (
    <Panel
      title="Projetos"
      hint="Salvos neste navegador (IndexedDB). Áudio e capa não são persistidos — recarregue-os após abrir."
      actions={
        <Button onClick={() => void refresh()} disabled={busy}>
          Atualizar
        </Button>
      }
    >
      <TextInput label="Nome" value={name} maxLength={60} onChange={setName} />
      <p className={styles.panelNote}>
        {autosaveError
          ? 'Autosave indisponível: armazenamento local cheio ou bloqueado. Use Exportar JSON.'
          : autosaveAt
            ? `Autosave ativo · ${dateLabel(autosaveAt)}`
            : 'Autosave ativo: a configuração volta ao reabrir (sem áudio/capa).'}
      </p>

      <div className={styles.sbToolbar}>
        <Button variant="primary" onClick={() => void handleSave()} disabled={busy}>
          {activeId ? 'Salvar alterações' : 'Salvar projeto'}
        </Button>
        <Button
          onClick={() => downloadText(`${name.trim() || 'drazyx-projeto'}.json`, serializeProject(name, config))}
          disabled={busy}
        >
          Exportar JSON
        </Button>
        <Button onClick={() => importRef.current?.click()} disabled={busy}>
          Importar JSON
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void handleImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className={styles.brandPresetBlock}>
        <p className={styles.groupLabel}>Presets de marca</p>
        <p className={styles.panelNote}>
          Paleta, tipografia, movimento, template e câmera reutilizáveis entre lançamentos. Áudio, capa e
          nomes de faixa continuam sendo do projeto atual.
        </p>
        <div className={styles.projectRename}>
          <input
            className={styles.numberInput}
            value={brandName}
            maxLength={40}
            placeholder="Nome do preset"
            onChange={(e) => setBrandName(e.target.value)}
            aria-label="Nome do preset de marca"
          />
          <Button
            onClick={() => {
              try {
                saveBrandPreset(brandName, config)
                setBrandPresets(listBrandPresets())
                setBrandName('')
                setBrandError(null)
              } catch {
                setBrandError('Não foi possível salvar o preset neste navegador.')
              }
            }}
            disabled={busy}
          >
            Salvar marca
          </Button>
        </div>
        {brandError ? <Notice tone="error">{brandError}</Notice> : null}
        {brandPresets.length > 0 ? (
          <ul className={styles.projectList}>
            {brandPresets.map((preset) => (
              <li key={preset.id} className={styles.projectItem}>
                <div className={styles.projectHead}>
                  <span className={styles.projectName}>{preset.name}</span>
                  <span className={styles.projectDate}>{preset.templateId}</span>
                </div>
                <div className={styles.projectActions}>
                  <Button
                    onClick={() => {
                      setConfig(applyBrandPreset(config, preset))
                      setBrandError(null)
                    }}
                    disabled={busy}
                  >
                    Aplicar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      deleteBrandPreset(preset.id)
                      setBrandPresets(listBrandPresets())
                    }}
                    disabled={busy}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.panelNote}>Nenhum preset de marca salvo ainda.</p>
        )}
      </div>

      {projects.length === 0 ? (
        <p className={styles.panelNote}>Nenhum projeto salvo ainda.</p>
      ) : (
        <ul className={styles.projectList}>
          {projects.map((project) => (
            <li key={project.id} className={styles.projectItem}>
              {editingId === project.id ? (
                <div className={styles.projectRename}>
                  <input
                    className={styles.numberInput}
                    value={editingName}
                    maxLength={60}
                    onChange={(e) => setEditingName(e.target.value)}
                    aria-label="Novo nome do projeto"
                  />
                  <Button
                    onClick={() =>
                      void run(async () => {
                        await renameProject(project.id, editingName)
                        setEditingId(null)
                        await refresh()
                      })
                    }
                  >
                    OK
                  </Button>
                  <Button onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              ) : (
                <div className={styles.projectHead}>
                  <span className={styles.projectName}>{project.name}</span>
                  <span className={styles.projectDate}>{dateLabel(project.updatedAt)}</span>
                </div>
              )}
              <div className={styles.projectActions}>
                <Button
                  onClick={() =>
                    void run(async () => {
                      setConfig(project.config)
                      setName(project.name)
                      setActiveId(project.id)
                    })
                  }
                  disabled={busy}
                >
                  Carregar
                </Button>
                <Button
                  onClick={() =>
                    void run(async () => {
                      await duplicateProject(project.id)
                      await refresh()
                    })
                  }
                  disabled={busy}
                >
                  Duplicar
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(project.id)
                    setEditingName(project.name)
                  }}
                  disabled={busy}
                >
                  Renomear
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    void run(async () => {
                      await deleteProject(project.id)
                      if (activeId === project.id) setActiveId(null)
                      await refresh()
                    })
                  }
                  disabled={busy}
                >
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
