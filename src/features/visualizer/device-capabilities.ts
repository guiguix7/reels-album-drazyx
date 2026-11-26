/** Leitura única de indícios de capacidade do dispositivo.
 *
 * São indícios, não garantias de todos os recursos — o browser não expõe uso
 * real de memória/GPU e nem sempre relata de forma confiável. Use para escolher
 * perfil e configurações padrão, não para impor limites arbitrários.
 */

export interface DeviceCapabilities {
  /** Indício de RAM do dispositivo (GB). 0 quando não disponível. */
  deviceMemory: number
  /** Número de núcleos lógicos indicado. 0 quando não disponível. */
  hardwareConcurrency: number
  /** Suporte ao WebGL 2 (contexto WebGL2 disponível). */
  webgl2: boolean
  /** Maior tamanho de textura suportado (indício). 0 se não pudermos testar. */
  maxTextureSize: number
  /** Maior tamanho de renderbuffer suportado (indício). 0 se não pudermos testar. */
  maxRenderbufferSize: number
  /** O contexto WebGL nativo suporta antialiasing (indício). */
  antialiasSupported: boolean
  /** O contexto atual suporta render targets half-float. */
  halfFloatSupported: boolean
  /** Amostragens de multisampling que o contexto aceita. */
  sampleCounts: number[]
}

export function readDeviceCapabilities(): DeviceCapabilities {
  const webgl2 = typeof WebGL2RenderingContext !== 'undefined'
  const gl = webgl2 ? getContextWebGL2() : getContextWebGL1()
  const maxTextureSize = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0
  const maxRenderbufferSize = gl ? gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) : 0

  const halfFloatSupported = gl ? isHalfFloatSupported(gl) : false
  const sampleCounts = gl ? supportedSampleCounts(gl) : []

  return {
    deviceMemory: readDeviceMemory(),
    hardwareConcurrency: readHardwareConcurrency(),
    webgl2,
    maxTextureSize,
    maxRenderbufferSize,
    antialiasSupported: !!gl,
    halfFloatSupported,
    sampleCounts,
  }
}

function readDeviceMemory(): number {
  if (typeof navigator === 'undefined') return 0
  return 'deviceMemory' in navigator && typeof (navigator as { deviceMemory?: number }).deviceMemory === 'number'
    ? (navigator as { deviceMemory: number }).deviceMemory
    : 0
}

function readHardwareConcurrency(): number {
  if (typeof navigator === 'undefined') return 0
  return 'hardwareConcurrency' in navigator && typeof (navigator as { hardwareConcurrency?: number }).hardwareConcurrency === 'number'
    ? (navigator as { hardwareConcurrency: number }).hardwareConcurrency
    : 0
}

function getContextWebGL1(): WebGLRenderingContext | null {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null
    return ctx
  } catch {
    return null
  }
}

function getContextWebGL2(): WebGL2RenderingContext | null {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) as WebGL2RenderingContext | null
    return ctx
  } catch {
    return null
  }
}

function isHalfFloatSupported(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true
  }
  const ext = (gl as WebGLRenderingContext).getExtension('OES_texture_half_float')
  return !!ext
}

function supportedSampleCounts(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): number[] {
  const counts: number[] = []
  for (const samples of [0, 2, 4, 8]) {
    if (samples === 0) {
      counts.push(0)
      continue
    }
    const target = gl instanceof WebGL2RenderingContext ? gl.RENDERBUFFER : gl.RENDERBUFFER
    try {
      const rb = gl.createRenderbuffer()
      if (!rb) continue
      gl.bindRenderbuffer(target, rb)
      const internalFormat = gl instanceof WebGL2RenderingContext ? gl.RGBA8 : (gl as WebGLRenderingContext).RGBA
      ;(gl as WebGL2RenderingContext).renderbufferStorageMultisample(target, samples, internalFormat, 1, 1)
      const ok = gl.getError() === gl.NO_ERROR
      gl.deleteRenderbuffer(rb)
      if (ok) counts.push(samples)
    } catch {
      // não conseguiu testar este valor
    }
  }
  return counts
}
