# Roadmap de Implementação — Retention-Driven Visualizer

Plano de execução derivado do master prompt. Cada fase termina com checks verdes e
um commit próprio; nenhuma fase é declarada concluída apenas por UI pronta.

## Fase 0 — Baseline documentado *(concluída)*

- [x] Auditoria do repositório, templates, áudio, gravação, estado e docs.
- [x] Smoke test no app de produção (carrega, Stage WebGL presente, sem erros de console).
- [x] `npm ci`, lint, typecheck, testes (60/60) e build executados.
- [x] `docs/RETENTION_STRATEGY.md` e este roadmap.
- [x] TASKS/PROGRESS/DECISIONS atualizados.
- Commit: `chore: document retention-focused implementation baseline`.

## Fase 1 — Confiabilidade de áudio, gravação e editor

- Audio lifecycle: contexto único, source node única, URLs revogadas, troca/remoção
  de áudio sem estado fantasma, play/pause/seek consistentes, cleanup e visibility.
- Recording: track de áudio obrigatória, codec dinâmico, chunks, auto-stop,
  cancelamento, preview/download, descarte de URL, gravações repetidas.
- Editor: trechos válidos, bloqueio de mudanças durante REC, estados explícitos,
  duração correta após troca de áudio, preview recuperável.
- Testes unitários para as regras críticas; QA manual de gravação com áudio/vídeo.
- Commit: `fix: harden audio and recording lifecycle`.

## Fase 2 — Hook Engine + Storyboard

- Tipos de cena (`role`, `layoutId`, `visualStyleId`, `transition`, `motionProfile`,
  textos, keyframes, intensidade) e sequência editável.
- Hook Engine com presets A–E, timing 0–5 s e preview de variantes.
- Auto Storyboard a partir de dados reais do áudio, sempre editável.
- Timeline visual sincronizada; preview de cena e do vídeo completo.
- Presets 15 s e 30 s do prompt.
- Commit: `feat: add hook-driven storyboard engine`.

## Fase 3 — Oito layouts + galeria

- Layouts 01–08 conforme especificação, com adaptação real por proporção
  (9:16, 1:1, 16:9), não apenas escala.
- Separação layout × estilo visual; estilos MIRAGE/AFTERIMAGE/VOID/SPECTRUM
  preservados; T3/T4/T5 mapeados explicitamente.
- Galeria com thumbnail, nome, descrição, seleção e preview.
- QA visual de clipping, tipografia, safe areas e sobreposição.
- Commit: `feat: expand visual composition system to eight layouts`.

## Fase 4 — Motion engine avançado *(concluída)*

- [x] Motion profiles DREAM, PULSE, CINEMATIC, FRAGMENT, ORGANIC, INTENSE, MINIMAL.
- [x] Curvas por progresso sobre intensidade, graves, brilho, câmera e partículas,
  com kick de transiente e energia mantendo a cena viva em silêncio.
- [x] Determinismo por seed (`hashSeed` + mulberry32), partículas/capa padrão/glows
  do MIRAGE sem `Math.random`.
- [x] Tempo do visual dirigido pelo relógio do áudio no playback: preview = export
  e seek reverso reconstrói o frame.
- [x] Loop visual até o início do trecho, aplicado no último 8% (sem loop de áudio).
- [x] Seletor de movimento no painel Visual com descrição do perfil.
- Commit: `feat: add advanced audio-reactive motion engine`.

Pendências registradas: análise espectral extra (centroide/flatness) e
sugestões automáticas de seção não foram adicionadas nesta fase; o storyboard
automático continua usando envelope/onsets/pico reais do áudio.

## Fase 5 — Recipes + Batch Creator *(concluída)*

- [x] Recipes ATMOSFERA (30 s, MIRAGE/DREAM), PROCESSO (15 s, T4/CINEMATIC) e
  COMUNIDADE (15 s, T5/PULSE) com hook, copy, layout e visual completos.
- [x] Aplicar recipe gera storyboard editável (sem duplicar vídeos nem inventar arquivos).
- [x] Fila de batch de 3–5 peças em rotação recipe × layout, com status, erro,
  preview de metadados e download por job; configuração original restaurada ao fim.
- [x] Platform profiles TikTok, Reels, Shorts como configuração (formato, fps, CTA, nota).
- Commit: `feat: add creative content recipes and batch exports`.

Pendências registradas: fila limitada a 5 peças (arquitetura suporta mais, UI não
expõe 20–30), sem ZIP/download em massa e sem pausa entre jobs além do
auto-stop do áudio.

## Fase 6 — Persistência local + Retention Lab

- IndexedDB: salvar/carregar/duplicar/renomear/excluir, export/import de projeto.
- Manifest por export (variante, projeto, faixa, trecho, hook, layout, estilo,
  motion, CTA, plataforma, resolução, fps, data).
- Entrada manual/CSV de métricas e dashboard comparativo com definições claras.
- Sem dados inventados, sem misturar denominadores, sem alegar causalidade.
- Commit: `feat: add local project persistence and retention lab`.

## Fase 7 — Performance, qualidade visual e export

- Ciclo de vida Three.js, reuso de recursos, partículas e shaders.
- Perfis draft/standard/export/lightweight sem perder 720p/1080p.
- Auditoria dos 8 layouts nas 3 proporções com screenshots.
- Validação do export: MIME/extensão, áudio presente, duração, seek e cleanup.
- Commit: `perf: optimize rendering and export pipeline`.

## Fase 8 — Regressão final

- Testes de áudio, storyboard, layouts, gravação, performance e integridade do arquivo.
- QA end-to-end completo do prompt (novo projeto → export → persistência → batch → lab).
- README/PROGRESS/TASKS/DECISIONS/docs finais com limitações reais.
- Commit: `test: add comprehensive visualizer regression coverage`.

## Dependências críticas

1. Fase 1 antes de qualquer feature que grave ou altere áudio.
2. Storyboard (2) antes dos layouts multi-cena (3) e recipes (5).
3. Motion (4) depende dos layouts para aplicar perfis por composição.
4. Batch (5) depende de export confiável e recipes.
5. Persistence (6) depois de existir um modelo estável de projeto/variante.
6. Fases 7–8 fecham qualidade; não substituem testes das fases anteriores.
