import * as THREE from 'three'

/** Fundo em shader: gradiente vertical + glow radial deslocável + ruído sutil. */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uGlow;
uniform vec2 uGlowPos;
uniform float uGlowStrength;
uniform float uNoise;
uniform float uTime;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 col = mix(uBottom, uTop, vUv.y);
  vec2 d = vUv - uGlowPos;
  d.x *= 0.5625; // correção de aspecto aproximada (9:16), glow levemente elíptico
  col += uGlow * uGlowStrength * exp(-dot(d, d) * 6.0);
  float n = hash(vUv * 220.0 + floor(uTime * 8.0) * 13.0) - 0.5;
  col += vec3(n) * uNoise;
  gl_FragColor = vec4(col, 1.0);
}
`

export class GradientBackground {
  readonly mesh: THREE.Mesh
  private material: THREE.ShaderMaterial

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTop: { value: new THREE.Color('#0d0a18') },
        uBottom: { value: new THREE.Color('#070810') },
        uGlow: { value: new THREE.Color('#4a2a7a') },
        uGlowPos: { value: new THREE.Vector2(0.5, 0.62) },
        uGlowStrength: { value: 0.55 },
        uNoise: { value: 0.02 },
        uTime: { value: 0 },
      },
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material)
    this.mesh.position.z = -6
    this.mesh.renderOrder = -10
  }

  /** dimensiona para cobrir a viewport na profundidade do plano. */
  resize(viewWidth: number, viewHeight: number, planeZ: number, cameraZ: number): void {
    const factor = (cameraZ - planeZ) / cameraZ
    const width = viewWidth * factor * 1.15
    const height = viewHeight * factor * 1.15
    this.mesh.scale.set(width, height, 1)
  }

  setColors(top: string, bottom: string, glow: string): void {
    ;(this.material.uniforms.uTop.value as THREE.Color).set(top)
    ;(this.material.uniforms.uBottom.value as THREE.Color).set(bottom)
    ;(this.material.uniforms.uGlow.value as THREE.Color).set(glow)
  }

  update(time: number, glowStrength: number, glowX: number): void {
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uGlowStrength.value = glowStrength
    ;(this.material.uniforms.uGlowPos.value as THREE.Vector2).set(0.5 + glowX, 0.6)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh)
  }
}
