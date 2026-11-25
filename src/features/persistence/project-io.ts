import type { ProjectConfig } from '../project/project.types'
import { DEFAULT_PROJECT } from '../project/project.defaults'

export const PROJECT_SCHEMA_VERSION = 1

export interface ProjectFile {
  schema: typeof PROJECT_SCHEMA_VERSION
  app: 'drazyx-visualizer-studio'
  name: string
  savedAt: string
  config: ProjectConfig
}

/** Serializa o projeto para JSON (sem mídia — Object URLs não sobrevivem ao reload). */
export function serializeProject(name: string, config: ProjectConfig, savedAt = new Date()): string {
  const payload: ProjectFile = {
    schema: PROJECT_SCHEMA_VERSION,
    app: 'drazyx-visualizer-studio',
    name: name.trim() || 'Projeto sem nome',
    savedAt: savedAt.toISOString(),
    config,
  }
  return JSON.stringify(payload, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Lê um arquivo exportado. Aceita versões antigas preenchendo campos ausentes
 * com os defaults atuais; rejeita arquivos que não são deste app.
 */
export function parseProjectFile(text: string): { name: string; config: ProjectConfig } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (!isRecord(raw) || !isRecord(raw.config)) {
    throw new Error('Arquivo de projeto inválido: configuração ausente.')
  }
  if (raw.app !== undefined && raw.app !== 'drazyx-visualizer-studio') {
    throw new Error('Este arquivo não foi exportado pelo DRAZYX Visualizer Studio.')
  }
  const config = raw.config as Partial<ProjectConfig>
  if (!config.aspectRatio || !config.templateId || !config.type || !config.visual) {
    throw new Error('Arquivo de projeto incompleto: faltam campos obrigatórios.')
  }
  const merged: ProjectConfig = {
    ...DEFAULT_PROJECT,
    ...config,
    platform: config.platform ?? DEFAULT_PROJECT.platform,
    palette: { ...DEFAULT_PROJECT.palette, ...config.palette },
    visual: { ...DEFAULT_PROJECT.visual, ...config.visual },
    type: { ...DEFAULT_PROJECT.type, ...config.type },
    storyboard: {
      ...DEFAULT_PROJECT.storyboard,
      ...config.storyboard,
      hook: { ...DEFAULT_PROJECT.storyboard.hook, ...config.storyboard?.hook },
      scenes: config.storyboard?.scenes?.length ? config.storyboard.scenes : DEFAULT_PROJECT.storyboard.scenes,
    },
  }
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Projeto importado'
  return { name, config: merged }
}
