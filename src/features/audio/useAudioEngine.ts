import { useSyncExternalStore } from 'react'
import { getAudioEngine } from './AudioEngine'
import type { AudioEngineMeta } from './audio.types'

/** Hook reativo de baixa frequência (status/meta). O frame por atual é lido via getAudioEngine().getFrame(). */
export function useAudioEngineMeta(): { engine: ReturnType<typeof getAudioEngine>; meta: AudioEngineMeta } {
  const engine = getAudioEngine()
  const meta = useSyncExternalStore(engine.subscribe, engine.getMeta)
  return { engine, meta }
}
