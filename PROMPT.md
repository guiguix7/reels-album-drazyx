# PROMPT PRINCIPAL — DRAZYX VISUALIZER STUDIO

**Objetivo:** construir um site/aplicação web local-first para criar visualizers musicais cinematográficos e gravar/exportar vídeos verticais de 30 segundos, usando a música e a arte do próprio artista. O primeiro projeto será Drazyx — "Wake Up (Slowed + Reverb)", do álbum "My Mirage (Wake Up Remixes)".

**Instrução de execução:** use este documento como especificação principal. Leia também o AGENTS.md na raiz do projeto antes de escrever código. Não comece implementando componentes isolados sem antes entender o fluxo completo de áudio, renderização e gravação.

---

## 1. Papel e missão

Você é uma equipe sênior de produto e engenharia composta por Product Designer, Creative Developer, Engenheiro de Áudio Web, Desenvolvedor Front-end, Motion Designer e QA Engineer. Sua missão é criar uma experiência visual de alta qualidade, não um dashboard genérico nem um player com uma barra de equalizador padrão.

O produto será chamado provisoriamente de **DRAZYX VISUALIZER STUDIO**. O nome deve ficar centralizado em uma constante/configuração para poder ser alterado depois.

O site precisa permitir que o artista:

1. Carregue uma faixa de áudio local (MP3, WAV ou outro formato suportado pelo navegador).
2. Carregue a capa do lançamento ou use uma arte padrão/configurável.
3. Escolha o trecho de até 30 segundos da música que deseja divulgar.
4. Veja uma composição audiovisual animada, responsiva à música em tempo real.
5. Personalize alguns parâmetros visuais sem precisar editar código.
6. Grave/exporte a composição com o áudio sincronizado, preferencialmente em proporção 9:16 para Reels, TikTok e YouTube Shorts.
7. Baixe o arquivo gerado e reutilize o projeto com outras faixas.

**Não implemente apenas uma landing page.** O núcleo é um estúdio de criação com um palco visual (stage) separado dos controles da aplicação.

## 2. Contexto do primeiro lançamento

Use estes dados como preset inicial, todos editáveis em uma configuração central:

- **Artista:** DRAZYX
- **Faixa:** WAKE UP (SLOWED + REVERB)
- **Álbum/projeto:** MY MIRAGE (WAKE UP REMIXES)
- **CTA final:** LISTEN NOW · LINK IN BIO
- **Duração de divulgação:** 30 segundos
- **Proporção principal:** 9:16
- **Direção visual:** dark lo-fi, melancolia cinematográfica, retro-futurismo sutil, pixel/noise controlado, atmosfera noturna e sensação de sonho/miragem.
- **Paleta de marca:**
  - Fundo: `#070810`
  - Superfície: `#11101A`
  - Superfície elevada: `#18131D`
  - Texto principal: `#F2EDF5`
  - Texto secundário: `#A99EAE`
  - Acento: `#B84DFF`
- **Tipografia de referência:** Space Grotesk para títulos e Inter para interface/textos auxiliares. Use fallbacks locais caso as fontes externas não carreguem.

### Referências visuais fornecidas pelo usuário

- https://youtube.com/shorts/-RxV1m7CNhE
- https://youtu.be/iXNtch2aL3c

Obrigatório: antes de fechar a direção visual, tente assistir/analisar as referências. Extraia delas princípios de composição, ritmo de movimento, densidade visual, transições, uso de tipografia, câmera, cor e sincronização com o áudio. Não copie cenas, identidade visual, logotipos ou elementos proprietários. Use as referências como orientação de linguagem visual.

Se os links não puderem ser acessados pelo ambiente do agente, registre essa limitação no relatório e não invente o que aparece nos vídeos. Continue usando a direção visual escrita neste documento. Não bloqueie o desenvolvimento por causa disso.

### Assets do lançamento

- Capa fornecida pelo usuário: `https://i1.sndcdn.com/artworks-jsZUU1LrbzpdoBh8-xDyyGQ-t1080x1080.jpg`
- Não dependa dessa URL em tempo de execução. O ideal é permitir upload local da capa e armazená-la apenas na sessão do navegador. Se a arte for obtida por URL, faça tratamento explícito de CORS e apresente fallback quando a origem bloquear leitura/canvas.
- O usuário ainda precisa selecionar/fornecer o áudio final. Não invente arquivo de áudio, letra ou trecho da música.

## 3. Objetivo de produto e critérios de sucesso

### Objetivo principal

Criar vídeos curtos que façam a pessoa parar de rolar, permanecer assistindo e associar a música à identidade visual da Drazyx. A composição deve despertar curiosidade e terminar com identificação clara da faixa e um convite para ouvir a música completa.

### Princípios

- **Visual antes de controles:** a composição é a protagonista; a interface do editor deve ser discreta.
- **Movimento com intenção:** cada movimento deve reforçar a música e a atmosfera, não ser animação aleatória.
- **Áudio como motor:** graves, médios, agudos, energia e transientes devem influenciar elementos diferentes.
- **Legibilidade:** o nome do artista e da faixa devem ser reconhecíveis em telas pequenas.
- **Consistência:** identidade visual reaproveitável para outros lançamentos da Drazyx.
- **Local-first:** áudio e imagens do usuário devem ser processados localmente no navegador. Não enviar mídia para um servidor externo.
- **Sem dependências pagas:** não exigir conta premium, API paga, assinatura, créditos de IA nem backend hospedado para o fluxo principal.
- **Honestidade técnica:** não simular gravação ou exportação. O arquivo baixado precisa conter vídeo e áudio sincronizados de verdade.

### Critérios verificáveis de sucesso

- Uma pessoa consegue abrir o site, carregar áudio e capa, selecionar um trecho, reproduzir, personalizar e iniciar a gravação sem editar código.
- O vídeo final contém a composição visual inteira, sem painel de controles, menus ou cursor do editor.
- O vídeo final contém o áudio original selecionado, sincronizado com a animação.
- A gravação para automaticamente ao fim do trecho selecionado, com limite padrão de 30 segundos.
- O usuário recebe um arquivo real para baixar, com extensão e MIME type coerentes.
- A aplicação informa claramente quando o navegador não suporta um codec ou uma função.
- O fluxo principal funciona sem backend e sem chamadas a APIs pagas.

## 4. Conceito criativo: "MY MIRAGE — BETWEEN DREAMING AND WAKING"

A direção criativa é uma travessia visual entre sono, memória e realidade. Evite a estética de "equalizador neon genérico". O resultado deve parecer uma peça audiovisual de um artista independente, com atmosfera, profundidade, contraste e ritmo.

### Motivos visuais

- Espaço noturno quase preto, com névoa volumétrica ou camadas translúcidas.
- Luz violeta difusa, reflexos frios e pequenas fontes de luz distantes.
- Capa do álbum como objeto central: suspensa, flutuando, com profundidade e parallax. Não distorcer a arte a ponto de perder reconhecimento.
- Partículas pequenas e lentas; algumas respondem aos graves.
- Ondas/rings/linhas espectrais com reação aos dados reais da música.
- Aberrações cromáticas e glitch apenas em momentos pontuais, nunca como filtro constante.
- Grain, scanlines e pixel fragments em baixa intensidade para textura.
- Sensação de câmera lenta, espaço vazio e movimento contínuo.

### Storyboard-base de 30 segundos

Use esta sequência como preset inicial. A duração real de cada bloco pode ser ajustada ao trecho musical, mas a narrativa precisa ter começo, desenvolvimento e fechamento.

| Tempo | Beat visual | Intenção |
| --- | --- | --- |
| 0–3 s | Quase preto. Um brilho distante revela partículas e um pequeno fragmento da arte. Surge uma frase curta, por exemplo SOMEWHERE BETWEEN DREAMING AND WAKING. | Gancho visual imediato. Não começar com uma tela estática ou logo parado. |
| 3–8 s | A câmera avança lentamente. A capa aparece suspensa no centro, com parallax, sombra e brilho violeta. | Revelação da faixa e do universo visual. |
| 8–15 s | O ambiente ganha profundidade. Anéis/linhas de frequência e partículas reagem aos graves e à energia da música. | Fazer o público sentir que o visual está vivo e conectado ao áudio. |
| 15–23 s | A composição se transforma: túnel, miragem, reflexo ou corredor de luz. A câmera atravessa o espaço em movimento contínuo. | Escalar o interesse sem encher a tela de elementos. |
| 23–27 s | Pico visual sincronizado com um momento musical forte: expansão de luz, distorção curta, partículas se afastando e retorno à capa. | Momento memorável/reassistível. |
| 27–30 s | Composição limpa. DRAZYX, WAKE UP (SLOWED + REVERB), MY MIRAGE (WAKE UP REMIXES) e LISTEN NOW · LINK IN BIO. | Converter atenção em reconhecimento e intenção de ouvir. |

Não force uma mudança visual exatamente em cada marca se o trecho musical não tiver esses eventos. O agente de áudio deve identificar os momentos mais fortes e adaptar os keyframes ao áudio real.

### Regras de composição

- Manter uma zona segura para texto; evitar posicionar informações importantes nas extremidades que podem ser cobertas pelos controles das plataformas.
- Priorizar um foco visual central com profundidade em camadas.
- Evitar texto longo. Cada tela deve comunicar no máximo uma ideia.
- Não usar frases motivacionais clichês ou letras inventadas.
- Não gerar rostos humanos deformados, objetos aleatórios ou imagens com aparência de banco de imagens.
- Não usar a capa como fundo esticado sem tratamento visual.
- Não exibir logos de Spotify, SoundCloud ou outras plataformas sem assets oficiais e sem necessidade. O CTA LINK IN BIO é suficiente.

## 5. Experiência e arquitetura da interface

### Estrutura geral

Crie uma interface de estúdio escura, minimalista e editorial. Ela deve parecer uma ferramenta criativa profissional, não um template de dashboard administrativo.

**Layout desktop:**

- Barra superior fina com wordmark DRAZYX / VISUALIZER STUDIO, status do projeto e ações de tela cheia/gravação.
- Área central ampla contendo o palco 9:16, em escala responsiva, com moldura discreta e fundo escuro ao redor.
- Painel lateral de configuração com seções recolhíveis: ASSETS, AUDIO, SCENE, TYPE, EXPORT.
- Barra inferior compacta para play/pause, timeline, tempo atual, duração selecionada e volume de monitoração.

**Layout mobile:**

- Palco no topo e controles em painéis/abas abaixo.
- Não sacrificar o palco para manter todos os controles visíveis ao mesmo tempo.
- Permitir rolagem vertical sem quebrar o canvas ou os controles.

### Separação essencial: EDITOR vs STAGE

Implemente dois contextos distintos:

1. **Editor UI:** controles, uploads, timeline, sliders, menus, mensagens e botões.
2. **Stage/Output:** somente os elementos que devem aparecer no vídeo final.

A gravação deve capturar apenas o Stage/Output. Nenhum controle do editor, cursor, painel, moldura de seleção ou mensagem temporária pode aparecer no vídeo exportado.

O Stage precisa renderizar em uma superfície de saída controlada (canvas). Todos os textos/elementos visuais que fazem parte do vídeo devem estar dentro da renderização capturada, e não depender de elementos HTML externos que desapareceriam na gravação.

### Controles necessários

**Assets**

- Upload de áudio.
- Upload de capa.
- Preview da capa.
- Remover/substituir asset.
- Mostrar nome e duração do arquivo de áudio.
- Fallback visual quando não houver capa.

**Audio**

- Play/pause.
- Seek/linha do tempo.
- Seleção de início do trecho.
- Seleção de fim ou duração, com padrão de 30 s.
- Mostrar 00:00–00:30 e duração selecionada.
- Volume de monitoração.
- Status claro: carregando, pronto, tocando, pausado, erro.
- Não criar transcrição/letra automática.

**Scene**

- Presets visuais: MIRAGE (padrão), AFTERIMAGE, VOID, SPECTRUM.
- Intensidade geral.
- Quantidade de partículas.
- Força da reação aos graves.
- Intensidade de glow.
- Grain/noise.
- Velocidade de câmera.
- Alternância de glitch (baixo/médio/desligado).
- Botão para restaurar os valores do preset.

**Type**

- Artist name, track title, album title e CTA editáveis.
- Mostrar/ocultar metadados por bloco.
- Ajuste de tamanho e tracking dentro de limites seguros.
- Preferir Space Grotesk/Inter e manter hierarquia consistente.

**Export**

- Proporção: 9:16 como padrão; 1:1 e 16:9 como opções secundárias se não comprometerem a qualidade.
- Resolução: 1080×1920 como alvo principal; oferecer 720×1280 como modo leve.
- FPS: 30 como padrão de exportação; preview pode rodar a 60 FPS quando possível.
- Duração: 30 s como padrão, com duração menor permitida para teste.
- Botão RECORD 30S / GRAVAR 30S.
- Botão de parar gravação.
- Indicador de contagem regressiva/tempo gravado.
- Estado REC discreto apenas na interface do editor, nunca no vídeo final, a menos que seja uma escolha explícita de estilo.
- Preview do resultado e botão de download após finalizar.

### Detalhes de interação

- Tooltips discretos para controles menos óbvios.
- Sliders com valores visíveis e resposta imediata.
- Transições de painel entre 150 e 250 ms, sem animação excessiva.
- Estados vazios bem desenhados: sem áudio, sem capa, sem gravação.
- Mensagens de erro úteis, não mensagens técnicas cruas.
- Atalhos de teclado opcionais: espaço = play/pause; R = iniciar/parar gravação apenas quando nenhum campo de texto estiver focado.
- O botão de gravação deve exigir áudio carregado e duração válida.

## 6. Direção técnica recomendada

### Stack

Use uma stack simples, local-first e sem backend obrigatório:

- Vite + React + TypeScript.
- CSS Modules ou Tailwind CSS, mantendo design tokens próprios. Não introduza uma biblioteca de componentes que force aparência genérica.
- Three.js para o Stage/WebGL e animações de partículas, geometria, câmera, shaders e pós-processamento leve.
- Web Audio API para análise e roteamento do áudio.
- MediaRecorder API + HTMLCanvasElement.captureStream() para gravar o Stage e sincronizar o áudio.
- Zustand ou Context + reducer para estado global, mas escolha uma única estratégia e evite overengineering.
- Vitest para testes unitários e Playwright para smoke/e2e quando possível.

Não é necessário criar autenticação, banco de dados, API server ou integração com Spotify/SoundCloud. O fluxo principal deve funcionar localmente.

### Arquitetura em camadas

1. **UI Layer:** editor, inputs, painéis, botões e feedback.
2. **Project State:** configuração da faixa, seleção do trecho, preset e parâmetros de cena.
3. **Audio Engine:** carregamento, playback, analyser, dados FFT e sincronização temporal.
4. **Visual Engine:** cena Three.js que recebe os dados de áudio e atualiza os objetos.
5. **Output/Recorder:** captura o canvas e a faixa de áudio em um único MediaStream, grava e gera o arquivo.

Mantenha o Stage desacoplado dos componentes de controle. A UI altera estado; o Stage consome estado e dados de áudio; o Recorder captura a saída do Stage e o áudio roteado.

### Sugestão de estrutura de pastas

Adapte se necessário, mas mantenha responsabilidades claras:

```
src/
  app/
    App.tsx
    app.css
  components/
    shell/
      TopBar.tsx
      EditorLayout.tsx
    panels/
      AssetsPanel.tsx
      AudioPanel.tsx
      ScenePanel.tsx
      TypePanel.tsx
      ExportPanel.tsx
    transport/
      TransportBar.tsx
      Timeline.tsx
    feedback/
      Toast.tsx
      EmptyState.tsx
  features/
    project/
      project.types.ts
      project.defaults.ts
      project.store.ts
    audio/
      AudioEngine.ts
      audio.types.ts
      audio.utils.ts
      useAudioEngine.ts
    visualizer/
      Stage.tsx
      VisualScene.ts
      presets/
        mirage.ts
        afterimage.ts
        void.ts
        spectrum.ts
      shaders/
      objects/
      visual.types.ts
    recording/
      Recorder.ts
      recorder.types.ts
      recorder.utils.ts
      useRecorder.ts
  hooks/
  lib/
    browser-capabilities.ts
    format-time.ts
    file-validation.ts
  styles/
    tokens.css
    globals.css
  tests/
```

Não crie arquivos vazios só para preencher estrutura. Comece pelo fluxo funcional mínimo e expanda conforme necessário.

## 7. Motor de áudio: requisitos obrigatórios

### Carregamento e playback

- Aceitar arquivo local por `<input type="file">` e drag-and-drop.
- Validar MIME/extensão e tamanho de forma razoável; exibir erro quando o navegador não decodificar o arquivo.
- Criar `URL.createObjectURL(file)` e revogar URLs antigos quando os assets forem substituídos ou o componente desmontar.
- Não converter ou enviar o áudio para serviços externos.
- Criar/resumir AudioContext somente após interação explícita do usuário, respeitando autoplay policy.
- Tratar AudioContext suspenso, erros de decode e carregamento interrompido.
- Evitar criar várias vezes MediaElementAudioSourceNode para o mesmo elemento de áudio.

### Análise em tempo real

Use AnalyserNode com fftSize apropriado (ex.: 2048 ou 4096, a validar em performance). Extraia:

- Espectro de frequência (getByteFrequencyData).
- Forma de onda (getByteTimeDomainData).
- Energia média/RMS.
- Energia de graves, médios e agudos usando bandas configuráveis.
- Suavização/attack-release para evitar tremulação visual.
- Detecção simples de transientes/picos, com threshold e cooldown para não disparar continuamente.

Normalize os valores para uma faixa estável (0–1) e não ligue diretamente todo valor bruto do FFT à escala dos objetos. Use smoothing, clamps e interpolação.

### Mapeamento musical

- **Graves:** escala/pulso de um anel externo, deslocamento de partículas e impacto de luz.
- **Médios:** ondulações da névoa, movimento de objetos de fundo ou deformação sutil da capa.
- **Agudos:** brilho de pontos, pequenas faíscas e detalhe do espectro.
- **Energia global:** intensidade geral da cena/câmera, limitada para não causar tremedeira.
- **Transientes:** eventos discretos de expansão/flash, com duração curta e sem strobe agressivo.

A animação deve continuar fluida mesmo em trechos silenciosos. Não pausar a cena quando o RMS cair.

## 8. Motor visual: requisitos obrigatórios

### Renderização

- A saída deve ser um canvas WebGL independente dos controles.
- Proporção interna configurável; padrão 9:16.
- Dimensionar o canvas com setSize e ajustar câmera/aspect ratio corretamente.
- Separar a resolução de saída da resolução CSS exibida no editor.
- Aplicar devicePixelRatio com limite razoável no preview para não degradar performance.
- No export 1080×1920, usar resolução de render correspondente sempre que o hardware suportar; se não, oferecer modo 720×1280.
- Atualizar animação com requestAnimationFrame e delta time; evitar depender de FPS fixo.
- Gerenciar resize, visibilitychange, pausa e limpeza de recursos.

### Cena MIRAGE (preset principal)

Crie uma cena com pelo menos cinco camadas visuais reais:

1. Fundo escuro com gradiente/profundidade e ruído sutil.
2. Névoa ou glow em camadas translúcidas.
3. Campo de partículas de profundidade, com movimento lento e influência dos graves.
4. Objeto central contendo a capa em uma placa/quadro flutuante com leve rotação, parallax e sombra/glow.
5. Anéis/ondas espectrais reativos, integrados à composição.
6. Tipografia da faixa e artista como parte da renderização do Stage.

A cena pode ter elementos extras, desde que preservem hierarquia e performance. Use parallax e profundidade sem causar enjoo.

### Outros presets

- **AFTERIMAGE:** repetição/eco visual da capa e rastros translúcidos, como uma memória persistente.
- **VOID:** composição minimalista, grande espaço negativo, poucos elementos, foco em tipografia e pulso de luz.
- **SPECTRUM:** composição mais musical, ondas/linhas de frequência elegantes, ainda dentro da paleta Drazyx.

Os presets devem ser diferentes de verdade, não apenas mudar uma cor ou quantidade de partículas.

### Motion design

- Definir curvas de easing e tempos consistentes.
- Usar câmera lenta e deslocamento suave como linguagem principal.
- Reservar movimentos bruscos para eventos musicais pontuais.
- Evitar glitch contínuo, strobes, zooms violentos e flashes repetitivos.
- Não inserir transições que façam o texto desaparecer por tempo demais.
- Não esconder artista/faixa durante os segundos finais.

### Textura e acabamento

- Bloom/glow moderado.
- Film grain/noise em baixa opacidade.
- Aberração cromática muito sutil e controlada.
- Vignette leve.
- Scanlines/pixelation apenas como detalhe opcional.
- Evitar sharpening excessivo e cores saturadas em toda a tela.

## 9. Gravação e exportação: parte crítica

Esta é uma funcionalidade central. Trate-a como subsistema independente e teste-a com atenção.

### Requisito de captura

A gravação deve combinar:

- Vídeo do canvas do Stage, via `canvas.captureStream(fps)`.
- Áudio do áudio carregado, roteado via MediaStreamAudioDestinationNode.

Monte um único MediaStream com as tracks de vídeo e áudio. A saída gravada deve incluir som mesmo quando o áudio também estiver sendo monitorado pelos alto-falantes.

Atenção: o MediaElementAudioSourceNode precisa ser criado uma vez por elemento de áudio. O áudio deve ser roteado para o AudioContext.destination e para MediaStreamAudioDestinationNode, sem duplicar a criação da source node. Verifique volume, mute e sincronização.

### Codec e formato

- Detectar suporte com `MediaRecorder.isTypeSupported()`.
- Tentar codecs em ordem segura, por exemplo WebM VP9/Opus e depois WebM VP8/Opus.
- Não assumir que MP4 é suportado pelo navegador.
- Mostrar o formato real gerado e usar a extensão correta.
- Se o navegador não suportar gravação, explicar a limitação e oferecer alternativa documentada (por exemplo, captura de tela/aba ou conversão externa com FFmpeg). Não apresentar um arquivo vazio como sucesso.
- MP4 pode ser uma melhoria opcional posterior via FFmpeg/WASM ou ferramenta externa, mas não comprometa a gravação local confiável do MVP.

### Fluxo de gravação

1. Validar arquivo de áudio, trecho e Stage pronto.
2. Verificar APIs e codecs disponíveis.
3. Preparar o Stage na resolução escolhida.
4. Posicionar o áudio exatamente no tempo inicial selecionado.
5. Iniciar o MediaRecorder e playback em sequência sincronizada.
6. Atualizar o relógio visual usando a timeline do áudio, não apenas um timer independente.
7. Parar automaticamente quando o trecho terminar ou ao atingir 30 s.
8. Finalizar dataavailable/`stop` corretamente.
9. Montar Blob com chunks válidos.
10. Disponibilizar preview e download.
11. Liberar tracks, timers, URLs temporárias e recursos temporários ao concluir ou cancelar.

### Sincronização

- O tempo de áudio é a fonte de verdade para o progresso da gravação.
- Compensar o tempo de inicialização do recorder/player.
- Não usar setInterval como relógio de precisão para sincronização audiovisual.
- Evitar drift entre animação e áudio.
- A gravação deve continuar mesmo quando o usuário interage com controles externos, mas os controles de configuração podem ser bloqueados durante REC para evitar mudanças acidentais.

### Arquivo final

- Nome padrão: `Drazyx_Wake-Up_Slowed-Reverb_30s_Visualizer.webm` (adaptar extensão ao formato real).
- O arquivo precisa ser baixável com um clique.
- Mostrar duração real, resolução e formato.
- Criar URL temporária para preview/download e revogá-la quando não for mais necessária.

O Stage de gravação não pode incluir menus, painéis, cursor, bordas do editor ou status de REC.

## 10. Performance, compatibilidade e robustez

### Alvos

- Preview fluido em desktop intermediário.
- Meta de 60 FPS no preview quando possível; fallback aceitável de 30 FPS.
- Export a 30 FPS como padrão.
- Reduzir partículas, pós-processamento e resolução quando a performance cair.
- Evitar alocações de arrays/objetos pesados dentro do loop de renderização.
- Reutilizar buffers e geometria; não criar novas meshes por frame.

### Compatibilidade

Priorizar Chrome e Edge desktop atuais. Tratar Firefox/Safari como compatibilidade progressiva e não assumir suporte idêntico a codecs/APIs.

Verificar:

- MediaRecorder.
- HTMLCanvasElement.captureStream.
- AudioContext e createMediaStreamDestination.
- requestAnimationFrame.
- MediaRecorder.isTypeSupported.

### Fallbacks

- Se WebGL não estiver disponível, informar e oferecer visualizer 2D simples se possível.
- Se o arquivo não decodificar, pedir outro formato sem travar a aplicação.
- Se o codec não existir, escolher outro suportado.
- Se a resolução 1080p derrubar a performance, oferecer 720p.
- Se o usuário fechar a aba durante REC, não prometer recuperação do arquivo.

## 11. Qualidade, acessibilidade e segurança

- Contraste suficiente em textos e controles.
- Estados de foco por teclado.
- Botões com rótulos claros e áreas de toque adequadas.
- Respeitar prefers-reduced-motion na interface do editor; a opção não deve desativar o visualizer sem explicação.
- Evitar flashes intensos e efeitos que possam causar desconforto.
- Validar arquivos e não confiar em extensão isolada.
- Não executar conteúdo dos arquivos carregados.
- Não usar eval, new Function ou scripts dinâmicos.
- Não enviar músicas ou imagens para serviços externos.
- Não inserir trackers, analytics ou telemetria no MVP.
- Não incluir chave secreta no front-end.

## 12. Plano de implementação por fases

Não tente desenvolver tudo de uma vez. Construa em fatias verticais, mantendo a aplicação executável ao final de cada fase.

- **Fase 0 — Inspeção e planejamento:** ler este PROMPT.md e o AGENTS.md; inspecionar repositório e ambiente; verificar Node.js, package manager, navegador e scripts existentes; tentar acessar as duas referências visuais e registrar o que foi observado ou a limitação; escrever um plano curto de implementação e riscos.
- **Fase 1 — Estrutura e identidade:** criar app Vite + React + TypeScript; configurar tokens visuais e layout do editor; construir Stage com proporção 9:16 e layout responsivo; implementar estados vazios e controles visuais sem simular funcionalidades ainda; garantir build e typecheck.
- **Fase 2 — Áudio funcional:** upload local, playback, pause, seek e metadados; Web Audio API e analyser; exibir waveform/níveis básicos na interface; testar arquivos inválidos, substituir e limpar assets.
- **Fase 3 — Cena MIRAGE:** criar o preset principal com camadas, capa, partículas, anéis, tipografia e movimentos; ligar parâmetros da cena ao analyser; implementar outros presets com diferenças visuais reais; ajustar performance e responsividade.
- **Fase 4 — Gravação real:** construir o subsistema MediaRecorder; combinar stream de canvas e stream de áudio; selecionar trecho e limitar a 30 s; implementar countdown/progresso no editor, stop, preview e download; validar que o arquivo contém áudio e vídeo.
- **Fase 5 — Polimento e QA:** revisar composição em 9:16 e safe areas; corrigir bugs de sincronização, resize, memory leaks e codecs; rodar lint, typecheck, testes e build; testar ao menos um ciclo completo com uma música real do usuário quando fornecida; documentar limitações reais e instruções de uso.

Não declarar uma fase concluída apenas porque a interface visual está pronta. Use critérios de aceitação testáveis.

## 13. Critérios de aceitação finais

Considere o MVP completo somente quando todos os itens críticos passarem:

- [ ] Projeto instala dependências e inicia localmente com instruções documentadas.
- [ ] Layout visual tem identidade Drazyx e não parece template administrativo.
- [ ] Stage tem proporção 9:16 e permanece independente dos controles.
- [ ] É possível carregar áudio local e reproduzi-lo.
- [ ] É possível carregar/substituir a capa.
- [ ] A animação reage de forma perceptível e suave ao áudio real.
- [ ] Preset MIRAGE funciona e os outros presets possuem composições distintas.
- [ ] É possível selecionar um trecho de 30 s.
- [ ] A gravação captura o Stage completo sem UI do editor.
- [ ] A gravação contém áudio sincronizado.
- [ ] A gravação para automaticamente ao fim do trecho.
- [ ] O download é válido e abre em um player compatível.
- [ ] O usuário é informado sobre o formato gerado e limitações do navegador.
- [ ] Não há envio de áudio/capa para servidor externo.
- [ ] Não há erros críticos no console durante o fluxo principal.
- [ ] Lint, typecheck, testes disponíveis e build passam.
- [ ] Existe documentação de instalação, execução, uso e resolução de problemas.

## 14. Entregáveis obrigatórios dos agentes

1. Aplicação funcional completa no repositório.
2. AGENTS.md preservado e seguido.
3. README.md em português com instalação, execução, controles, gravação, formatos e limitações.
4. Relatório final contendo:
   - O que foi implementado.
   - Arquivos/áreas principais alterados.
   - Comandos executados.
   - Resultado de lint/typecheck/test/build.
   - Navegadores e codecs testados.
   - Limitações que ainda existem.
   - Próximas melhorias priorizadas.

**Regra final:** não entregue apenas um mockup ou uma tela bonita. Entregue primeiro o caminho completo e real: carregar áudio → visualizar → selecionar 30 s → gravar → baixar vídeo com áudio. O acabamento visual deve elevar esse fluxo, não substituí-lo.

---

## Apêndice — Diretrizes adicionais do usuário (13/11/2026)

- As imagens de referência fornecidas junto com esta especificação ilustram o estilo desejado (composições em estilo player/waveform e wireframes de layout).
- Na imagem de wireframes numerada de Template 1 a Template 8, os templates favoritos do usuário são o **Template 3**, o **Template 4** e o **Template 5**.
- **Deve ser possível trocar de template na interface.** Os templates 3, 4 e 5 devem ser implementados como composições selecionáveis no Stage, além dos presets MIRAGE, AFTERIMAGE, VOID e SPECTRUM.
