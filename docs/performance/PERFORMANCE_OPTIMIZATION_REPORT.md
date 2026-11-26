# PERFORMANCE OPTIMIZATION REPORT — DRAZYX VISUALIZER STUDIO

Última atualização: 2026-11-26
Branch: `perf/mobile-memory-rendering-optimization`
Base: `feat/product-quality-improvements` HEAD `cebed56`

Este relatório cobre os commits de fase finais da linha de performance, verificando
cada etapa com `tsc --noEmit`, `eslint`, `vitest` e `vite build`. Não inventa medições:
quando um teste ou um run não foi efectuado, o relatório diz isso.

## 1. Estado da linha

| Fase | Commit | Rodada verificada |
|---|---|---|
| 0 — Baseline | `a594f25` | ✅ |
| 1 — Composição/atenção | `353618f` | ✅ |
| 2 — WebGL/GPU | `0a14d97` | ✅ |
| 3 — Áudio/processamento | `6c3c401` | ✅ |
| 4 — Gravação segura | `881bf57` | ✅ |
| 5 — Device profiles | (em andamento) | 🔨 |

## 2. Métricas totais da linha (última verificação)

- `npm run typecheck`: 0 erros
- `npm run lint`: 0 warnings
- `npm run test`: 171/171 testes em 33 arquivos
- `npm run build` (Vite 5.4.21):
  - JS: 856.74 kB
  - Gzip: 236.21 kB
  - Módulos: 149
  - Tempo de build: ~4 s

## 3. O que mudou entre baselines e hoje

A partir dos commits feitos, o bundle aumentou de 844.74 kB → 856.74 kB gzip de
236.21 kB. O aumento é pequeno e está concentrado em:

- indicadores de capacidade do dispositivo (`device-capabilities.ts`);
- perfil de renderização e select (`render-profile.ts`);
- gerenciador de desempenho e UI (`device-performance.ts`, `DevicePerformancePanel.tsx`);
- módulos de gravação segura (`recording-preflight.ts`, `recording.opfs.ts`,
  `recording.store.ts`, `useRecordingFlow.ts`).

Os ganhos de desempenho reais estão na redução do trabalho de execução:

- remoção de reconstrução de compõe durante arraste;
- redução de alocações em atualizações comuns;
- pausa de análise de áudio quando a aba fica invisível;
- single decode compartilhado entre waveform e rítmo;
- agendamento inteligente de renderização idle;
- renderização mais leve quando o perfil o permite (sem FinishPass intermediário,
  MSAA zero, etc.).

## 4. Métricas por sessão

### Fase 0 — Baseline

- Build: 844.74 kB / 232.84 kB gzip, 145 módulos, 4.05 s.
- Testes: 153/153 em 30 arquivos.
- Documentos: `PERFORMANCE_BASELIN.md` e `PERFORMANCE_BOTTLENECKS.md`.

### Fase 1 — Composição/atenção

- `CompositionLayer` suporta atualização incremental; movimento/rotação/opacidade
  reutilizam o `RenderedElement` existente.
- `VisualEngine.setElements` reusa a composição existente.
- Arraste no Stage passa por um único rAF flush; `AudioEngine` pausa análise em aba
  oculta.
- `src/tests/composition-layer.test.ts`: 6 testes novos.
- Resultado global: 159/159 testes em 31 arquivos.

### Fase 2 — WebGL/GPU

- `RenderProfile` com `finishSamples`, `finishHalfFloat`, `finishEnabled`, `antialias`.
- `FinishPass` pode desativar o target intermediário e renderizar direto.
- `VisualEngine` configura renderer, pixel ratio e antialiasing a partir do perfil.
- `beginExport/endExport` aplicam qualidade cheia e reconstruem o FinishPass.
- `webglcontextlost/webglcontextrestored` tratados.
- Agendamento inteligente de renderização por atividade de áudio e instabilidade.
- `src/tests/render-profile.test.ts`: 8 testes novos.
- Resultado global: 167/167 testes em 32 arquivos.

### Fase 3 — Áudio/processamento

- `audio-analysis.ts` com cache compartilhado por URL e buckets.
- `loadWaveformPeaks` e `AudioEngine.detectRhythm()` reutilizam o mesmo decode.
- `clear()` invalida o cache.
- `src/tests/audio-analysis.test.ts`: 4 testes novos.
- Resultado global: 171/171 testes em 33 arquivos.

### Fase 4 — Gravação segura

- `recording-preflight.ts`: estimador de tamanho, memória e níveis.
- `useRecordingFlow.ts`: preflight antes de iniciar gravação; aviso e retorno
  antecipado se o nível não for seguro.
- `recording.store.ts`: suporta `warning`.
- `recording-opfs.ts`: sink opcional para OPFS, opt-in, não usado automaticamente.
- Resultado global: 171/171 testes em 33 arquivos.

### Fase 5 — Device profiles (em andamento)

- `device-performance.ts` e `DevicePerformancePanel.tsx` criados.
- `VisualEngine` convida o gerenciador de desempenho e aplica o perfil efetivo.
- Faltam testes de integração de UI/estado; a fase está em andamento.

## 5. Resultados de CPU/GPU/memória/áudio/gravação

### CPU
- Redução de reconstrução de compõe durante interação.
- `AudioEngine` pausa análise em aba visível/oculta.
- Render idle escalonado: quando não há áudio tocando e a cena está estável, o loop
  continua sem gastar GPU em frames duplicados.

### GPU
- `FinishPass` e o renderer tornam-se profile-aware; dispositivos limitados acabam
  com menos amostragem, target byte e acabamento opcional.
- Export mantém qualidade cheia.

### Memória
- Single decode de áudio por URL.
- Preflight para gravações longas e aviso no store.
- OPFS é opcional e opt-in, não ativado automaticamente.

### Áudio
- Análise de ritmo e waveform usam o mesmo cache, sem decodificar duas vezes.

### Gravação
- O preflight estima memória/tamanho e avisa antes de iniciar gravações longas.
- O formato de exportação continua a mesma; a adaptação não reduz a resolução do
  vídeo final.

## 6. Dispositivos e limitações

- Validação em dispositivo físico ainda não realizada.
- As métricas de frame time e heap snapshot não foram coletadas na versão atual;
  o relatório só contém o bundle, testes e verificação de build.

## 7. Como continuar

- Fase 5: completar a UI e os testes de integração; verificar no navegador.
- Fase 6: medir e melhorar startup (code splitting, cache de chunks).
- Fase 7: testar carga e regressão, gerar o relatório final.
