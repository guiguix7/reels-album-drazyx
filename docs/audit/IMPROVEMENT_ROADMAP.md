# Roadmap de melhorias — DRAZYX

Data: 2026-11-25
Base: achados desta auditoria; nenhuma correção de produção foi implementada.
Ordem: impacto para o usuário × custo × dependências. Não é uma estimativa de
prazo.

## Princípios

1. Primeiro fazer o que existe funcionar (layouts, 16:9, 45 s, preview).
2. Depois simplificar as interfaces confusas (storyboard, Visual, gravação).
3. Depois criar composições específicas por formato e o modo música completa.
4. Por último, a camada de customização total — mas com o modelo certo desde
   o início.
5. Nenhuma declaração de sucesso sem arquivo/gravação verificada.

## Backlog priorizado — 15 itens

| # | Melhoria | Achado | Impacto | Esforço | Depende de |
|---:|---|---|---|---|---|
| 1 | Corrigir o registro dos 8 layouts | TPL-01 | Alto | S | — |
| 2 | Corrigir a razão do Stage 16:9 | LAND-01 | Alto | S | — |
| 3 | Implementar 45 s de ponta a ponta | CLIP-01 | Alto | M | #1 |
| 4 | Fazer “Tocar cena” parar no fim | SB-02 | Alto | S | — |
| 5 | Microcopy e agrupamento do Visual | VIS-01/02 | Alto | S | — |
| 6 | CTA de gravação fixo e painel enxuto | UX-01/02 | Alto | S/M | — |
| 7 | Storyboard: faixa de cenas + inspector + timeline | SB-01/03/04/05 | Alto | M/L | #4 |
| 8 | Composições 1:1 dedicadas e correção de T6–T8 | SQ-01..05 | Alto | M | #1 |
| 9 | Modo FULL MUSIC VIDEO + recorder longo | LAND-02/06 | Muito alto | XL | #2, #3 |
| 10 | Sistema de composições paisagem | LAND-03/07 | Muito alto | XL | #2, #9 |
| 11 | Modelo de elementos + seleção direta | CUST-01/05 | Muito alto | XL | #7 |
| 12 | Inspector, camadas e tipografia por elemento | CUST-02/03/06 | Alto | L | #11 |
| 13 | Player configurável | LAND-04 | Médio/alto | M/L | #10, #11 |
| 14 | Presets customizados + export/import | CUST-04 | Médio | M | #11 |
| 15 | Acessibilidade e regressão dos fluxos críticos | A11Y/TEST | Médio | M | contínuo |

Itens 1–6 são **quick wins** de alto impacto e baixo custo; devem entrar antes
de qualquer redesign grande. Itens 9–12 são estruturais e exigem contratos
antes de paralelizar.

## Fase 1 — Correções fundamentais (P1)

### 1.1 Layouts selecionáveis

- Derivar `TEMPLATE_IDS` de `TEMPLATE_REGISTRY`.
- Testar os oito cards: clique → `aria-selected` → `templateId` → canvas.
- Remover ids legados mortos (`t1`, `t2`, `t6`–`t8` não devem ser rejeitados).

**Aceite:** 8/8 layouts selecionáveis em 9:16, 1:1 e 16:9.

### 1.2 Stage 16:9 correto

- Corrigir CSS para respeitar `aspect-ratio`; letterbox.
- Teste de razão nos três formatos.

**Aceite:** 1432×805 (ou equivalente) para 16:9; razão 1,778 ±0,005.

### 1.3 45 segundos

- `MAX_CLIP_SECONDS = 45`.
- Limite efetivo `min(45, duration - clipStart)`.
- UI com máximo dinâmico; storyboard 15/30/45; testes e nomes.
- Áudio curto: bloquear ou permitir coerente com o mínimo.

**Aceite:** 45 s aceito perto do início; reduzido perto do fim; 45,1
rejeitado; gravação usa o range exato.

### 1.4 Preview de cena

- `playRange(start,end)` com stop no fim; botão parar.
- Teste: 3 s de cena → áudio para em 3 s.

### 1.5 Gravação visível

- CTA fixo no Stage/rodapé, sem depender do scroll de 13 painéis.
- Estado de gravação claro; erro acionável.

## Fase 2 — Interfaces confusas (P1/P2)

### 2.1 Storyboard

- Faixa compacta de cenas (miniatura, papel, duração, play).
- Uma cena selecionada; inspector único.
- Timeline clicável, com segmentos, rótulos e foco.
- Duração com regra explícita; desfazer.
- “Tocar história” com destaque da cena e stop no fim.
- Remover duplicação do hook global.

**Aceite:** painel ≤700 px; 1 clique para selecionar; 0 campos duplicados;
preview limitado à cena; teste de teclado.

### 2.2 Painel Visual

- Descrição de uma linha por controle; tooltip com exemplo.
- Grupos: Movimento, Reação ao áudio, Luz e textura, Efeitos.
- Renomear “Brilho” → “Glow”; “Câmera” → “Velocidade da câmera”.
- Reset individual e indicador de alterado.

### 2.3 Seleção de trecho

- Waveform clicável, seleção arrastável, tempo restante visível.
- Snap opcional a batidas.
- Preview do range.

### 2.4 Painel

- Reordenar seções por frequência de uso: Fonte, Composição, Trecho, Visual,
  Storyboard, Tipografia, Formato, Gravação, Projetos, avançados.
- Recolher seções; lembretes de estado.
- Alvos ≥44 px, texto ≥12 px, contraste.

## Fase 3 — Formatos e produção (P0/P1)

### 3.1 Quadrado dedicado

- Grid e zonas de texto por layout; capa 1:1; sem sobreposição.
- Corrigir T6 (corte), T7 (linha), T8 (comb), T3/T4 (vazio).
- Teste visual e de contraste nos oito layouts.

### 3.2 Modo FULL MUSIC VIDEO

- `productionMode` explícito; duração do áudio; sem cap de 45 s.
- Recorder em chunks, progresso, cancelamento, stop no fim real.
- Teste com faixa completa; verificar arquivo, áudio e duração.
- UI de produção longa, aviso de memória, codec real.

### 3.3 Composições paisagem

- Pelo menos 3 direções distintas: Cinematic Artwork, Editorial Player,
  Atmospheric Wide/Minimal.
- Grid horizontal, safe area, tipografia, espaço negativo.
- Corrigir MIRAGE/AFTERIMAGE/SPECTRUM para não estourar a altura.

### 3.4 Player e câmera

- Player como elemento configurável, progresso/tempo reais.
- Câmera com presets (dolly, track, orbit, parallax, static, handheld),
  intensidade/velocidade/easing; keyframes depois.

## Fase 4 — Customização total (P0 de produto)

### 4.1 Modelo

- `VisualElement`, `SceneComposition`, `TypographyStyle`, `ElementMotion`.
- Templates como factories de composição; migração versionada.

### 4.2 Edição direta

- Overlay de seleção, mover/redimensionar/rotacionar, snap, teclado.
- Inspector contextual; camadas; visibilidade/bloqueio.
- Tipografia e animação por elemento.

### 4.3 Biblioteca e presets

- Cover, textos, waveform, spectrum, player, frame, background, imagem.
- Salvar/aplicar/duplicar/exportar/importar; restaurar padrão.
- Não sobrescrever presets originais.

**Aceite:** Test D completo (mover capa, redimensionar, adicionar texto,
fonte/cor, camada, waveform, animação, salvar/recarregar) sem código.

## Fase 5 — Qualidade de produção (P2/P3)

- Performance: FPS em 1080p/60, memória, partículas, longa duração.
- Acessibilidade: live regions, canvas nomeado, timeline focável, contraste,
  reduced motion, alvos.
- Cross-browser: Firefox/Safari, codecs, autoplay.
- Regressão: testes de UI/e2e para layouts, formatos, 45 s, storyboard,
  gravação, download e modos.
- Release: publicar o branch; versionar o bundle.

## Estratégia de testes

### Unitários

- `getClipBounds` (5/45/restante/áudio curto).
- Seleção de template para os 8 ids.
- `playRange`/stop no fim (com fake timers).
- Serialização/migração de `SceneComposition`.

### Integração/UI

- Clicar cada card → template ativo + canvas.
- Cada formato → razão do Stage.
- 45 s → store/UI/recorder coerentes.
- Storyboard → selecionar, editar, reordenar, preview limitado.
- Elemento → mover, redimensionar, camada, salvar preset, reload.

### Manual/real

- Gravar 5 s, 45 s e faixa completa; abrir os três arquivos.
- 1:1 e 16:9; 30/60 fps; 720/1080.
- Aba oculta/visível; cancelar gravação; erro de codec.
- Leitor de tela e teclado.

## Critérios de não-regressão

- O fluxo upload → preview → trecho → gravação → download continua funcionando
  em 9:16.
- Nenhum overlay de edição aparece na gravação.
- Nenhuma gravação é declarada válida sem áudio, duração e resolução
  verificados.
- Nenhum preset original é sobrescrito por custom.

## O que não fazer

- Não trocar 30 por 45 apenas no slider.
- Não adicionar 50 sliders ao painel atual.
- Não redesenhar todos os templates antes de corrigir o registry e o 16:9.
- Não prometer full song sem gravar uma faixa completa.
- Não declarar customização total enquanto posição/camada/fonte estiverem
  hardcoded.
- Não publicar sem atualizar o deploy.

## Sequência recomendada

1. **Semana de correções:** #1–#6.
2. **Redesenho do storyboard e do painel:** #7.
3. **Formatos:** #8; em paralelo, contrato do modo FULL e do recorder.
4. **Full song + paisagem:** #9–#10.
5. **Customização:** #11–#14.
6. **Qualidade contínua:** #15.

O produto só deve ser chamado de “estúdio de music video” depois das fases 3 e
4. Até lá, é um gerador de clipes verticais com boa base técnica.
