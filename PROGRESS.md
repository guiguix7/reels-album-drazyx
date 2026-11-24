# PROGRESS — DRAZYX VISUALIZER STUDIO

Última atualização: 2026-11-24

## Estado atual

MVP original (Fases 0–5) implementado. Evolução retention-driven: Fases 0, 1, 2, 3, 4 e 5
do novo master prompt concluídas na branch `feat/retention-driven-visualizer`
(baseline documentado, hardening de áudio/gravação/editor, storyboard com hook engine,
oito layouts de composição, motion engine com perfis determinísticos e
recipes/batch creator com perfis de plataforma).

## Plano de riscos identificado na Fase 0

- OneDrive pode interferir com watchers do Vite — monitorar; se falhar, rodar fora da pasta sincronizada.
- MediaRecorder/captureStream exige Chrome/Edge; Firefox tem suporte parcial; Safari limitado (registrar no README).
- Resolução de export 1080×1920 pode pesar em GPUs fracas — modo 720×1280 disponível.
- Referências de vídeo (YouTube) não pôde ser reproduzido pelo agente — direção visual seguiu o texto do PROMPT.md + imagens fornecidas pelo usuário.
- Sem áudio real do usuário nesta sessão: QA de gravação usou arquivo de teste gerado localmente quando possível; instruções de validação manual documentadas no README.

## Decisões técnicas (resumo; detalhes em DECISIONS.md)

- Estado: Zustand (single store) — `features/project/project.store.ts`.
- Templates = presets visuais selecionáveis: MIRAGE, AFTERIMAGE, VOID, SPECTRUM, TEMPLATE 03, TEMPLATE 04, TEMPLATE 05 (favoritos do usuário da imagem de wireframes).
- Tipografia do vídeo renderizada dentro do canvas (CanvasTexture) para garantir captura na gravação.
- Áudio: elemento `<audio>` único + MediaElementSource único; grafo: source → analyser → monitorGain → destination e source → recDest (MediaStreamAudioDestinationNode). Gravação sempre pós-mix pré-monitor (mudo no monitor não silencia o arquivo).
- Gravação: MediaRecorder com codec detection; tempo de áudio como fonte de verdade; auto-stop no fim do trecho.
- UI: CSS Modules + tokens.css; sem biblioteca de componentes.
- Paleta: modos `auto` (extraída da capa) e `manual`; a cor é aplicada por frame nos materiais/templates, sem reconstruir a cena a cada ajuste.
- Ritmo: BPM estimado por autocorrelação de onsets com prior em ~110 BPM (evita erro de oitava); `beatPhase`/`beatPulse` no `AudioFrame` alimentam os templates junto com bandas e transientes.

## Log de execução

- 2026-11-13 — Fase 0 concluída: inspeção, ambiente (Node v25, npm 11.6.2), PROMPT.md salvo, TASKS.md/PROGRESS.md criados.
- 2026-11-13 — Fase 1 concluída: esqueleto Vite+React+TS, tokens, layout de estúdio, Stage 9:16, build/typecheck verdes.
- 2026-11-13 — Fase 2 concluída: AudioEngine completo (upload, playback, seek, analyser, bandas, transientes, estados, seleção de trecho).
- 2026-11-13 — Fase 3 concluída: VisualEngine Three.js + 7 templates (MIRAGE, AFTERIMAGE, VOID, SPECTRUM, T3, T4, T5) + pass de acabamento + troca de template na UI.
- 2026-11-13 — Fase 4 concluída: Recorder com MediaRecorder + canvas stream + audio stream, auto-stop, preview, download.
- 2026-11-13 — Fase 5 concluída: testes Vitest, lint/typecheck/test/build verdes, README.md, QA manual via navegador, relatório final.
- 2026-11-24 — Paleta automática da capa + modo manual de cores e detecção de ritmo (BPM): novos módulos `features/palette/palette.ts` e `features/audio/rhythm.ts`, painel Paleta, pulso de batida nos 7 templates, BPM exibido no painel Fonte, 14 testes novos (60 no total). QA: capa real (paleta dessaturada coerente), capa sintética azul/magenta (`#628CE7`/`#AE1F64`), troca manual para verde, volta ao automático; BPM 93 detectado no WAV "Wake Up".
- 2026-11-23 — Revisão e correções: painéis do editor encolhiam e cortavam conteúdo (flex-shrink); relógio do transporte e auto-stop do trecho deixaram de depender de rAF (aba oculta); setClipDuration não trava mais depois de uma redução; duração do preview WebM; README preenchido; tipografia do T4 e painéis do T5 sem sobreposição; capa fantasma do T3 mais discreta; estado vazio do Stage compacto. QA real: áudio WAV 02:27 + capa JPG, gravação de 5s gerando WebM 1080×1920 com VP9+Opus.
- 2026-11-24 — Fase 0 retention-driven concluída: auditoria do repo e templates, smoke no app de produção (carrega com canvas e sem erros de console), branch `feat/retention-driven-visualizer`, `npm ci` + lint + typecheck + test (60/60) + build verdes, `docs/RETENTION_STRATEGY.md` e `docs/IMPLEMENTATION_ROADMAP.md` criados, TASKS/DECISIONS atualizados; commit de baseline `chore: document retention-focused implementation baseline`.
- 2026-11-24 — Fase 3 retention-driven concluída: oito layouts de composição distintos — T1 CENTERED HERO, T2 STEREO FRAME, T3 OFFSET CINEMA, T4 EDITORIAL COVER, T5 ALBUM PLAYER SPLIT (capa + painel de player com progresso real do trecho, empilhado em 9:16 e lado a lado em 1:1/16:9), T6 VERTICAL TOTEM, T7 SYMMETRIC SPECTRUM e T8 MONOCHROME FOCUS. MIRAGE/AFTERIMAGE/VOID/SPECTRUM permanecem selecionáveis como estilos. Galeria reorganizada em dois grupos com miniaturas esquemáticas por layout. `FFTBars` ganhou direção horizontal em colunas e `flipY` em linhas. Checks: typecheck + lint + 77 testes + build verdes; revisão visual das 3 proporções fica registrada para a Fase 7.
- 2026-11-24 — Fase 2 retention-driven concluída: `features/storyboard/` com tipos de cena (papel, layout, paleta, transição, movimento, keyframes), hooks emocional/curiosidade/áudio-primeiro/interrupção/revelação, presets 15 s e 30 s reescalados para o trecho real, geração automática a partir de `analyzeClipAudio` (envelope RMS + onsets + pico, sem inventar eventos), edição completa de cenas com timeline/playhead e preview por cena; o `VisualEngine` consome a cena ativa e aplica transições sem sair do tempo do áudio. Checks: typecheck + lint + 73 testes + build verdes.
- 2026-11-24 — Fase 5 retention-driven concluída: três recipes (ATMOSFERA, PROCESSO, COMUNIDADE) que aplicam hook, storyboard editável, layout, visual, motion e copy; perfis de plataforma TikTok/Reels/Shorts (9:16, 1080, 30 fps, CTA e nota de safe area) aplicados ao projeto; Batch Creator que gera 3–5 variações em rotação recipe × layout e grava em sequência com o mesmo pipeline (Stage + áudio real), status por job, preview/download individual e restauração da configuração original. Checks: typecheck + lint + 95 testes + build verdes.
- 2026-11-24 — Fase 4 retention-driven concluída: motion engine com sete perfis (DREAM, PULSE, CINEMATIC, FRAGMENT, ORGANIC, INTENSE, MINIMAL), curvas por progresso do trecho, kick de transiente e ruído determinístico por seed; o tempo do visual passa a ser o tempo do áudio durante o playback (seek reverso reconstrói o frame e o export reproduz o preview); partículas, capa padrão e glows do MIRAGE deixaram de depender de `Math.random`; toggle de loop visual fecha a composição no início do trecho (sem prometer loop de áudio); seletor de movimento no painel Visual. Checks: typecheck + lint + 85 testes + build verdes.
- 2026-11-24 — Fase 1 retention-driven concluída: AudioEngine ganhou `clear()`/`resetAnalysis()`/timer de auto-stop limpo no destroy, remoção real de áudio e falha de decode consistente; StageRecorder exige track de áudio live e não vaza tracks; `useRecordingFlow` protege cancelamento e start concorrente; store re-clampa o trecho ao trocar de áudio; painéis e transporte bloqueados durante REC. Checks: lint + typecheck + test (61/61) + build verdes. Manual QA de gravação fica para a Fase 8 (matriz de regressão).
