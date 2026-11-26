import * as THREE from 'three'

/** Pass de acabamento: cena → render target (linear) → quad final com
 * aberração cromática, grain, vignette, scanlines e glitch controlado,
 * convertendo para sRGB na saída.
 *
 * O custo pode ser reduzido pelo perfil de renderização: sem MSAA, sem
 * half-float e, no limite, sem o pass intermediário (renderização direta no
 * canvas). A qualidade de export mantém o caminho completo.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGrain;
uniform float uVignette;
uniform float uChroma;
uniform float uScan;
uniform float uGlitch;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 linearToSRGB(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

void main() {
  vec2 uv = vUv;

  if (uGlitch > 0.001) {
    float band = floor(uv.y * 28.0);
    float r1 = hash(vec2(band, floor(uTime * 13.0)));
    if (r1 > 0.82) {
      float r2 = hash(vec2(band, floor(uTime * 13.0) + 7.0));
      uv.x += (r2 - 0.5) * 0.035 * uGlitch;
    }
  }

  vec2 center = uv - 0.5;
  float r2 = dot(center, center);
  vec2 offset = center * uChroma * r2 * 2.4;

  vec3 col;
  col.r = texture2D(tDiffuse, uv + offset).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - offset).b;

  col *= 1.0 - uScan * 0.10 * (0.5 + 0.5 * sin(uv.y * 760.0 + uTime * 2.0));
  col *= 1.0 - uVignette * smoothstep(0.18, 0.85, r2) * 0.85;

  float grain = hash(uv * vec2(1483.0, 967.0) + fract(uTime) * 41.7) - 0.5;
  col += grain * uGrain * 0.06;

  gl_FragColor = vec4(linearToSRGB(col), 1.0);
}
`

export interface FinishParams {
  time: number
  grain: number
  vignette: number
  chroma: number
  scan: number
  glitch: number
}

export interface FinishPassOptions {
  /** Amostragem do render target. 0 = sem MSAA. */
  samples: number
  /** Tipo do render target. */
  type: 'half-float' | 'byte'
}

export class FinishPass {
  private renderer: THREE.WebGLRenderer
  private target: THREE.WebGLRenderTarget
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private mesh: THREE.Mesh
  private width: number
  private height: number
  private readonly type: number
  private readonly samples: number
  private enabled: boolean

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number, options: FinishPassOptions) {
    this.renderer = renderer
    this.width = width
    this.height = height
    this.samples = options.samples
    this.type = options.type === 'half-float' ? THREE.HalfFloatType : THREE.UnsignedByteType
    this.enabled = true

    this.target = new THREE.WebGLRenderTarget(width, height, {
      type: this.type as unknown as THREE.TextureDataType,
      samples: this.samples,
    })
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uGrain: { value: 0.3 },
        uVignette: { value: 0.35 },
        uChroma: { value: 0.0015 },
        uScan: { value: 0.2 },
        uGlitch: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.scene.add(this.mesh)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.target.setSize(width, height)
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, params: FinishParams): void {
    const u = this.material.uniforms
    u.uTime.value = params.time
    u.uGrain.value = params.grain
    u.uVignette.value = params.vignette
    u.uChroma.value = params.chroma
    u.uScan.value = params.scan
    u.uGlitch.value = params.glitch

    if (!this.enabled) {
      this.renderer.setRenderTarget(null)
      this.renderer.clear()
      this.renderer.render(scene, camera)
      return
    }

    this.renderer.setRenderTarget(this.target)
    this.renderer.clear()
    this.renderer.render(scene, camera)

    u.tDiffuse.value = this.target.texture
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.target.dispose()
    this.material.dispose()
    this.mesh.geometry.dispose()
    this.scene.clear()
  }
}
