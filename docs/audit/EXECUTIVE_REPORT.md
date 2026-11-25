# DRAZYX VISUALIZER STUDIO — auditoria avançada

Data: 2026-11-25
Produção: https://reels-album-drazyx.vercel.app/
Repositório local: branch `audit/product-quality-review` (HEAD `db77a31` + esta
auditoria), build atual `index-DcRn0TYS.js`.
Escopo: UX, UI, composição, storyboard, trecho, controles visuais, 9:16, 1:1,
16:9, modo música completa, customização, QA técnico, acessibilidade e performance.

## Veredito

**A aplicação é funcional para um clipe curto em 9:16, mas não é um estúdio de
customização nem um ambiente de music video completo.** O produto atual está no
nível “ferramenta promissora com três composições utilizáveis”, não no nível
“editor criativo com controle total”.

- O fluxo curto funciona: upload, visual, export 1080×1920 com áudio (validado
  no build atual: 5,173 s, 2,5 MB, VP9/Opus).
- **Cinco dos oito layouts não podem ser selecionados** na UI, tanto no deploy
  quanto no build atual (T1, T2, T6, T7, T8). Isso é um P1 funcional.
- **O modo música completa não existe.** O limite de 30 s está no domínio, na
  UI, nos testes e no storyboard; não há modo 16:9 de faixa inteira.
- **A customização por elemento não existe.** Posições, tamanhos, camadas,
  fontes e animações estão fixos no código de cada template; a UI só edita
  texto global, paleta e seis parâmetros visuais.
- O storyboard atual é um formulário longo, não um editor visual: 2.849 px de
  painel, 25 selects, 13 sliders, 39 botões, sem miniatura, sem seleção de cena
  e com “▶ Cena” que continua tocando depois do fim da cena.
- O 1:1 tem composições desequilibradas e sobreposições em T6/T7/T8; o 16:9 é
  exibido esticado (razão 1,586 em vez de 1,778), então nem é possível julgar
  corretamente a saída paisagem.
- O deploy público está **desatualizado** em relação ao branch: storyboard
  editável, recipes, projetos, batch e retention lab existem no repositório,
  mas não na produção.

## Scorecard (0–5)

| Dimensão | Nota | Explicação |
|---|---:|---|
| Clareza | 2,5 | O objetivo é compreensível, mas o fluxo, os formatos e o modo de produção não são explicados. |
| Usabilidade | 2,0 | 13 painéis, 7.863 px com storyboard, gravação a 7.442 px; muitas decisões antes do resultado. |
| Curva de aprendizado | 2,0 | “Hook”, “payoff”, “tracking”, “força do grave” e “câmera” não têm explicação contextual; preview de cena engana. |
| Qualidade dos templates | 2,0 | Três layouts acessíveis; T1/T2 e T7/T8 se parecem; elementos 2.5D arbitrários; vazios grandes. |
| Usabilidade do storyboard | 1,5 | Conceito bom, execução como formulário extenso, sem hierarquia visual nem preview limitado à cena. |
| Customização visual | 1,0 | Não há seleção de elemento, posição, tamanho, camada, fonte ou animação por elemento. |
| Composição 1:1 | 2,0 | T1/T5 funcionam; T3/T4 são top-heavy; T6/T7/T8 cortam arte ou sobrepõem texto. |
| Composição 16:9 | 1,0 | Preview distorcido, sem sistema paisagem dedicado, sem modo de música completa. |
| Sincronização de áudio | 3,5 | O relógio do áudio é a fonte de verdade e o export curto contém áudio; não foi medida defasagem em longa duração. |
| Confiabilidade de gravação | 2,5 | Curto 9:16 validado; longa duração e modo completo não existem/testados; gravação exige aba visível. |
| Qualidade do export | 3,5 | VP9/Opus 1080×1920 com áudio; sem validação de 16:9, 45 s, música completa ou 60 fps. |
| Utilidade geral | 2,0 | Serve para um clipe vertical simples; não serve para produção musical completa nem edição criativa. |

**Média: 2,1/5.** Avaliação geral: **insuficiente para a ambição declarada;
aceitável apenas como clipe curto vertical.**

## Achados P0 (críticos para o novo escopo)

### LAND-02 — Modo música completa inexistente

- **Categoria:** MISSING CAPABILITY / ARCHITECTURAL LIMITATION.
- **Severidade:** P0.
- **Reprodução:** carregar uma faixa; procurar “música completa”, “faixa
  inteira” ou um modo de produção. Só existe “Trecho do vídeo” com máximo 30 s.
- **Esperado:** modo 2 (16:9) com gravação da faixa inteira, duração derivada
  do áudio e progresso de export.
- **Atual:** `MAX_CLIP_SECONDS = 30`; store, UI, storyboard, batch e testes
  assumem 30 s. Não há seletor de modo, nem fluxo de longa duração.
- **Evidência:** `probe-current-build` (`setClipDuration(45)` → 30),
  `storyboard-report.json` (slider 5–30), `project.defaults.ts:8`.
- **Impacto:** o requisito mais importante do modo paisagem não pode ser
  executado; não é possível produzir um music video completo.
- **Correção:** introduzir `productionMode: 'clip' | 'full'`; em `full`, usar a
  duração do áudio, esconder o limite de 45 s e redesenhar o recorder para
  longa duração; testar uma faixa completa.
- **Complexidade:** L. **Confiança:** alta (ausência confirmada).

### CUST-01 — Customização por elemento inexistente

- **Categoria:** MISSING CAPABILITY / ARCHITECTURAL LIMITATION.
- **Severidade:** P0 (frente ao acceptance criterion de “100% pela UI”).
- **Reprodução:** tentar selecionar a capa, mover, redimensionar, alterar
  camada, adicionar texto ou escolher fonte no Stage.
- **Esperado:** seleção direta, inspector contextual, camadas, posição,
  tipografia por elemento, animação, presets customizados.
- **Atual:** o Stage é um canvas sem interação; posições e tamanhos são
  calculados no código de cada template; a UI só tem cinco textos globais,
  paleta e seis sliders visuais. Não há modelo de elementos.
- **Evidência:** `project.types.ts` (apenas `VisualSettings`/`TypeSettings`),
  `Layout01` e demais templates com `position.set(...)` fixos; relatório
  `current-build-report.json` (`hasElementSelectionHint: false`); screenshots
  `local-visual-panel.jpg` e `local-loaded-1920.jpg`.
- **Impacto:** o usuário não consegue criar uma composição visivelmente
  diferente sem editar código; a promessa central de controle criativo falha.
- **Correção:** modelo de cena/elementos, renderer de elementos, inspector,
  manipulação direta, serialização e presets (ver `UI_CUSTOMIZATION_AUDIT.md`).
- **Complexidade:** XL. **Confiança:** alta.

## Achados P1

### TPL-01 — Cinco layouts não selecionam

- **Categoria:** BUG. **Severidade:** P1.
- **Reprodução:** clicar nos cards 01, 02, 06, 07, 08.
- **Esperado:** `aria-selected` no card e troca do Stage.
- **Atual:** T1/T2 mantêm MIRAGE; T6/T7/T8 mantêm T5. Nenhum erro.
- **Evidência:** `current-build-report.json` (`uiClicks`), screenshots
  `local-916-t1..t8.jpg`.
- **Causa:** `TEMPLATE_IDS` ainda contém só `mirage, afterimage, void, spectrum,
  t3, t4, t5`; `setTemplate` rejeita os ids ausentes.
- **Correção:** derivar de `TEMPLATE_REGISTRY` e testar os oito cards.
- **Complexidade:** S. **Confiança:** alta.

### LAND-01 — Preview 16:9 distorcido

- **Categoria:** UI / BUG. **Severidade:** P1.
- **Reprodução:** 1920×1080; clicar “16:9 Wide”.
- **Esperado:** contêiner na razão 1,778.
- **Atual:** canvas 1344×756 (1,778), contêiner 1432×903 (**1,586**).
- **Evidência:** `current-build-report.json` (`stages.wide`),
  `local-169-t3.jpg`, `local-169-t5.jpg`.
- **Causa:** `.stageInner` com `height:100%` + `max-width:100%`; a largura é
  limitada sem recalcular a altura.
- **Impacto:** o usuário compõe para uma imagem esticada; decisões de
  enquadramento e tipografia no 16:9 são inválidas.
- **Correção:** `max-height:100%; width:auto; aspect-ratio` e teste de razão.
- **Complexidade:** S. **Confiança:** alta.

### SB-01 — Storyboard é um formulário, não um editor visual

- **Categoria:** UX / UI. **Severidade:** P1.
- **Reprodução:** ativar storyboard + preset 30 s.
- **Esperado:** sequência escaneável, cena selecionada, miniatura, timeline
  clicável, inspector contextual.
- **Atual:** painel de **2.849 px**, 6 cartões de ~383 px, todos expandidos; 25
  selects, 13 sliders, 39 botões, 7 campos de texto; sem miniatura, sem
  destaque de cena selecionada; timeline de 16 px é `aria-hidden`.
- **Evidência:** `storyboard-report.json`; `local-storyboard-scenes.jpg`.
- **Impacto:** o usuário se perde, não sabe qual cena está editando e não
  consegue comparar cenas.
- **Correção:** lista compacta + timeline interativa + inspector único.
- **Complexidade:** M/L. **Confiança:** alta.

### SB-02 — “Preview da cena” não respeita o fim da cena

- **Categoria:** BUG / UX. **Severidade:** P1.
- **Reprodução:** clicar “▶ Cena” na primeira cena (0–3 s).
- **Esperado:** tocar a cena e parar em 3 s.
- **Atual:** após 4,2 s, o áudio continua tocando (`playingAfter4s: true`).
- **Evidência:** `storyboard-report.json` (`scenePreview`).
- **Causa:** `previewScene` faz `seek(start)` + `play()` sem stop no `end`.
- **Impacto:** o usuário não consegue revisar uma cena isolada; avalia a
  sequência errada.
- **Correção:** `playClip(start,end)` ou stop agendado; botão “Tocar cena”.
- **Complexidade:** S. **Confiança:** alta.

### CLIP-01 — Limite de 45 s não existe

- **Categoria:** MISSING CAPABILITY. **Severidade:** P1.
- **Reprodução:** pedir 45 s via UI/store.
- **Esperado:** até 45 s, limitado ao restante do áudio.
- **Atual:** `MAX_CLIP_SECONDS = 30`; store devolve 30; slider max 30.
- **Evidência:** `storyboard-report.json` (`duration45.stored=30`),
  `local-clip-panel.jpg`, testes `project.store.test.ts`.
- **Impacto:** requisito explícito não atendido; clipes promocionais longos não
  podem ser produzidos.
- **Correção:** constante 45 + limites por restante + UI + testes + nomes.
- **Complexidade:** M. **Confiança:** alta.

### VIS-01 — Controles visuais sem descrição

- **Categoria:** UX / UI. **Severidade:** P1.
- **Reprodução:** abrir painel Visual.
- **Esperado:** descrição curta por ajuste (intensidade, partículas, grave,
  brilho, grão, câmera).
- **Atual:** apenas rótulos e porcentagens; o único texto é a descrição do
  perfil de movimento.
- **Evidência:** `local-visual-panel.jpg`; `current-build-report.json`
  (`hasPerControlDescription: false`).
- **Impacto:** o usuário não sabe o que cada controle faz; ajusta às cegas.
- **Correção:** helper/tooltip por controle e agrupamento por finalidade.
- **Complexidade:** S. **Confiança:** alta.

### SQ-01 — 1:1 sem composição específica

- **Categoria:** CREATIVE QUALITY. **Severidade:** P1.
- **Reprodução:** 1:1 + T3/T4 (e T6–T8 via engine).
- **Esperado:** composições quadradas intencionais.
- **Atual:** T3/T4 deixam ~35–45% inferior vazio; T6 corta a capa em 0,78 de
  proporção e coloca o título sobre a arte; T7/T8 têm linha/comb de barras
  flutuando sobre a capa e metadados encostados.
- **Evidência:** `local-11-t1..t8.jpg`.
- **Impacto:** o formato de feed parece uma sobra do 9:16, não uma peça
  desenhada para 1080×1080.
- **Correção:** layouts quadrados próprios e testes de colisão por formato.
- **Complexidade:** M. **Confiança:** alta.

### LAND-03 — Não existe sistema criativo paisagem

- **Categoria:** CREATIVE QUALITY / MISSING CAPABILITY. **Severidade:** P1.
- **Atual:** apenas T5 tem ramo `portrait`/`landscape`; T1/T2/T6/T7/T8
  permanecem composições verticais centralizadas; MIRAGE/AFTERIMAGE usam capa
  `viewW * 0.62/0.58` e estouram no 16:9; não há player configurável, câmera
  cinematográfica, keyframes ou modo de faixa completa.
- **Evidência:** código (`mirage.ts`, `afterimage.ts`, `spectrum.ts`,
  `t5.ts`) e screenshots `local-169-t3/t5.jpg`.
- **Impacto:** 16:9 não é um ambiente de music video; é um template vertical
  esticado.
- **Correção:** sistema paisagem dedicado (ver `LANDSCAPE_MUSIC_VIDEO_AUDIT.md`).
- **Complexidade:** XL. **Confiança:** alta.

### UX-01 — Gravação ainda enterrada

- **Categoria:** UX. **Severidade:** P1.
- **Atual (build atual):** painel de gravação em `recordTop=7442` dentro de
  `aside.scrollHeight=7863` com storyboard ativo; sem storyboard, 5.266 px.
  No deploy, 3.515 px. São 13 seções e 95 focáveis.
- **Evidência:** `storyboard-report.json`, `current-build-report.json`.
- **Impacto:** a ação final é a mais difícil de achar; o usuário pode nunca
  exportar.
- **Correção:** CTA fixo no Stage/rodapé, independente do painel.
- **Complexidade:** S. **Confiança:** alta.

### PROD-01 — Deploy público desatualizado

- **Categoria:** BUG / processo. **Severidade:** P1.
- **Atual:** produção em `main`, sem storyboard editor, recipes, projetos,
  batch e retention; bundle `index-CWnQNSHb.js`; build atual
  `index-DcRn0TYS.js`.
- **Impacto:** o usuário audita um produto antigo; correções e recursos não
  chegam. As observações de storyboard do dono não podem ser plenamente
  reproduzidas na produção, porque lá o editor não existe.
- **Correção:** pipeline de release + versionamento visível; não apenas
  “deploy manual”.
- **Complexidade:** S/M. **Confiança:** alta.

## Achados P2/P3 (resumo)

- **SB-03**: timeline sem clique/arraste e sem rótulos; `aria-hidden`.
- **SB-04**: alterar duração de uma cena redistribui todas as outras sem
  explicação; “Hook/Pico/Payoff” não são explicados.
- **CLIP-02**: sem waveform; seleção do trecho às cegas.
- **CLIP-03**: áudio de 2 s continua habilitando gravação que falha por mínimo
  de 5 s (store permite 1 s; UI/recorder exigem 5 s).
- **VIS-02**: “Brilho”, “Câmera”, “Intensidade” ambíguos; nenhum agrupamento.
- **TPL-02/03/04**: T3/T4 top-heavy; T1/T2 e T7/T8 similares; badge de T3,
  linha de T2/T7, comb de T8 e glifos de T5 parecem elementos 2.5D
  desconectados; fantasmas de capa em T3/T5.
- **SQ-02/03**: T6 corta a arte; T7/T8 sobrepõem metadados à capa.
- **LAND-04/05**: player de T5 não é configurável (só global) e tem glifos
  decorativos estranhos; câmera só tem um slider de velocidade, sem presets,
  dolly/orbit/keyframes.
- **CUST-02/03/04**: sem layers, fontes por elemento, animação por elemento,
  presets de composição; modelo atual é global e hardcoded.
- **UX-02/03**: 13 painéis, 135/215 textos <12 px, 38/50 botões <44 px.
- **A11Y-01/02/03**: 0 live regions; canvas sem nome; contraste 3,79:1 no CTA;
  movimento do canvas não pausa com reduced motion.
- **TEST-01**: 117 testes unitários não cobrem seleção de layout, formatos,
  storyboard, gravação ou acessibilidade.
- **PERF-01**: longa duração não testada; 900 partículas no MIRAGE; sem FPS em
  GPU real; storyboard eleva o DOM/scroll a 7.863 px.
- **PRIV-01**: “nada sai do seu navegador” é absoluto, mas Google Fonts e
  Vercel recebem requests.

## O que preservar

- Identidade Drazyx e direção de arte.
- Relógio de áudio como fonte de verdade e export real com áudio.
- Persistência IndexedDB, recipes, batch e retention lab (quando publicados).
- Erros claros para arquivo inválido e gravação sem frames.
- Base de testes unitários verde (117) e build enxuto (~219 kB gzip).

## Limitações desta auditoria

- Sem teste com usuários, leitor de tela, Firefox ou Safari.
- Sem FPS em GPU real; sem `ffprobe` do arquivo remoto.
- Música completa, 45 s, 60 fps, 1:1/16:9 em gravação e longa duração **não
  foram testados porque não existem ou não foram executados**; não declare
  sucesso.
- As capturas de T6–T8 foram forçadas no engine porque a UI as rejeita; elas
  mostram o código, não um caminho acessível ao usuário.

## Recomendação final

**Corrigir** a seleção dos layouts, o Stage 16:9 e o limite de 45 s.
**Redesenhar** o storyboard como timeline + cena selecionada e o painel Visual
com descrições.
**Reconstruir** as composições 1:1 e 16:9 e o modo música completa.
**Implementar** o modelo de elementos e o inspector para cumprir “100% pela
UI”.
**Preservar** a identidade, o pipeline de áudio e a persistência — a base é
boa; o que falta é liberdade criativa e clareza de produção.
