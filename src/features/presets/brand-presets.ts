import type {
  AspectRatioId,
  CameraPreset,
  CompositionElement,
  PaletteSettings,
  ProjectConfig,
  TemplateId,
  TypeSettings,
  VisualSettings,
} from '../project/project.types'

const KEY = 'drazyx:brand-presets:v1'

export interface BrandPreset {
  id: string
  name: string
  createdAt: string
  palette: PaletteSettings
  visual: VisualSettings
  type: Pick<
    TypeSettings,
    'showArtist' | 'showTrack' | 'showAlbum' | 'showCta' | 'showTagline' | 'ctaText' | 'tagline' | 'scale' | 'tracking'
  >
  templateId: TemplateId
  aspectRatio: AspectRatioId
  cameraPreset: CameraPreset
  cameraIntensity: number
  elements: CompositionElement[]
}

function makeId(): string {
  return `brand-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
}

export function listBrandPresets(): BrandPreset[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as BrandPreset[]) : []
  } catch {
    return []
  }
}

function persist(presets: BrandPreset[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(presets.slice(0, 30)))
  } catch {
    throw new Error('Sem espaço no armazenamento local para salvar o preset.')
  }
}

/** Presets de marca são globais; o projeto atual não é alterado até aplicar. */
export function saveBrandPreset(name: string, config: ProjectConfig): BrandPreset {
  const preset: BrandPreset = {
    id: makeId(),
    name: name.trim() || 'Marca sem nome',
    createdAt: new Date().toISOString(),
    palette: structuredClone(config.palette),
    visual: structuredClone(config.visual),
    type: {
      showArtist: config.type.showArtist,
      showTrack: config.type.showTrack,
      showAlbum: config.type.showAlbum,
      showCta: config.type.showCta,
      showTagline: config.type.showTagline,
      ctaText: config.type.ctaText,
      tagline: config.type.tagline,
      scale: config.type.scale,
      tracking: config.type.tracking,
    },
    templateId: config.templateId,
    aspectRatio: config.aspectRatio,
    cameraPreset: config.cameraPreset ?? 'auto',
    cameraIntensity: config.cameraIntensity ?? 1,
    elements: structuredClone(config.elements),
  }
  persist([preset, ...listBrandPresets()])
  return preset
}

export function deleteBrandPreset(id: string): void {
  persist(listBrandPresets().filter((preset) => preset.id !== id))
}

export function applyBrandPreset(config: ProjectConfig, preset: BrandPreset): ProjectConfig {
  return {
    ...config,
    palette: structuredClone(preset.palette),
    visual: structuredClone(preset.visual),
    type: { ...config.type, ...structuredClone(preset.type) },
    templateId: preset.templateId,
    aspectRatio: preset.aspectRatio,
    cameraPreset: preset.cameraPreset,
    cameraIntensity: preset.cameraIntensity,
    elements: structuredClone(preset.elements),
  }
}
