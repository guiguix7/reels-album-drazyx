# TASKS — DRAZYX VISUALIZER STUDIO

Fluxo-alvo: carregar áudio → visualizar → selecionar 30 s → gravar → baixar vídeo com áudio.

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
- [ ] Fase 3 — 8 layouts distintos + galeria — commit `feat: expand visual composition system to eight layouts`
- [ ] Fase 4 — Motion engine avançado + loop visual — commit `feat: add advanced audio-reactive motion engine`
- [ ] Fase 5 — Recipes + Batch Creator + platform profiles — commit `feat: add creative content recipes and batch exports`
- [ ] Fase 6 — Persistência local + Retention Lab — commit `feat: add local project persistence and retention lab`
- [ ] Fase 7 — Performance, QA visual e export — commit `perf: optimize rendering and export pipeline`
- [ ] Fase 8 — Regressão final + documentação — commit `test: add comprehensive visualizer regression coverage`
