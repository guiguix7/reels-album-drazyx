# TASKS — DRAZYX VISUALIZER STUDIO

## Melhoria de produto (2026-11-25)

- [x] Fase 0 — Baseline: branch `feat/product-quality-improvements`, `npm ci` + lint + typecheck + 117 testes + build verdes, produção reconciliada (`index-DZ5U_6t5.js`), `docs/IMPROVEMENT_BASELINE.md`
- [x] Fase 1 — Correções críticas: 8 layouts selecionáveis, Stage com razão medida, MIRAGE sem colisão, validação única de áudio curto e empty state fora do palco — 129 testes verdes
- [x] Fase 2 — Workspace/onboarding: CTA persistente de gravação, guia de 5 passos, descrições e grupos no Visual, tipografia/alvos/contraste, chrome compacto — validação DOM desktop/mobile
- [x] Fase 5 — Elementos editáveis: overlay WebGL com texto/capa/forma/waveform/progresso, seleção e drag no Stage, inspetor, camadas, presets locais e import/export JSON — 137 testes
- [x] Fase 4 — Composições por formato: modo retrato/quadrado/paisagem, capas limitadas pela altura, layouts editoriais específicos (MIRAGE/T4/T6/T8/AFTERIMAGE/SPECTRUM), T2 e T6 sem laterais apertadas em retrato, remoção do fundo 2.5D do T3 — 135 testes
- [x] Fase 3 — Storyboard/trecho: 45 s, preset 45 s, waveform com seleção arrastável, timeline clicável, inspector único, preview por cena/sequência com parada no fim — 133 testes

Fluxo-alvo: carregar áudio → visualizar → selecionar até 45 s → gravar → baixar vídeo com áudio.

## Fase 0 — Inspeção e planejamento
- [x] Ler PROMPT.md (salvo na raiz) e AGENTS.md
- [x] Inspecionar repositório (package.json preenchido; sem src/, sem index.html/tsconfig/vite config)
- [x] Ler pasta .opencode/ (apenas tooling OpenCode: conductor.md + skills; nada de produto)
- [x] Verificar ambiente: Node v25.0.0, npm 11.6.2, Windows
- [x] Registrar referências visuais e templates favoritos do usuário (3, 4, 5) + requisito de troca de template
- [x] Plano e riscos documentados em PROGRESS.md

## Fase 1 — Estrutura e identidade
- [x] Config de projeto: tsconfig.json, tsconfig.node.json, vite.config.ts, vitest.config.ts, eslint.config.js, .gitignore
- [x] index.html com fontes (Space Grotesk / Inter) e fallbacks
- [x] tokens.css (paleta Drazyx) + globals.css
- [x] main.tsx + App.tsx + app.css (layout estúdio: TopBar, Stage central 9:16, painéis laterais, transport bar)
- [x] Componentes shell/panels/transport/feedback com CSS Modules
- [x] project.types / project.defaults / project.store (Zustand)
- [x] lib/format-time.ts, lib/file-validation.ts, lib/browser-capabilities.ts
- [x] Stage canvas 9:16 independente dos controles
- [x] build + typecheck passando

## Fase 2 — Áudio funcional
- [x] AudioEngine: upload, decode via <audio> element, play/pause/seek, metadados
- [x] AnalyserNode fftSize 2048: freq, waveform, RMS, bandas (bass/mid/treble), transientes com cooldown
- [x] Suavização attack/release + normalização 0–1
- [x] MediaElementAudioSourceNode única; grafo com monitor gain + MediaStreamAudioDestinationNode
- [x] Estados idle/loading/ready/playing/paused/error; object URLs revogados
- [x] TransportBar com timeline, seleção de trecho (clipStart/clipEnd, padrão 30 s), volume de monitoração
- [x] Waveform/níveis na UI

## Fase 3 — Motor visual e templates
- [x] VisualEngine (Three.js): renderer, câmera, RAF com delta time, resize, dispose
- [x] Texturas de texto via CanvasTexture (tipografia dentro do canvas → entra na gravação)
- [x] Template MIRAGE (padrão): fundo, névoa, partículas com bass, capa flutuante, anéis espectrais, tipografia
- [x] Templates AFTERIMAGE, VOID, SPECTRUM com composições distintas
- [x] Templates T3, T4, T5 baseados nos wireframes favoritos do usuário (troca selecionável)
- [x] Parâmetros de cena: intensidade, partículas, força de graves, glow, grain, velocidade de câmera, glitch
- [x] Pass de acabamento: grain, vignette, aberração cromática sutil
- [x] Capa padrão procedural + upload de capa com CanvasTexture

## Fase 4 — Gravação real
- [x] Recorder: canvas.captureStream(fps) + audio track (MediaStreamAudioDestinationNode)
- [x] Seleção de codec com isTypeSupported (VP9/Opus → VP8/Opus → webm → mp4 se houver)
- [x] Fluxo: seek para clipStart → iniciar REC + playback → auto-stop em clipEnd (relógio do áudio)
- [x] Preview + download com mime/extensão corretos; revogar URLs
- [x] Liberação de tracks; bloqueio de controles durante REC

## Fase 5 — Polimento e QA
- [x] Testes unitários Vitest (format-time, file-validation, audio.utils, recorder.utils, defaults)
- [x] lint + typecheck + test + build executados e passando
- [x] README.md em português (instalação, uso, gravação, formatos, limitações)
- [x] Revisão de safe areas 9:16, acessibilidade básica, prefers-reduced-motion
- [x] QA manual do fluxo completo via navegador (playback, templates, gravação, download)
- [x] Relatório final com limitações

## Plano Retention-Driven (master prompt)

- [x] Fase 0 — Baseline: auditoria, smoke no deploy, checks verdes, docs de estratégia e roadmap, commit `chore: document retention-focused implementation baseline`
- [x] Fase 1 — Hardening de áudio, gravação e estado do editor: AudioEngine.clear/resetAnalysis/clipTimer, track de áudio obrigatória, cancelamento seguro, re-clamp do trecho, UI bloqueada durante REC — commit `fix: harden audio and recording lifecycle`
- [x] Fase 2 — Hook Engine + Storyboard editável: hooks A–E, presets 15/30 s, auto storyboard por análise offline do trecho, edição de cenas (adicionar, duplicar, remover, mover, duração, layout, paleta, transição, movimento, intensidade, texto), timeline com playhead e preview por cena — commit `feat: add hook-driven storyboard engine`
- [x] Fase 3 — 8 layouts distintos + galeria: T1 CENTERED HERO, T2 STEREO FRAME, T3 OFFSET CINEMA, T4 EDITORIAL COVER, T5 ALBUM PLAYER SPLIT (progresso real + empilhamento em 9:16), T6 VERTICAL TOTEM, T7 SYMMETRIC SPECTRUM, T8 MONOCHROME FOCUS; MIRAGE/AFTERIMAGE/VOID/SPECTRUM preservados como estilos; galeria com miniaturas esquemáticas e grupos — commit `feat: expand visual composition system to eight layouts`
  - QA visual dedicado dos 8 layouts nas 3 proporções fica para a Fase 7 (revisão de clipping/safe areas).
- [x] Fase 4 — Motion engine avançado + loop visual — perfis DREAM/PULSE/CINEMATIC/FRAGMENT/ORGANIC/INTENSE/MINIMAL, curvas por progresso, seed determinística, tempo do visual no relógio do áudio e fechamento de loop — commit `feat: add advanced audio-reactive motion engine`
- [x] Fase 5 — Recipes + Batch Creator + platform profiles — recipes ATMOSFERA/PROCESSO/COMUNIDADE, perfis TikTok/Reels/Shorts aplicados ao formato e CTA, fila de 3–5 peças gravada em sequência com download por job — commit `feat: add creative content recipes and batch exports`
  - O lote baixa um arquivo por vez (link por job); não há ZIP nem download automático em massa.
- [x] Fase 6 — Persistência local + Retention Lab — IndexedDB (projetos/exports/métricas), JSON versionado, manifest por export, entrada manual e CSV de métricas com taxas de denominador real — commit `feat: add local project persistence and retention lab`
  - Áudio e capa não são salvos: são Object URLs da sessão; recarregue após abrir um projeto.
- [x] Fase 7 — Performance, QA visual e export — perfis de render + resolução adaptativa no preview, export em resolução cheia via `beginExport`/`endExport`, validação de arquivo/duração, auditoria visual 8 layouts × 3 proporções em `docs/qa/layouts-audit.jpg` e limite tipográfico por altura do palco — commit `perf: optimize rendering and export pipeline`
  - QA visual em contact sheet único (sem screenshots nativos por layout); codecs não foram re-testados e não houve benchmark em GPU fraca.
- [x] Fase 8 — Regressão final + documentação — `text-metrics` testável, regressão de safe area/lote/CSV (117 testes), README com recipes/storyboard/movimento/lote/persistência/Retention Lab/limitações e QA real do fluxo individual (WAV → trecho de 5 s → WebM 1080×1920 com áudio, 5,16 s, manifest no IndexedDB) — commit `test: add comprehensive visualizer regression coverage`
  - Lote completo e round-trip visual do Retention Lab não foram re-executados nesta rodada; codecs não foram re-testados e não houve benchmark em GPU fraca.

## Plano Product Quality (master prompt)

- [x] Fase 0 — Baseline e reconciliação do repositório — commit `chore: establish product improvement baseline`
- [x] Fase 1 — Correções críticas de template, Stage, MIRAGE, áudio curto e estado vazio — commit `fix: resolve critical template and rendering issues`
- [x] Fase 2 — Workspace, onboarding, ação de gravação persistente, tipografia e alvos — commit `feat: improve editor workspace and onboarding UX`
- [x] Fase 3 — Storyboard e seleção de trecho por waveform, limite social de 45 s — commit `feat: redesign storyboard and audio clip selection`
- [x] Fase 4 — Composições específicas para 9:16, 1:1 e 16:9 — commit `feat: introduce format-specific visual compositions`
- [x] Fase 5 — Elementos editáveis no Stage, inspetor, camadas e presets de composição — commit `feat: add comprehensive UI composition editing`
- [x] Fase 6 — Modo Music video 16:9 com faixa inteira, player opcional e presets de câmera — commit `feat: introduce full-length landscape music video mode`
  - A gravação real validada foi de 8 s em 1920×1080; a faixa completa de 02:27 e o comportamento de memória em gravações muito longas não foram medidos.
- [ ] Fase 7 — Persistência de projeto com autosave, undo/redo e presets de marca
- [ ] Fase 8 — QA final, screenshots de todos os formatos, export longo real e release verificável

- [x] Fase 7 — Persistência e presets criativos: autosave local com restauração, salvar/sobrescrever projeto, undo/redo com Ctrl/Cmd+Z e presets de marca — commit `feat: add project persistence and creative presets`
  - Autosave e histórico guardam somente configuração; áudio/capa são recarregados a cada sessão. Presets de marca não têm import/export próprio.
