import type { TemplateId } from '../../project/project.types'
import type { VisualTemplate } from '../visual.types'
import { MirageTemplate } from './mirage'
import { AfterimageTemplate } from './afterimage'
import { VoidTemplate } from './void'
import { SpectrumTemplate } from './spectrum'
import { Template03 } from './t3'
import { Template04 } from './t4'
import { Template05 } from './t5'

/** Registro de todos os templates selecionáveis no Studio. */
export const TEMPLATE_REGISTRY: Record<TemplateId, VisualTemplate> = {
  mirage: MirageTemplate,
  afterimage: AfterimageTemplate,
  void: VoidTemplate,
  spectrum: SpectrumTemplate,
  t3: Template03,
  t4: Template04,
  t5: Template05,
}

export const TEMPLATE_LIST: Array<{ id: TemplateId; name: string; description: string }> = [
  { id: 'mirage', name: MirageTemplate.name, description: MirageTemplate.description },
  { id: 'afterimage', name: AfterimageTemplate.name, description: AfterimageTemplate.description },
  { id: 'void', name: VoidTemplate.name, description: VoidTemplate.description },
  { id: 'spectrum', name: SpectrumTemplate.name, description: SpectrumTemplate.description },
  { id: 't3', name: Template03.name, description: Template03.description },
  { id: 't4', name: Template04.name, description: Template04.description },
  { id: 't5', name: Template05.name, description: Template05.description },
]
