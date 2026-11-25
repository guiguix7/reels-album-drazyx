import { describe, expect, it } from 'vitest'
import { DEFAULT_PROJECT } from '../features/project/project.defaults'
import { buildBatchFileName, buildBatchJobs, MAX_BATCH_JOBS } from '../features/batch/batch.utils'
import { PLATFORM_PROFILES } from '../features/platform/platform.profiles'

describe('batch creator', () => {
  it('gera a fila em rotação de recipes e layouts', () => {
    const jobs = buildBatchJobs({ base: DEFAULT_PROJECT, count: 3 })
    expect(jobs).toHaveLength(3)
    expect(new Set(jobs.map((job) => job.id)).size).toBe(3)
    expect(jobs[0].recipeId).toBe('atmosphere')
    expect(jobs[1].recipeId).toBe('process')
    expect(jobs[2].recipeId).toBe('community')
    for (const job of jobs) {
      expect(job.config.templateId).toBe(job.layoutId)
      expect(job.config.storyboard.enabled).toBe(true)
      expect(job.config.clipDuration).toBe(DEFAULT_PROJECT.clipDuration)
    }
  })

  it('limita a fila entre 1 e 5 peças', () => {
    expect(buildBatchJobs({ base: DEFAULT_PROJECT, count: 99 })).toHaveLength(MAX_BATCH_JOBS)
    expect(buildBatchJobs({ base: DEFAULT_PROJECT, count: 0 })).toHaveLength(1)
  })

  it('aplica o perfil de plataforma em todo job', () => {
    const jobs = buildBatchJobs({ base: DEFAULT_PROJECT, count: 2, platformId: 'tiktok' })
    for (const job of jobs) {
      expect(job.config.platform).toBe('tiktok')
      expect(job.config.aspectRatio).toBe('9:16')
      expect(job.config.quality).toBe('full')
      expect(job.config.type.ctaText).toBe(PLATFORM_PROFILES.tiktok.ctaText)
    }
  })

  it('nomeia cada arquivo com a variante, sem colidir', () => {
    const jobs = buildBatchJobs({ base: DEFAULT_PROJECT, count: 3 })
    const names = jobs.map((job) =>
      buildBatchFileName({
        job,
        artistName: 'DRAZYX',
        trackTitle: 'WAKE UP (SLOWED + REVERB)',
        clipSeconds: 30,
        extension: 'webm',
      }),
    )
    expect(new Set(names).size).toBe(3)
    for (const name of names) {
      expect(name.startsWith('Drazyx_Wake-Up-Slowed-Reverb_30s_Visualizer_')).toBe(true)
      expect(name.endsWith('.webm')).toBe(true)
    }
  })
})
