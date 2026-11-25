import { useCallback, useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../features/project/project.store'
import { parseProjectFile, serializeProject } from '../../features/persistence/project-io'
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
  const [name, setName] = useState('Meu projeto')
  const [projects, setProjects] = useState<StoredProject[]>([])
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
      await saveProject(name, config)
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

      <div className={styles.sbToolbar}>
        <Button variant="primary" onClick={() => void handleSave()} disabled={busy}>
          Salvar projeto
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
