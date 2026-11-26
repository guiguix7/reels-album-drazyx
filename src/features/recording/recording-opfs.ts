/** Sink opcional de gravação para Origin Private File System (OPFS).

 * A gravação padrão do app acumula chunks em memória e monta o Blob final
 * ao parar. Para gravações longas isso consome RAM proporcional ao arquivo.
 *
 * Este módulo é opcional e explicitamente opt-in: nunca é usado automaticamente.
 * Só é relevante quando o navegador suporta OPFS e quando o app/usuário escolhe
 * gravar diretamente no sistema de arquivos local.
 *
 * Regra importante: não assumimos que OPFS funciona em todos os navegadores.
 * Se não estiver disponível, a camada de memória permanece como fallback.
 */

export interface OpfsSinkCapabilities {
  /** OPFS (FileSystemSyncAccessHandle) está disponível neste ambiente. */
  available: boolean
}

export interface OpfsRecordingSink {
  /** Escreve um chunk no arquivo OPFS aberto. */
  writeChunk(chunk: Blob): Promise<void>
  /** Finaliza o arquivo e devolve o handle para leitura posterior. */
  finalize(): Promise<FileSystemFileHandle>
  /** Cancela e remove o arquivo parcial. */
  cancel(): Promise<void>
}

const OPFS_MIME_TYPES = ['video/webm', 'video/mp4']

type FileSystemSyncAccessHandle = {
  write: (buffer: ArrayBuffer | ArrayBufferView, options?: { at?: number }) => number
  flush: () => void
  close: () => void
}

type RawFileHandle = {
  createSyncAccessHandle: () => FileSystemSyncAccessHandle
  remove: () => Promise<void>
}

function asRawFileHandle(handle: FileSystemFileHandle): RawFileHandle {
  return handle as unknown as RawFileHandle
}

export async function opfsSinkCapabilities(): Promise<OpfsSinkCapabilities> {
  if (typeof navigator === 'undefined') return { available: false }
  if (!('storage' in navigator) || typeof navigator.storage !== 'object') return { available: false }

  try {
    if (typeof window === 'undefined') return { available: false }
    const win = window as unknown as { showSaveFilePicker?: unknown }
    if (typeof win.showSaveFilePicker === 'function') {
      // OPFS via File System Access API não é o mesmo que OPFS nativo.
      return { available: false }
    }
  } catch {
    return { available: false }
  }

  // Tenta abrir/criar um arquivo OPFS somente para detectar a capacidade.
  try {
    const dirHandle = await navigator.storage.getDirectory()
    const handle = await dirHandle.getFileHandle('__drazyx-opfs-capability-check__.tmp', { create: true })
    if (!handle) return { available: false }
    const accessHandle = await asRawFileHandle(handle).createSyncAccessHandle()
    accessHandle.close()
    await asRawFileHandle(handle).remove()
    return { available: true }
  } catch {
    return { available: false }
  }
}

export async function openOpfsRecordingSink(
  name: string,
  mimeType: string,
  onProgress?: (bytesWritten: number) => void,
): Promise<OpfsRecordingSink> {
  const caps = await opfsSinkCapabilities()
  if (!caps.available) throw new Error('OPFS indisponível neste navegador.')
  if (!OPFS_MIME_TYPES.some((m) => mimeType.startsWith(m))) {
    throw new Error('Tipo de arquivo não suportado pelo sink OPFS.')
  }

  const dirHandle = await navigator.storage.getDirectory()
  const fileHandle = await dirHandle.getFileHandle(name, { create: true })
  const accessHandle = await asRawFileHandle(fileHandle).createSyncAccessHandle()

  let bytesWritten = 0
  let finalized = false

  return {
    async writeChunk(chunk: Blob): Promise<void> {
      if (finalized) throw new Error('Sink já finalizado.')
      const buffer = new Uint8Array(await chunk.arrayBuffer())
      const written = accessHandle.write(buffer, { at: bytesWritten })
      bytesWritten += written
      onProgress?.(bytesWritten)
    },
    async finalize(): Promise<FileSystemFileHandle> {
      if (finalized) return fileHandle
      finalized = true
      accessHandle.flush()
      accessHandle.close()
      return fileHandle
    },
    async cancel(): Promise<void> {
      finalized = true
      try {
        accessHandle.close()
      } catch {
        /* não fazer sucesso silencioso se não conseguir fechar */
      }
      await asRawFileHandle(fileHandle).remove().catch(() => undefined)
    },
  }
}
