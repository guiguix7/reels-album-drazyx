# Auditoria de primeira experiência — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Alvo: https://reels-album-drazyx.vercel.app/
Método: inspeção heurística em Chrome, nos viewports 1920×1080, 1440×900,
1366×768, 1024×768, 768×1024, 390×844 e 360×800, com upload real de áudio
(MP3 e WAV), capa, gravação e download. Não houve sessão com usuários reais;
este documento descreve observações do auditor, não pesquisa com usuários.

## Resumo

A primeira visita comunica que existe um estúdio e que áudio/capa ficam no
navegador, mas **não comunica o fluxo completo**. A tela inicial é dominada por
um Stage 9:16 animado com um cartão de “Sem áudio carregado” que cobre a
tipografia do próprio vídeo. O primeiro CTA acionável (`CARREGAR ÁUDIO`) está
no topo da coluna direita em desktop, mas na versão móvel fica abaixo da dobra
(y≈874 em um viewport de 844 px). O botão de gravação, que é o objetivo do
produto, está no fim de uma coluna com 3.581 px de conteúdo: **recordTop≈3515 px
em 1440×900**, fora da área visível e após 62 elementos focáveis.

## Cenário 1 — Primeira visita (sem arquivos)

Ações disponíveis na primeira tela:

- Reproduzir (desabilitado), timeline (desabilitada), Stage animando com arte padrão.
- `CARREGAR ÁUDIO`, `CARREGAR CAPA`.
- Oito cards de layout, quatro cards de estilo, storyboard, paleta, trecho,
  visual, tipografia e formato.
- Nenhuma etapa numerada, nenhum “comece aqui”, nenhuma promessa de resultado
  final antes de rolar a coluna.

O que funciona:

- A identidade é coerente e reconhecível: fundo escuro, roxo, capa central,
  tipografia editorial.
- A frase “Áudio e capa ficam no navegador — nada é enviado para fora” é visível
  no painel Fonte.
- O vazio tem instrução textual e aponta para o painel Fonte.

O que confunde:

1. **O cartão vazio cobre a composição.** Ele se sobrepõe ao título, álbum e
   artista do Stage (medido: `emptyOverlapsStage: true` em 1440, 1024 e 390).
   Isso parece parte do vídeo e impede avaliar a tipografia antes de carregar
   áudio. Evidência: `evidence/01-empty-desktop-1440.jpg`,
   `evidence/02-empty-mobile-390.jpg`.
2. **O Stage parece o produto, mas o caminho de ação está fora dele.** Não há
   botão de upload dentro do Stage, nem seta, nem numeração. No desktop o CTA
   fica na coluna lateral; no móvel, depois de 782 px de Stage.
3. **Excesso de decisões antes da primeira tarefa.** O usuário vê oito layouts,
   quatro estilos, storyboard, paleta, sliders e formato antes de carregar
   qualquer áudio. Nada indica que essas escolhas podem ser feitas depois.
4. **Vocabulário técnico sem explicação contextual.** “FULL 1080”, “TAXA”,
   “TRACKING”, “GLITCH”, “STORYBOARD”, “HOOK” e “ESCALA” aparecem como se o
   usuário já soubesse o que significam. “1080×1920” é mostrado, mas não
   “vertical”, “Reels” ou “qualidade”.
5. **A promessa “nada sai do seu navegador” é mais ampla que a realidade.**
   O app carrega fontes do Google (fonts.googleapis.com/gstatic) e é servido
   pelo Vercel; áudio e capa não são enviados, mas a frase absoluta não é
   literalmente verdadeira. Ver `ACCESSIBILITY_PERFORMANCE_PRIVACY.md`.
6. **Não há indicação do formato de saída.** O usuário só descobre que o
   arquivo será WebM (VP9/Opus) depois de gravar; não há aviso antes.

## Cenário 2 — Criar o primeiro vídeo

Roteiro executado sem consultar o código:

| # | Ação | Observação |
|---|---|---|
| 1 | Abrir o app | Stage anima, cartão vazio cobre o texto. |
| 2 | Rolar até Fonte | No móvel é obrigatório; no desktop já está visível. |
| 3 | Carregar áudio | Botão abre seletor; status “Decodificando áudio...”; depois “Áudio pronto. Duração 01:37. Ritmo detectado: 81 BPM.” |
| 4 | Carregar capa | Sem miniatura na Fonte; só o nome do arquivo. O Stage atualiza a arte. |
| 5 | Escolher trecho | Dois sliders (Início/Duração) sem waveform e sem seleção visível; passo de 0,5 s. |
| 6 | Escolher composição | Cards pequenos; 5 dos 8 layouts **não selecionam** (ver BUG-01). |
| 7 | Personalizar | Paleta automática, seis sliders visuais, glitch, textos. |
| 8 | Pré-visualizar | Play no transporte; não há “tocar somente o trecho selecionado”. |
| 9 | Configurar formato | 9:16/1:1/16:9, 1080/720, 30/60 fps; 16:9 fica distorcido (BUG-02). |
| 10 | Gravar | É preciso rolar ~3.500 px na coluna ou tabular por 62 controles. |
| 11 | Pré-visualizar arquivo | Painel de gravação exibe vídeo, tamanho, resolução e duração. |
| 12 | Baixar | Link “Baixar vídeo”; nome correto. |

Interações mínimas para o caminho feliz: cerca de **8 cliques + 2 seleções de
arquivo + rolagem longa**, sem contar ajustes criativos. O caminho é executável,
mas a descoberta do botão de gravação é o maior atrito.

### Onde o usuário pode travar

- **Não encontra a gravação** (P1, UX-01). A seção `GRAVAÇÃO` está depois de
  Fonte, Composição, Storyboard, Paleta, Trecho, Visual, Tipografia e Formato
  no DOM e na coluna. Em 1440×900, `recordTop=3515` e a
  coluna tem 3.581 px de scroll; em 1024×768, `recordTop=3514`; em 390×844,
  `recordTop=4205`. Nenhum CTA fixo ou atalho leva até ele.
- **Escolhe um layout que não funciona** (P1, BUG-01). T1, T2, T6, T7 e T8 não
  alteram o template; o card anterior continua marcado. O usuário interpreta
  como app quebrado.
- **Julgamento errado do formato** (P1, BUG-02). Em 16:9 o Stage mede
  952×723 (razão 1,317) para um canvas 1920×1080 (1,778). A prévia é esticada.
- **Áudio curto engana** (P2, BUG-03). Com um arquivo de 2 s, o app mostra
  “Duração 00:02”, mantém o slider de duração em 5 s e **habilita** a gravação;
  só ao clicar aparece “muito curto (mínimo de 5s)”.
- **Estado vazio bloqueia a composição** (P2, UX-03): o cartão cobre o texto do
  vídeo justamente na primeira impressão.

## Cenário 3 — Alterar um projeto existente

Testado com áudio, capa e uma gravação concluída:

- **Trocar áudio**: funciona; o arquivo anterior é substituído e o status é
  recalculado (BPM/duração). O trecho é re-clampado pelo store.
- **Trocar capa**: funciona e a paleta automática é reextraída.
- **Trocar composição**: falha em 5 de 8 cards (BUG-01); T3/T4/T5 funcionam.
- **Trocar proporção**: 1:1 fica correto (723×723); 16:9 fica esticado
  (BUG-02).
- **Trocar resolução/FPS**: os controles respondem; não foi gravado 720p/60 fps.
- **Gravar novamente**: funciona; o preview anterior é descartado e um novo
  arquivo é gerado.
- **Cancelar gravação**: funciona; o preview some e o botão volta a
  “Gravar trecho”.
- **Descartar preview**: botão existe; não foi testado em sequência longa.
- **Alterar configurações durante REC**: o fieldset é desabilitado no código;
  não foi exercitado manualmente neste teste.

Consequências inesperadas observadas:

- O layout selecionado pode não corresponder ao card clicado, sem erro visível.
- A duração do trecho pode ser maior que o áudio disponível (2 s → slider 5 s).
- O preview 16:9 não representa a composição que será gravada.

## Cenário 4 — Recuperação de erros

| Caso | Resultado | Avaliação |
|---|---|---|
| Arquivo de áudio inválido | “O navegador não conseguiu decodificar este áudio. Tente MP3, WAV ou OGG.”; campo volta a “Nenhum arquivo”; gravação desabilitada. | Bom: erro claro e estado limpo. |
| Áudio de 2 s | Carrega como “pronto”; gravação habilitada; erro só ao clicar. | Ruim: validação tardia e contraditória. |
| Gravar sem áudio | Botão desabilitado + aviso “Carregue um áudio para habilitar a gravação.” | Bom. |
| Gravação sem frames (automação/aba oculta) | “A gravação terminou sem conteúdo. Verifique se o Stage estava visível e tente novamente.” | Mensagem correta, mas o usuário perde o trabalho e não há fallback. |
| Remover áudio | Volta ao estado vazio; gravação desabilita. | Bom. |
| Sem projeto salvo | Não há persistência na produção; recarregar perde tudo. | Lacuna de produto (MISSING-01). |

## Atritos priorizados

| ID | Atrito | Severidade |
|---|---|---|
| UX-01 | CTA de gravação fora da dobra e após 62 focáveis | P1 |
| BUG-01 | Cinco cards de layout sem efeito | P1 |
| BUG-02 | Preview 16:9 distorcido | P1 |
| QUALITY-01 | Título e artista se sobrepõem no layout padrão | P1 |
| UX-03 | Cartão vazio cobre a composição | P2 |
| BUG-03 | Áudio curto habilita gravação que sempre falha | P2 |
| UX-05 | Falta de onboarding/ordem do fluxo | P2 |
| UX-04 | Tipografia densa (76 de 137 textos abaixo de 12 px) | P2 |
| MISSING-01 | Sem salvar/retomar projeto na produção | P2 |

## Conclusão

Um usuário atento consegue criar e baixar um vídeo válido com T3/T4/T5 e 9:16,
mas **não consegue descobrir o produto inteiro com facilidade**: a ação
principal está escondida, cinco layouts prometidos não funcionam, o formato
alternativo engana e o primeiro estado cobre a composição. A primeira
experiência precisa de hierarquia e de correções funcionais antes de polimento.
