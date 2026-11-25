# DECISIONS — DRAZYX VISUALIZER STUDIO

Decisões de produto e engenharia que governam a evolução do app.
Tooling de agentes/OpenCode não pertence a este arquivo.

## 2026-11-25 — Fase 5: elementos editáveis

- A customização usa uma camada declarativa separada do template (`CompositionLayer`): os templates continuam sendo pontos de partida e nenhum elemento original é sobrescrito. O usuário pode cobrir/editar a composição com camadas extras; esconder a tipografia original ainda é feito pelos toggles de Tipografia.
- Elementos vivem em `ProjectConfig.elements`, em porcentagem do palco. O renderer desenha no WebGL (portanto entra na gravação); o overlay HTML só converte gestos em store.
- O overlay suporta texto, capa, forma, waveform e progresso. Player completo e importação de imagem ficam para a fase de music video/expansão; a UI não finge que existem.
- Presets usam `localStorage` e JSON exportável; a mídia nunca é incluída. A ordem do array é a ordem de camadas e vira `renderOrder` explícito.

## 2026-11-25 — Fase 4: composição por formato

- O formato é derivado do aspecto real do palco (`getFormatMode`), não do rótulo da UI: retrato abaixo de 0,8, paisagem acima de 1,2, quadrado no meio.
- Templates recebem tamanhos de capa limitados pela altura (`coverSide`) e reposicionam blocos conforme o formato. Não há escala uniforme de coordenadas de retrato para 16:9.
- Em 16:9, MIRAGE, T6 e T8 usam split editorial (arte de um lado, texto do outro); T4 empilha texto e arte em retrato/quadrado. Em 9:16, T2 troca waveforms laterais por uma waveform larga.
- O fundo de capa ampliada e o dimmer do T3 foram removidos: eram profundidade 2.5D arbitrária sem função narrativa. As rotações de capa restantes são mínimas e não alteram a leitura.

## 2026-11-25 — Fase 3: trecho, waveform e storyboard

- O máximo social é 45 s, mas o projeto nasce com 30 s; `clearAudio` volta a 30 s. A duração padrão não deve consumir o novo máximo sem escolha do usuário.
- `setClipRange(start, end)` é a operação atômica das bordas da waveform. `setClipDuration` calcula o limite a partir de `clipStart`, não como um fim absoluto; isso permite estender o trecho perto do final da faixa.
- A waveform usa picos RMS normalizados calculados no navegador e cacheados por object URL. Nada é enviado a servidor; áudios grandes podem demorar na primeira decodificação.
- O storyboard usa uma timeline de botões (uma cena = um alvo), uma faixa horizontal de cenas e um único inspector. Editar a duração continua redistribuindo as demais cenas porque o total do trecho é fixo.
- Preview de cena e de sequência usam `playClip`; o áudio e o playhead param no fim selecionado.

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
- Oito layouts numerados (T1–T8) separados de quatro estilos visuais
  (MIRAGE/AFTERIMAGE/VOID/SPECTRUM) e do motion profile; T3/T4/T5 continuam
  selecionáveis e mapeados explicitamente.
- Toda `TextLayer` é limitada a 60% da altura do palco em unidades de mundo.
  Sem o limite, em 16:9 o texto cresce junto com a largura e colide com capa e
  metadados; a hierarquia agora é a mesma em 9:16, 1:1 e 16:9.
- A auditoria visual dos oito layouts nas três proporções é feita em contact
  sheet (`docs/qa/layouts-audit.jpg`); screenshots nativos por layout ficam como
  pendência registrada.

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
- O preview reduz a escala de render quando o frame estoura o orçamento, mas a
  gravação sempre renderiza em resolução cheia (`beginVisualExport`/`endVisualExport`).
- O arquivo gerado é validado (tamanho, MIME × extensão, resolução e duração vs.
  trecho) e as inconsistências aparecem como avisos, sem bloquear o download.
- O lote reutiliza o mesmo pipeline da gravação individual, um job por vez, com
  manifest e download próprios; não há ZIP.

## Modos de produção e câmera

- `productionMode: 'social' | 'full'` no `ProjectConfig`. O modo é explícito na UI e não é inferido do
  aspecto: social tem teto de 45 s; full aceita a faixa inteira e usa 16:9 como saída principal.
- `getMaxClipSeconds` centraliza o limite (45 s no social, duração do áudio no full). O store reaplica o
  limite em `setClipDuration`, `setClipRange` e `setAudioMeta`; nenhum desses caminhos pode divergir.
- Ao entrar em full, o trecho vira a faixa inteira e a plataforma volta para `custom`; ao voltar ao
  social, o formato volta a 9:16 e o trecho é reaplicado ao teto. Escolher uma plataforma social também
  força o modo social.
- Player é um elemento declarativo (`type: 'player'`) renderizado no WebGL: capa, título editável,
  progresso e relógio vêm do áudio real; não há valores fabricados.
- Câmera global é opcional (`auto` preserva o template). Presets são poses determinísticas por progresso
  e tempo, aplicadas depois do update do template, com `lookAt` no centro para manter o enquadramento.

## Persistência, histórico e marca

- Autosave usa `localStorage` (configuração pequena, leitura síncrona no boot) e fica separado do
  IndexedDB de projetos. Mídia nunca é serializada; o aviso de recarregar áudio/capa permanece.
- O botão de projeto guarda o id salvo na sessão: o primeiro clique cria, os seguintes sobrescrevem o
  mesmo registro. Duplicar continua criando um id novo.
- Undo/redo é um histórico de snapshots da `ProjectConfig` (40 posições, coalescência de 350 ms), não
  um command log. Isso cobre qualquer editor que passe pelo store e evita armazenar buffers; em troca,
  uma sessão contínua de digitação vira um passo de undo.
- Presets de marca são globais e guardam somente decisões reutilizáveis (paleta, visual, flags/medidas
  tipográficas, CTA, template, aspecto, câmera e elementos). Artista, faixa e álbum ficam no projeto.
- A restauração do autosave limpa o histórico para não transformar o boot em um passo de undo.

## Storyboard, persistência e processo

- Storyboard: cenas tipadas com `role`, `layoutId`, `visualStyleId`, transição,
  motion profile, textos e keyframes; áudio continua sendo o relógio. Presets
  15/30 s e geração automática usam envelope/onsets/pico reais do trecho.
- Motion determinístico por seed (`hashSeed` + mulberry32); preview reproduz o
  export e seek reverso reconstrói o frame. Loop visual fecha no início do trecho,
  sem prometer loop de áudio.
- Persistência em IndexedDB (projetos/exports/métricas); manifest por export e
  Retention Lab local com métricas manuais/CSV, sem fabricar dados nem alegar
  causalidade. Áudio e capa não são persistidos (Object URLs da sessão).
- Um commit por fase do master prompt, sempre em `feat/retention-driven-visualizer`;
  nenhuma fase é declarada concluída apenas por UI pronta, e limitações reais
  ficam registradas em PROGRESS/TASKS/roadmap.
