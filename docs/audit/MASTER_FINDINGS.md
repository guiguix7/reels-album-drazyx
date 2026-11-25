# Achados consolidados — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Alvo: https://reels-album-drazyx.vercel.app/ (produção)
Veredito: **Functional but needs important improvements** (funciona, mas precisa
de melhorias importantes antes de ser considerado pronto para uso recorrente).

## Scorecard (0–5)

| # | Dimensão | Nota | Justificativa curta |
|---|---|---|---|
| 1 | Clareza da proposta | 2,5 | “Visualizer + capa → vídeo” é compreensível, mas o fluxo e o formato de saída não são explicados. |
| 2 | Onboarding / primeira experiência | 2,0 | Sem etapas, CTA de gravação fora da dobra, estado vazio cobre a composição. |
| 3 | Eficiência do fluxo | 2,0 | 3.581 px de painel, 62 focáveis, duas seleções de arquivo e rolagem longa para exportar. |
| 4 | Descoberta da ação principal | 2,0 | Gravar em y≈3.515 (desktop) e 4.205 (mobile); sem CTA fixo. |
| 5 | Funcionalidade | 2,5 | Upload, capa, 3 layouts, 1:1 e export 9:16 funcionam; 5/8 layouts e 16:9 falham. |
| 6 | Feedback e recuperação | 3,0 | Mensagens de erro boas (áudio inválido, gravação vazia), mas sem `aria-live` e com validação tardia de áudio curto. |
| 7 | Qualidade visual do editor | 3,0 | Identidade forte e coerente; texto pequeno, sobreposição e densidade. |
| 8 | Qualidade audiovisual | 2,5 | Atmosfera boa, mas 3 composições reais, colisão de texto, fantasmas e pouco hook. |
| 9 | Utilidade criativa | 2,5 | Resolve o básico; sem waveform, presets salvos, safe area ou plataforma. |
| 10 | Confiabilidade do export | 4,0 | WebM 1080×1920 VP9/Opus válido, com áudio, na aba visível; falha se a aba oculta. |
| 11 | Acessibilidade | 2,0 | Contraste 3,79:1 no CTA, alvos pequenos, canvas sem nome, 0 live regions, movimento não pausável. |
| 12 | Performance | 2,5 | Carga razoável (~215 KB, DCL 483–629 ms), mas preview em 1080 e loop contínuo; FPS não medido em GPU real. |

**Média: 2,5/5.** O produto é mais forte do que a média dos apps “AI video
maker” em identidade e em honestidade de export; é mais fraco em hierarquia de
fluxo, cobertura de layouts e acessibilidade.

Não há **P0** (perda de dados, falha de segurança ou export totalmente
inutilizável). Há cinco P1 que impedem considerar o deploy pronto.

## Achados P1

### BUG-01 — Cinco dos oito layouts não aplicam

- **Categoria**: funcional / confiança.
- **Severidade**: P1.
- **Reprodução**: carregar áudio; clicar em T1, T2, T6, T7 ou T8; observar
  `aria-selected` e o Stage.
- **Esperado**: o card clicado fica selecionado e o Stage muda.
- **Atual**: T1/T2 mantêm MIRAGE; T6/T7/T8 mantêm T5. Nenhum erro é exibido.
- **Evidência**: `evidence/aspect-a11y-report.json` (`layoutT6: ["01 MIRAGE"]`),
  screenshots `layout-1`, `layout-2`, `layout-6`, `layout-7`, `layout-8`.
- **Impacto**: quebra a principal promessa de variedade; o usuário conclui que
  o app está quebrado e pode desistir. A documentação diz “oito layouts”.
- **Causa provável**: `TEMPLATE_IDS` em
  `src/features/project/project.defaults.ts` contém apenas
  `mirage, afterimage, void, spectrum, t3, t4, t5`; `setTemplate` rejeita os
  ids ausentes, embora a galeria renderize oito cards.
- **Correção sugerida**: incluir `t1,t2,t6,t7,t8` na lista (ou derivar a lista
  do registry), validar no store e adicionar teste de aceitação por card.
- **Complexidade**: S (código) + S (teste). **Confiança**: alta.

### BUG-02 — Prévia 16:9 esticada

- **Categoria**: UI / fidelidade da prévia.
- **Severidade**: P1.
- **Reprodução**: 1440×900; clicar “16:9 WIDE”; medir canvas e contêiner.
- **Esperado**: contêiner com razão 1,778 (ex.: 952×535) ou letterbox.
- **Atual**: canvas 1920×1080, contêiner 952×723 (razão 1,317); a imagem é
  esticada verticalmente.
- **Evidência**: `evidence/aspect-a11y-report.json`.
- **Impacto**: o usuário avalia uma composição que não corresponde ao arquivo
  final; textos e capa parecem maiores/mais altos.
- **Causa provável**: `.stageInner` com `height:100%`, `max-width:100%` e
  `aspect-ratio` inline; o `max-width` limita só a largura e não reajusta a
  altura.
- **Correção sugerida**: contêiner flex com `max-height:100%`, `width:auto`,
  `aspect-ratio` e `object-fit: contain`; testar 1440×900 e viewport alta.
- **Complexidade**: S. **Confiança**: alta.

### UX-01 — Ação de gravação enterrada

- **Categoria**: UX / hierarquia.
- **Severidade**: P1.
- **Reprodução**: abrir em 1440×900; rolar o painel até o fim; repetir no móvel.
- **Esperado**: CTA de exportar sempre visível ou no topo do fluxo.
- **Atual**: `recordTop=3515` (1440×900), `3514` (1024×768), `4205` (390×844);
  painel com 62 focáveis; sem atalho/CTA fixo.
- **Evidência**: `evidence/quick-report.json`; `01-empty-desktop-1440.jpg`.
- **Impacto**: o objetivo do produto não é descoberto; usuários podem achar
  que é só um preview.
- **Causa provável**: `RecordPanel` renderizado depois de todos os painéis em
  `EditorLayout.tsx`.
- **Correção sugerida**: barra fixa “Gravar trecho” no Stage (desktop) e botão
  fixo no rodapé (mobile), com estado de progresso; manter painel detalhado.
- **Complexidade**: S/M. **Confiança**: alta.

### PRODUCT-01 — Deploy desatualizado em relação ao repositório

- **Categoria**: produto / release.
- **Severidade**: P1.
- **Reprodução**: comparar bundle servido (`index-CWnQNSHb.js`) com o build
  local (`index-DcRn0TYS.js`); procurar MOVIMENTO, RECIPES, BATCH CREATOR,
  RETENTION LAB e perfis de plataforma.
- **Esperado**: produção com o conjunto anunciado no README/PROGRESS.
- **Atual**: produção em `main` (`9219577`), sem as fases 4–8; os textos e
  painéis não existem no bundle.
- **Impacto**: dois produtos diferentes; correções e recursos já feitos não
  chegam ao usuário; auditoria de produção não representa o branch.
- **Causa provável**: processo de release parou no merge do PR #1; features
  ficaram no branch `feat/retention-driven-visualizer`.
- **Correção sugerida**: pipeline de release com gate de testes, deploy do
  branch após QA e verificação de hash do bundle; documentar versão na UI.
- **Complexidade**: S (processo) / M (QA do branch). **Confiança**: alta.

### QUALITY-01 — Título e artista se sobrepõem no template padrão

- **Categoria**: qualidade audiovisual.
- **Severidade**: P1.
- **Reprodução**: T1 (MIRAGE) com “WAKE UP (SLOWED + REVERB)” e “DRAZYX”;
  gerar preview/export.
- **Esperado**: linhas sem colisão, com espaçamento e/ou redução de corpo.
- **Atual**: a segunda linha do título cobre o artista; visível no preview do
  arquivo.
- **Evidência**: `evidence/flow-03-export-preview.jpg`.
- **Impacto**: o arquivo final — principal entrega — sai com texto ilegível no
  caminho padrão.
- **Causa provável**: posições fixas de tipografia no template, sem medição de
  altura/colisão.
- **Correção sugerida**: medir o bloco de texto, limitar linhas, ajustar corpo/
  leading e mover o artista dinamicamente; teste visual com títulos curtos e
  longos.
- **Complexidade**: M. **Confiança**: alta.

## Achados P2

### BUG-03 — Áudio curto habilita gravação que sempre falha

- **Categoria**: validação / feedback.
- **Reprodução**: áudio de 2 s; painel mostra “Duração 00:02”, slider
  `min=max=5`, botão habilitado; clique → “muito curto (mínimo de 5s)”.
- **Evidência**: `evidence/aspect-a11y-report.json`; sessão visível.
- **Impacto**: promessa contraditória; o usuário só descobre depois de clicar.
- **Correção**: desabilitar com explicação ou permitir mínimo de 2 s; clampar
  o slider ao áudio real. **Complexidade**: S.

### MISSING-02 — Sem waveform para escolher o trecho

- **Categoria**: utilidade.
- **Atual**: dois sliders (início/duração), passo 0,5 s, sem forma de onda.
- **Impacto**: escolher o drop/refrão às cegas; é a maior lacuna criativa.
- **Correção**: waveform com seleção arrastável, zoom e prévia do trecho.
  **Complexidade**: M/L.

### UX-03 — Estado vazio cobre a composição

- **Categoria**: UI.
- **Atual**: cartão “SEM ÁUDIO CARREGADO” sobrepõe título/artista em todos os
  viewports (`emptyOverlapsStage=true`).
- **Impacto**: primeira impressão mostra texto ilegível; parece bug de layout.
- **Correção**: estado integrado ao Stage ou abaixo da tipografia. **S**.

### UX-04 — Texto pequeno e painel denso

- **Categoria**: UI / legibilidade.
- **Atual**: 76/137 textos <12 px (9,5–11 px); nove seções em uma coluna.
- **Impacto**: leitura difícil em 1024×768 e mobile; fadiga.
- **Correção**: mínimo 12 px, agrupar avançados, revelar sob demanda. **M**.

### ACCESS-01 — Alvos de toque pequenos

- **Categoria**: acessibilidade.
- **Atual**: botões de 25–34 px; thumb de slider 14 px.
- **Correção**: 44×44 px em mobile, área de toque ampliada. **S**.

### ACCESS-02 — Contraste do botão primário

- **Categoria**: acessibilidade.
- **Atual**: `#FFFFFF` sobre `#B84DFF` = 3,79:1 (reprova AA para 12 px).
- **Correção**: accent mais escuro ou texto escuro. **S**.

### ACCESS-03 — Sem anúncio de status e canvas sem nome

- **Categoria**: acessibilidade.
- **Atual**: 0 `aria-live`/`role=status`; canvas sem `aria-label`/`role`.
- **Correção**: live regions para upload/gravação; nomear canvas e resumir a
  cena. **S**.

### PERF-01 — Preview em resolução cheia e loop contínuo

- **Categoria**: performance.
- **Atual**: canvas 1080×1920 no preview móvel; RAF contínuo; sem benchmark de
  FPS em GPU real.
- **Correção**: escala adaptativa garantida, pausa fora da viewport/áudio,
  orçamento de FPS. **M**.

### QUALITY-02 — Fantasmas de capa em T3/T5

- **Categoria**: acabamento.
- **Atual**: “MY MIRAGE”/“REMIXES” atrás do texto, parecendo watermark.
- **Correção**: reduzir opacidade/remover ou transformar em intenção clara. **S**.

### QUALITY-03 — T1/T2 quase indistintos

- **Categoria**: variedade.
- **Atual**: waveforms de T2 quase invisíveis; mesmas posições.
- **Correção**: diferenciar composição, não só efeito. **M**.

### QUALITY-04 — T4 com metade inferior vazia

- **Categoria**: composição.
- **Atual**: bloco superior, vazio grande embaixo.
- **Correção**: reequilibrar ou usar o vazio como decisão clara. **S/M**.

### PRIVACY-01 — “Nada sai do seu navegador” absoluto

- **Categoria**: privacidade / copy.
- **Atual**: mídia é local, mas Google Fonts e Vercel recebem requests.
- **Correção**: “Seu áudio e sua capa não saem do navegador” ou self-host das
  fontes. **S**.

### MISSING-01 — Sem salvar/retomar projeto na produção

- **Categoria**: utilidade.
- **Atual**: recarregar perde áudio, capa, ajustes e gravação.
- **Correção**: persistência local (IndexedDB) + autosave + “meus projetos”.
  **M** (o branch já tem base).

### UX-05 — Falta de onboarding/ordem

- **Categoria**: UX.
- **Atual**: todas as decisões apresentadas de uma vez; nenhum passo.
- **Correção**: trilha 1 Fonte → 2 Estilo → 3 Trecho → 4 Texto → 5 Exportar,
  com progressive disclosure. **M**.

## Achados P3

| ID | Achado | Correção |
|---|---|---|
| UX-06 | Sem undo/redo | Histórico de configurações, pelo menos para texto/visual. |
| UX-07 | Sem crop/miniatura da capa | Editor de enquadramento e thumbnail no painel Fonte. |
| UX-08 | Jargão sem ajuda | Tooltips e exemplos para TRACKING, FULL 1080, HOOK. |
| ACCESS-04 | `prefers-reduced-motion` não para o canvas | Botão “pausar movimento” e redução real no engine. |
| UI-01 | Stage usa 41% do quadro em 1440 | Aumentar o vídeo ou reduzir a moldura. |
| QUALITY-05 | CTA estático, sem entrada | Animação de CTA e teste de área segura. |
| MISSING-03 | Sem presets de plataforma | Reels/TikTok/Shorts/Feed com formato e safe area. |
| DOC-01 | README/PROGRESS superestimam o deploy | Marcar recursos por versão/ambiente. |
| TEST-01 | Sem E2E de navegador | Playwright + axe + regressão visual. |
| PERF-02 | Loop não pausa sem áudio/fora da tela | Economia de bateria. |

## O que está bom e deve ser preservado

- **Export real funciona**: WebM 1080×1920, VP9/Opus, 5,099 s, 1,82 MB, com
  áudio decodificado. É a prova de que o núcleo é viável.
- **Identidade visual**: consistente, autoral, sem cara de template genérico.
- **Erros de arquivo**: mensagem clara e estado limpo para áudio inválido.
- **Cancelar/regravar**: o fluxo de gravação se recupera.
- **Responsividade sem overflow**: 360–1920 px sem quebra horizontal.
- **Código organizado**: store, engine e componentes separados; suíte unitária
  verde; base para corrigir sem reescrever.

## Hipóteses vs. fatos

Fatos medidos: BUG-01, BUG-02, BUG-03, QUALITY-01, UX-01, contraste, tamanhos,
performance de carga, export, rede. Hipóteses (não confirmadas com usuários):
impacto de retenção do CTA, preferência por waveform, eficácia do storyboard.
Não trate hipóteses como resultados de pesquisa.

## Limitações da auditoria

- Sem teste com usuários reais, leitor de tela ou Firefox/Safari.
- Sem FPS em GPU real; sem `ffprobe` do arquivo remoto.
- 720p/60 fps/30 s não gravados; seek não conclusivo.
- Produção desatualizada: os achados valem para o bundle servido.
- Uma sessão de gravação bem-sucedida; não é teste de estresse.

## Conclusão

O DRAZYX tem um núcleo real e uma identidade acima da média, mas o deploy atual
**não entrega a variedade que anuncia, esconde a ação principal, distorce uma
prévia e exporta texto sobreposto no caminho padrão**. Corrigir os cinco P1 é
barato perto do valor: restaura a confiança, alinha produção e repositório e
torna o produto utilizável de ponta a ponta.
