# DRAZYX VISUALIZER STUDIO

Estúdio web local-first para criar visualizers musicais cinematográficos e gravar vídeos verticais
(9:16, 1:1 ou 16:9) com o áudio sincronizado. O primeiro preset é **Drazyx — WAKE UP (SLOWED + REVERB)**,
do álbum **MY MIRAGE (WAKE UP REMIXES)**.

Áudio e capa nunca saem do navegador: não há backend, upload, analytics ou chamada a API paga.

## Requisitos

- Node.js 18+ e npm.
- Navegador desktop atual: **Chrome ou Edge** (recomendado). Firefox e Safari têm suporte parcial a
  `MediaRecorder`/codecs e são tratados como compatibilidade progressiva.

## Instalação e execução

```bash
npm install
npm run dev      # abre em http://localhost:5173
```

Outros scripts:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript estrito, sem emitir
npm run test       # Vitest (unitários)
npm run build      # build de produção em dist/
npm run preview    # serve o build
```

## Fluxo de uso

1. **Fonte** → carregue o áudio (MP3, WAV, OGG, M4A, AAC, FLAC) e a capa (JPG, PNG, WEBP, GIF, AVIF).
   Sem capa, o Stage usa uma arte padrão gerada localmente.
2. **Template** → escolha entre MIRAGE (padrão), AFTERIMAGE, VOID, SPECTRUM e TEMPLATES 03/04/05.
   A troca é imediata e não perde o áudio carregado.
3. **Trecho do vídeo** → defina início e duração (máximo 30 s, mínimo 5 s).
4. **Visual / Tipografia** → intensidade, partículas, força do grave, brilho, grão, câmera e glitch;
   textos de artista, faixa, álbum, CTA e tagline — todo texto é desenhado dentro do canvas do Stage.
5. **Formato** → proporção (9:16 padrão), resolução (1080×1920 ou 720×1280) e FPS (30 para export).
6. **Transporte** (barra inferior) → play/pause, seek, tempo atual e duração da faixa.
7. **Gravação** → `Gravar trecho` inicia a captura, para sozinha no fim do trecho e libera preview + download.

Atalhos: `Espaço` = play/pause (quando nenhum campo de texto está focado). A gravação exige áudio
carregado e trecho válido.

## Como a gravação funciona

- Vídeo: `HTMLCanvasElement.captureStream(fps)` do canvas do Stage — nenhum painel, moldura, cursor ou
  indicador de REC entra no arquivo.
- Áudio: track do `MediaStreamAudioDestinationNode`, ligada antes do volume de monitoração (mudar o
  volume do monitor não altera o áudio gravado).
- As duas tracks formam um único `MediaStream` entregue ao `MediaRecorder`.
- O tempo da faixa (`audio.currentTime`) é a fonte de verdade do progresso e do stop automático — não há
  timer independente para a timeline.
- Codecs testados por `MediaRecorder.isTypeSupported()`: VP9/Opus → VP8/Opus → WebM → MP4 (se existir).
  O formato real gerado aparece no painel e define a extensão do arquivo.
- Nome do arquivo: `Drazyx_Wake-Up_Slowed-Reverb_<Ns>_Visualizer.<ext>`.
- Tracks, timers e Object URLs são liberados ao finalizar, cancelar ou desmontar.

## Formatos e limitações

- **WebM (VP9/VP8 + Opus)** é o formato confiável no Chrome/Edge. MP4 não é garantido; a detecção é feita
  em runtime e nunca é assumida.
- Enquanto grava, **mantenha a aba visível**: o navegador pausa `requestAnimationFrame` em abas ocultas,
  o que interrompe os frames do canvas.
- A gravação captura o Stage na resolução escolhida; GPUs fracas podem não sustentar 1080×1920 a 30 fps —
  use 720×1280.
- Fechar ou recarregar a aba durante a gravação descarta o arquivo.
- Arquivos de áudio/capa ficam apenas na sessão do navegador; nada é salvo em servidor.
- Se o navegador bloquear o áudio (autoplay policy), clique em play novamente: o `AudioContext` só é
  retomado por gesto do usuário.
- Em máquinas sem WebGL o Stage não renderiza; não há fallback 2D implementado.

## Estrutura

```
src/
  app/                  layout do estúdio (topbar, grid do Stage + painéis)
  components/editor/    painéis (Fonte, Template, Trecho, Visual, Tipografia, Formato, Gravação)
  components/ui/        primitivas visuais (Panel, Slider, Segmented, Button, Notice)
  features/project/     tipos, defaults do preset Drazyx e store Zustand
  features/audio/       AudioEngine (playback, AnalyserNode, bandas, transientes, relógio)
  features/visualizer/  VisualEngine (Three.js), Stage, templates e pass de acabamento
  features/recording/   StageRecorder (MediaRecorder) e orquestração do fluxo
  lib/                  validação de arquivos, capacidades do navegador, formatação
  tests/                testes unitários Vitest + assets locais de teste
```

## Resolução de problemas

- **"O navegador não conseguiu decodificar este áudio"** → converta para MP3/WAV e tente novamente.
- **"A gravação terminou sem conteúdo"** → a aba provavelmente estava oculta ou o canvas parou de
  desenhar; mantenha a janela visível e tente de novo.
- **Sem áudio no arquivo** → verifique se o áudio toca no monitor antes de gravar; a track de gravação é
  criada a partir do mesmo `AudioContext`.
- **Preview travando** → reduza partículas/glow e use 720×1280.
