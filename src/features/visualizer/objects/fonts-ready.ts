/** Fontes web para canvas — TextLayers redesenham quando ficarem prontas. */

let ready = false
let started = false
const callbacks = new Set<() => void>()

function flush(): void {
  ready = true
  callbacks.forEach((cb) => cb())
  callbacks.clear()
}

export function onFontsReady(cb: () => void): () => void {
  if (ready) {
    cb()
    return () => undefined
  }
  callbacks.add(cb)
  start()
  return () => callbacks.delete(cb)
}

function start(): void {
  if (started) return
  started = true
  // Em jsdom/testes não há document.fonts — não quebra.
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!fonts) {
    ready = true
    return
  }
  const wanted = ['700 16px "Space Grotesk"', '500 16px "Space Grotesk"', '400 16px Inter', '600 16px Inter']
  Promise.all(wanted.map((spec) => fonts.load(spec).catch(() => undefined)))
    .then(() => fonts.ready)
    .then(() => flush())
    .catch(() => flush())
  // Segurança: se as fontes externas falharem, segue com fallback local.
  window.setTimeout(() => {
    if (!ready) flush()
  }, 2500)
}
