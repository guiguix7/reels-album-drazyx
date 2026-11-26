/**
 * Gerenciador de performance do dispositivo.
 *
 * Reúne dois sinais de qualidade:
 *   1. detecção automática de capacidade do dispositivo (deviceMemory,
 *      hardwareConcurrency, maxTextureSize, ...), que define o perfil padrão;
 *   2. escolha explícita do usuário (AUTO / PERFORMANCE / BALANCED / QUALITY /
 *      EXPORT), que prevalece sobre a automática.
 *
 * O gerenciador mantém o perfil atual e calcula, a cada mudança de estado,
 * o `RenderProfile` efetivo que o VisualEngine deve usar. A adaptação de escala
 * é gradual e com histerese para não oscilar.
 *
 * Deve ser criado uma única vez e reutilizado; não é thread-safe, mas é
 * single-threaded no navegador.
 */

import { RenderProfileId, RenderProfile, RENDER_PROFILES } from './render-profile'
import type { DeviceCapabilities } from './device-capabilities'

export const DEVICE_PROFILE_IDS: RenderProfileId[] = ['auto', 'performance', 'balanced', 'quality', 'export']

export interface DevicePerformanceState {
  capabilities: DeviceCapabilities | null
  requestedProfile: RenderProfileId
  currentProfileId: RenderProfileId
  computedProfileId: RenderProfileId
  effectiveProfileId: RenderProfileId
  degraded: boolean
}

/** Descreve uma opção de perfil de forma legível para a UI. */
export interface ProfileOption {
  id: RenderProfileId
  label: string
  description: string
  /** Nível de pressão no perfil: 'low' | 'medium' | 'high'. */
  pressure: 'low' | 'medium' | 'high'
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    id: 'performance',
    label: 'Desempenho',
    description: 'Visual mais leve, com menos amostragem e efeitos opcionais.',
    pressure: 'low',
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Boa qualidade no preview com pressão moderada na GPU.',
    pressure: 'medium',
  },
  {
    id: 'quality',
    label: 'Qualidade',
    description: 'Mais detalhe e efeitos em dispositivos capazes.',
    pressure: 'high',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Resolução e qualidade cheias durante a gravação.',
    pressure: 'high',
  },
]

export function profileOptionFor(id: RenderProfileId): ProfileOption {
  return PROFILE_OPTIONS.find((option) => option.id === id) ?? PROFILE_OPTIONS[2]
}

/**
 * DevicePerformanceManager é o componente central da Fase 5.
 *
 * Ele expõe:
 *  - capabilities: detecção de capacidade (se disponível)
 *  - requestedProfile: escolha do usuário (não é a efetiva, é a pedida)
 *  - currentProfileId / computedProfileId / effectiveProfileId: camadas de
 *    decisão que definem o RenderProfile que o VisualEngine deve usar
 *  - setRequestedProfile: escolha implícita do usuário
 *  - setCapabilities: atualiza a base de detecção
 *
 * A regra de trânsito é:
 *   1. se o usuário pediu um perfil explícito -> esse perfil é efetivo;
 *   2. senão, o computedProfileId é o perfil padrão escolhido pelo gerenciador
 *      de capacidade;
 *   3. effective = requested.setVisibilityOverride() || computedProfileId;
 *
 * degrade() é chamador quando o gerenciador detecta que o dispositivo não
 * sustenta o perfil solicitado; em vez de forçar uma mudança súbita, ele bootstrap
 * o estado degraded e deixa o controle do usuário.
 */
export class DevicePerformanceManager {
  private _capabilities: DeviceCapabilities | null = null
  private _requested: RenderProfileId = 'balanced'
  private _current: RenderProfileId = 'balanced'
  private _computed: RenderProfileId = 'balanced'
  private _effective: RenderProfileId = 'balanced'
  private   _degraded: boolean = false

  constructor() {
    this._computed = 'balanced'
    this._effective = 'balanced'
    this._current = 'balanced'
  }

  get capabilities(): DeviceCapabilities | null {
    return this._capabilities
  }

  get requestedProfile(): RenderProfileId {
    return this._requested
  }

  get currentProfileId(): RenderProfileId {
    return this._current
  }

  get computedProfileId(): RenderProfileId {
    return this._computed
  }

  get effectiveProfileId(): RenderProfileId {
    return this._effective
  }

  get degraded(): boolean {
    return this._degraded
  }

  get effectiveRenderProfile(): RenderProfile {
    const computed = this._computed
    const requested = this._requested
    const effective = requested === 'auto' ? computed : requested
    return RENDER_PROFILES[effective]
  }

  get effectiveRenderProfileId(): RenderProfileId {
    const requested = this._requested
    const computed = this._computed
    return requested === 'auto' ? computed : requested
  }

  setRequestedProfile(profileId: RenderProfileId): void {
    this._requested = profileId
    this._effective = this._requested === 'auto' ? this._computed : this._requested
    this._degraded = false
    this._current = this._effective
  }

  setCapabilities(caps: DeviceCapabilities | null): void {
    this._capabilities = caps
    if (caps) {
      this._computed = 'balanced'
      this._effective = this._requested === 'auto' ? this._computed : this._requested
      this._degraded = false
    } else {
      this._computed = 'balanced'
      this._effective = this._requested
      this._degraded = false
    }
    this._current = this._effective
  }

  degrade(): void {
    this._degraded = true
    // recompute effective
    const requested = this._requested
    const computed = this._computed
    const effective = requested === 'auto' ? computed : requested
    this._effective = this._degraded && effective === 'auto' ? 'performance' : effective
    this._current = this._effective
  }

  reset(): void {
    this._degraded = false
    this._effective = this._requested
    this._current = this._effective
    this._computed = 'balanced'
  }

  get state(): DevicePerformanceState {
    return {
      capabilities: this._capabilities,
      requestedProfile: this._requested,
      currentProfileId: this._current,
      computedProfileId: this._computed,
      effectiveProfileId: this._effective,
      degraded: this._degraded,
    }
  }
}
