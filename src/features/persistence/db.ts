import type { ProjectConfig } from '../project/project.types'
import type { ExportManifest } from './manifest.types'
import type { RetentionMetric } from '../retention/retention.types'

export interface StoredProject {
  id: string
  name: string
  savedAt: string
  updatedAt: string
  config: ProjectConfig
}

const DB_NAME = 'drazyx-visualizer-studio'
const DB_VERSION = 1
const PROJECTS = 'projects'
const EXPORTS = 'exports'
const METRICS = 'metrics'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Este navegador não oferece IndexedDB. Os projetos não podem ser salvos localmente.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(EXPORTS)) db.createObjectStore(EXPORTS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(METRICS)) db.createObjectStore(METRICS, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Não foi possível abrir o armazenamento local.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Falha ao acessar o armazenamento local.'))
  })
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDatabase()
  try {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const result = await run(store)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Falha ao gravar no armazenamento local.'))
      tx.onabort = () => reject(new Error('Gravação local cancelada.'))
    })
    return result
  } finally {
    db.close()
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
}

/* ---------- projetos ---------- */

export async function listProjects(): Promise<StoredProject[]> {
  const all = await withStore(PROJECTS, 'readonly', (store) =>
    requestResult(store.getAll() as IDBRequest<StoredProject[]>),
  )
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveProject(
  name: string,
  config: ProjectConfig,
  id?: string,
): Promise<StoredProject> {
  const now = new Date().toISOString()
  return withStore(PROJECTS, 'readwrite', async (store) => {
    const existing = id ? await requestResult(store.get(id) as IDBRequest<StoredProject | undefined>) : undefined
    const record: StoredProject = {
      id: existing?.id ?? id ?? makeId('project'),
      name: name.trim() || existing?.name || 'Projeto sem nome',
      savedAt: now,
      updatedAt: now,
      config: structuredClone(config),
    }
    await requestResult(store.put(record))
    return record
  })
}

export async function renameProject(id: string, name: string): Promise<StoredProject> {
  return withStore(PROJECTS, 'readwrite', async (store) => {
    const existing = await requestResult(store.get(id) as IDBRequest<StoredProject | undefined>)
    if (!existing) throw new Error('Projeto não encontrado.')
    const record: StoredProject = {
      ...existing,
      name: name.trim() || existing.name,
      updatedAt: new Date().toISOString(),
    }
    await requestResult(store.put(record))
    return record
  })
}

export async function duplicateProject(id: string, name?: string): Promise<StoredProject> {
  return withStore(PROJECTS, 'readwrite', async (store) => {
    const existing = await requestResult(store.get(id) as IDBRequest<StoredProject | undefined>)
    if (!existing) throw new Error('Projeto não encontrado.')
    const now = new Date().toISOString()
    const copy: StoredProject = {
      ...existing,
      id: makeId('project'),
      name: name?.trim() || `${existing.name} (cópia)`,
      savedAt: now,
      updatedAt: now,
      config: structuredClone(existing.config),
    }
    await requestResult(store.put(copy))
    return copy
  })
}

export async function deleteProject(id: string): Promise<void> {
  await withStore(PROJECTS, 'readwrite', (store) => requestResult(store.delete(id)))
}

/* ---------- manifests de export ---------- */

export async function saveExportManifest(manifest: ExportManifest): Promise<void> {
  await withStore(EXPORTS, 'readwrite', (store) => requestResult(store.put(manifest)))
}

export async function listExportManifests(limit = 50): Promise<ExportManifest[]> {
  const all = await withStore(EXPORTS, 'readonly', (store) =>
    requestResult(store.getAll() as IDBRequest<ExportManifest[]>),
  )
  return all.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, limit)
}

/* ---------- métricas ---------- */

export async function saveMetric(metric: RetentionMetric): Promise<void> {
  await withStore(METRICS, 'readwrite', (store) => requestResult(store.put(metric)))
}

export async function listMetrics(): Promise<RetentionMetric[]> {
  const all = await withStore(METRICS, 'readonly', (store) =>
    requestResult(store.getAll() as IDBRequest<RetentionMetric[]>),
  )
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteMetric(id: string): Promise<void> {
  await withStore(METRICS, 'readwrite', (store) => requestResult(store.delete(id)))
}
