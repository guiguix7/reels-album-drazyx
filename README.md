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
2. **Composição** → escolha um dos oito layouts (01 CENTERED HERO, 02 STEREO FRAME, 03 OFFSET CINEMA,
   04 EDITORIAL COVER, 05 ALBUM PLAYER SPLIT, 06 VERTICAL TOTEM, 07 SYMMETRIC SPECTRUM,
   08 MONOCHROME FOCUS) ou um dos estilos originais (MIRAGE, padrão, AFTERIMAGE, VOID, SPECTRUM).
   A troca é imediata e não perde o áudio carregado.
3. **Trecho do vídeo** → defina início e duração (máximo 30 s, mínimo 5 s).
4. **Paleta** → as cores do vídeo saem automaticamente da capa (`Da capa`) ou você escolhe acento,
   secundária e brilho no modo `Manual`. `Extrair` recalcula a partir da capa atual.
5. **Visual / Tipografia** → intensidade, partículas, força do grave, brilho, grão, câmera e glitch;
   textos de artista, faixa, álbum, CTA e tagline — todo texto é desenhado dentro do canvas do Stage.
6. **Formato** → proporção (9:16 padrão), resolução (1080×1920 ou 720×1280) e FPS (30 para export).
7. **Transporte** (barra inferior) → play/pause, seek, tempo atual e duração da faixa.
8. **Gravação** → `Gravar trecho` inicia a captura, para sozinha no fim do trecho e libera preview + download.

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

## Paleta e ritmo

- **Paleta automática:** ao carregar a capa, ela é lida em 64×64 no canvas local; pixels transparentes,
  quase-pretos e cinzas são descartados, o restante é agrupado por matiz e a cor dominante vira o
  **acento** (clareada/escurecida para manter contraste no fundo escuro), a segunda matiz distante vira a
  **secundária** e o **brilho** é o acento clareado. Nada é enviado para fora do navegador.
- **Manual:** os três seletores de cor sobrescrevem a paleta; voltar para `Da capa` reaplica a última
  paleta extraída. Sem capa, vale a paleta Drazyx padrão (`#b84dff` / `#6b4a9f` / `#cf8aff`).
- **Ritmo:** após o áudio ficar pronto, o arquivo é decodificado localmente (`decodeAudioData`) e os
  primeiros 45 s viram um envelope de onsets (RMS + fluxo). Uma autocorrelação com prior em ~110 BPM
  estima o BPM, exibido no painel Fonte (ex.: `Ritmo detectado: 93 BPM`).
- **Pulso de batida:** `beatPhase`/`beatPulse` são derivados do tempo do áudio e do BPM — capa, anéis,
  barras e glow pulsam no tempo da faixa, inclusive durante a gravação. Sem BPM confiável, o movimento
  continua vindo das bandas e dos transientes (nada aleatório).
- A análise é opcional: se o navegador não decodificar o arquivo para análise, o app segue funcionando
  sem BPM.

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
  components/editor/    painéis (Fonte, Template, Paleta, Trecho, Visual, Tipografia, Formato, Gravação)
  components/ui/        primitivas visuais (Panel, Slider, Segmented, ColorField, Button, Notice)
  features/project/     tipos, defaults do preset Drazyx e store Zustand
  features/audio/       AudioEngine (playback, AnalyserNode, bandas, transientes, relógio) + ritmo (BPM)
  features/palette/     extração de cores da capa e utilitários de cor
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
