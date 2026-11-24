# DECISIONS — DRAZYX VISUALIZER STUDIO

Decisões de produto e engenharia que governam a evolução do app.
Tooling de agentes/OpenCode não pertence a este arquivo.

## Produto e escopo

- App local-first: áudio e capa nunca saem do navegador; sem backend obrigatório,
  APIs pagas, analytics ou trackers.
- O fluxo crítico é carregar áudio → visualizar → selecionar trecho → gravar Stage
  com áudio real → baixar arquivo válido. Polimento não substitui esse caminho.
- Nome do produto centralizado em `APP_NAME` (`src/lib/branding.ts`).
- Interface em português; metadados do lançamento em inglês (identidade DRAZYX).

## Estado e UI

- Zustand com uma única store (`features/project/project.store.ts`); sem store paralela.
- CSS Modules + tokens próprios (`styles/tokens.css`); sem biblioteca de componentes.
- Stage WebGL separado da UI; toda tipografia do vídeo é renderizada no canvas.
- Gravidez de layout sem regressão: grid/flex com breakpoints 1180/900/520,
  Stage 9:16 responsivo e transporte com wrap.

## Áudio

- Elemento `<audio>` único + `MediaElementAudioSourceNode` criada uma vez.
- Grafo: source → analyser → monitorGain → destination; source → recDest
  (`MediaStreamAudioDestinationNode`). A gravação captura pós-mix, então mudo
  no monitor não silencia o arquivo.
- Textura/tempo do áudio é a fonte de verdade da timeline e do auto-stop;
  relógio e auto-stop não dependem de rAF (aba oculta continua correta).
- Análise normalizada com smoothing/attack-release e cooldown de transientes.
- BPM é estimativa (autocorrelação de onsets, prior ~110 BPM), não verdade absoluta;
  paleta pode ser automática (extraída da capa) ou manual, sem reconstruir a cena.
- Troca de áudio reseta análise e meta, revoga a Object URL anterior e, em falha de
  decode, limpa o engine (não deixa arquivo antigo “pronto” na UI). Remover áudio
  chama `engine.clear()` + `clearAudio()`; `setAudioMeta` re-clampa o trecho ao novo
  duration e `clearAudio` volta ao default de 30 s.
- `destroy()` desconecta todos os nós e limpa o timer de auto-stop; o resume do
  AudioContext acontece dentro do gesto (`ensureRunning()` antes de `play()`).

## Visual

- Presets visuais atuais: MIRAGE, AFTERIMAGE, VOID, SPECTRUM, TEMPLATE 03/04/05.
- Correções estruturais: `fovForViewHeight` converte radianos para graus
  (THREE.PerspectiveCamera usa graus); textos vivem em z=0 com safe area de 9%;
  `VisualEngine.setTemplate()` limpa a cena (`scene.clear()`) para não herdar meshes
  do template anterior.
- Próxima arquitetura separa layout (geometria/proporção) de estilo visual
  (paleta/luz/textura) e motion profile; T3/T4/T5 serão mapeados explicitamente.
- Referências visuais fornecidas como imagem não estavam acessíveis na auditoria;
  a direção segue as descrições do prompt e será validada com screenshots próprios.

## Gravação e export

- `canvas.captureStream(fps)` + track de áudio real em um único `MediaStream`.
- Codec detectado com `MediaRecorder.isTypeSupported()`; WebM VP9/Opus → VP8/Opus →
  alternativas suportadas. Nunca assumir MP4; extensão e MIME sempre reais.
- Gravação sem track de áudio não é sucesso; stop precisa finalizar o arquivo.
- Auto-stop pelo tempo do áudio; preview e download usam URL temporária revogada.
- `StageRecorder.start()` rejeita gravação sem track de áudio live e, se o clone da
  track falhar, encerra todas as tracks do stream de canvas antes de retornar erro.
- `useRecordingFlow` ignora start concorrente, aborta a finalização após cancelamento
  e o cancelar pausa o áudio e descarta o recorder. Durante REC os painéis de
  configuração ficam desabilitados (fieldset) e o transporte bloqueado; o painel de
  gravação permanece ativo para permitir cancelar.
- 9:16 1080×1920 e 30 fps padrão; 720p e 60 fps como opções.

## Próximas decisões planejadas

- Storyboard: cenas tipadas com `role`, `layoutId`, `visualStyleId`, transição,
  motion profile, textos e keyframes; áudio continua sendo o relógio.
- Motion determinístico por seed; preview deve reproduzir o export e seek reverso
  deve reconstruir o estado correto.
- Persistência em IndexedDB; manifest por export e Retention Lab local com métricas
  manuais/CSV, sem fabricar dados nem alegar causalidade.
- Um commit por fase do master prompt, sempre em `feat/retention-driven-visualizer`.
