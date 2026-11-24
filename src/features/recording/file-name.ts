/** Sanitiza um segmento de nome de arquivo: remove acentos, símbolos e espaços viram hífens. */
export function sanitizeSegment(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Padrão do produto: "Drazyx_Wake-Up_Slowed-Reverb_30s_Visualizer.webm".
 * Capitaliza cada palavra do segmento ("Wake-Up-Slowed-Reverb"). */
function prettify(input: string): string {
  const clean = sanitizeSegment(input)
  if (!clean) return ''
  return clean
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join('-')
}

/**
 * Padrão do produto: "Drazyx_Wake-Up_Slowed-Reverb_30s_Visualizer.webm".
 * Usar '_' entre blocos e '-' dentro de cada bloco.
 */
export function buildRecordingFileName(options: {
  artistName: string
  trackTitle: string
  clipSeconds: number
  extension: string
}): string {
  const artist = prettify(options.artistName) || 'Visualizer'
  const track = prettify(options.trackTitle) || 'Track'
  const seconds = Math.round(options.clipSeconds)
  const ext = options.extension.replace(/^\./, '') || 'webm'
  return `${artist}_${track}_${seconds}s_Visualizer.${ext}`
}
