import type { TemplateId } from '../../project/project.types'
import type { VisualTemplate } from '../visual.types'
import { MirageTemplate } from './mirage'
import { AfterimageTemplate } from './afterimage'
import { VoidTemplate } from './void'
import { SpectrumTemplate } from './spectrum'
import { Layout01 } from './layout01'
import { Layout02 } from './layout02'
import { Template03 } from './t3'
import { Template04 } from './t4'
import { Template05 } from './t5'
import { Layout06 } from './layout06'
import { Layout07 } from './layout07'
import { Layout08 } from './layout08'

/** Registro de todos os templates selecionáveis no Studio. */
export const TEMPLATE_REGISTRY: Record<TemplateId, VisualTemplate> = {
  mirage: MirageTemplate,
  afterimage: AfterimageTemplate,
  void: VoidTemplate,
  spectrum: SpectrumTemplate,
  t1: Layout01,
  t2: Layout02,
  t3: Template03,
  t4: Template04,
  t5: Template05,
  t6: Layout06,
  t7: Layout07,
  t8: Layout08,
}

export interface TemplateEntry {
  id: TemplateId
  name: string
  description: string
}

const entry = (template: VisualTemplate): TemplateEntry => ({
  id: template.id,
  name: template.name,
  description: template.description,
})

/** Os oito layouts de composição (T1–T8). */
export const LAYOUT_LIST: TemplateEntry[] = [
  entry(Layout01),
  entry(Layout02),
  entry(Template03),
  entry(Template04),
  entry(Template05),
  entry(Layout06),
  entry(Layout07),
  entry(Layout08),
]

/** Estilos/presets artísticos originais, preservados como cenas alternativas. */
export const STYLE_LIST: TemplateEntry[] = [
  entry(MirageTemplate),
  entry(AfterimageTemplate),
  entry(VoidTemplate),
  entry(SpectrumTemplate),
]

export const TEMPLATE_LIST: TemplateEntry[] = [...LAYOUT_LIST, ...STYLE_LIST]
