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

## Fase 6 — Persistência local + Retention Lab *(concluída)*

- [x] IndexedDB (projetos, exports, métricas): salvar/carregar/duplicar/renomear/excluir.
- [x] Export/import de projeto em JSON com schema versionado e merge de defaults.
- [x] Manifest por export com variante, hook, layouts, motion, CTA, plataforma,
  resolução, fps, trecho e data; gravado na gravação individual e em cada job do lote.
- [x] Retention Lab com entrada manual e CSV (`,`/`;`, cabeçalhos PT/EN), taxas
  calculadas só com denominador real e tempo médio ponderado por views.
- [x] Sem coleta automática, sem dados inventados e sem afirmar causalidade.
- Commit: `feat: add local project persistence and retention lab`.

Limitações registradas: áudio/capa não são persistidos (Object URLs da sessão),
não há gráficos históricos nem filtros avançados, e o CSV não carrega contexto de
plataforma/hook/layout — o contexto vem do projeto no momento da importação.

## Fase 7 — Performance, qualidade visual e export *(concluída)*

- [x] Ciclo de vida Three.js: engine é destruída/reconstruída com `dispose`, texturas e
  materiais seguem sendo liberados pelos templates; nenhum recurso novo persistente.
- [x] Perfis draft/standard/export/lightweight e `AdaptiveResolution`: no preview a
  escala de render cai quando o frame estoura o orçamento; no export volta a 1.0.
- [x] Export em resolução cheia via `beginExport()`/`endExport()` no registry da engine,
  usado pela gravação individual e por cada job do lote.
- [x] Auditoria dos 8 layouts nas 3 proporções em `docs/qa/layouts-audit.jpg`
  (contact sheet 8×3); texto limitado a 60% da altura do palco, T2/T4/T6 reempilhados
  e capas de T3/T4 limitadas pela altura.
- [x] Validação do export: arquivo não vazio, MIME × extensão e duração do vídeo contra
  o trecho, exibidos como avisos no painel de gravação (sem bloquear o download).
- Commit: `perf: optimize rendering and export pipeline`.

Limitações registradas: a auditoria visual usou um contact sheet único, sem screenshot
nativo por layout; codecs não foram re-testados após as mudanças e não houve medição de
performance em GPU fraca. A presença de faixa de áudio continua garantida pelo pipeline
(track live obrigatória), não por inspeção do container gravado.

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
