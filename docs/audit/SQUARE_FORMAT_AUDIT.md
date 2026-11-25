# Auditoria do formato quadrado — 1080×1080

Data: 2026-11-25
Método: 1:1 no build atual; oito layouts forçados no engine (T6–T8 não são
acessíveis pela UI), capturas `local-11-t1..t8.jpg`.

## Resumo

O 1:1 não é uma composição dedicada. É o mesmo sistema de coordenadas do 9:16
dentro de um quadrado, com `min()` para evitar estouro. O resultado funciona em
T1 e T5, fica top-heavy em T3/T4 e quebra em T6/T7/T8.

**Não reproduzi texto totalmente invisível** atrás da capa nos layouts
acessíveis. O que existe é: (a) texto sobre a arte, com risco de contraste;
(b) capa recortada em T6; (c) metadados encostando/sobrepondo a capa em T7/T8;
(d) grandes vazios em T3/T4. A hipótese do usuário — “texto desaparece atrás da
arte” — é plausível em capas claras ou densas, mas não foi observada como
oclusão total; o problema real é ausência de regras de composição quadrada.

## Medições

- Canvas render: 756×756; CSS 903×903 → razão 1,000 (correto).
- 1:1 com T1/T5: capa legível, metadados separados.
- T3/T4: ~35–45% da metade inferior sem conteúdo.
- T6: capa com proporção ~0,78, laterais cortadas; título na base da capa.
- T7: linha horizontal atravessa a capa; “DRAZYX” acima do título.
- T8: comb de barras flutuando; título encosta na base da capa.

## Achados

### SQ-01 — Falta composição quadrada intencional

- **Categoria:** CREATIVE QUALITY / ARCHITECTURAL LIMITATION.
- **Severidade:** P1.
- **Feature:** formatos / templates.
- **Reprodução:** selecionar 1:1 e percorrer T1–T5; forçar T6–T8.
- **Esperado:** cada layout com hierarquia, margens e uso de área pensados para
  1080×1080.
- **Atual:** templates calculam posições com `viewW/viewH` e restrições
  genéricas; não há ramo específico para quadrado, exceto ajustes pontuais.
- **Evidência:** `local-11-t1..t8.jpg`; código de `layout03/04/06/07/08`.
- **Impacto:** o feed recebe uma sobra do vertical; a peça parece não
  finalizada e perde hierarquia.
- **Correção:** composições quadradas dedicadas (não escala): grid 3×3 com
  safe area, capa como âncora, texto em zona própria, no máximo dois elementos
  competindo.
- **Complexidade:** M. **Confiança:** alta.

### SQ-02 — T6 corta a capa e sobrepõe título

- **Categoria:** CREATIVE QUALITY / BUG.
- **Severidade:** P2.
- **Reprodução:** forçar T6 em 1:1 (engine; UI rejeita o card).
- **Esperado:** capa quadrada inteira, título em zona separada.
- **Atual:** capa em proporção ~0,78, laterais cortadas; título imediatamente
  sobre a base da arte; contraste depende da capa.
- **Evidência:** `local-11-t6.jpg`; `layout06.ts` (capa 0,78, recorte).
- **Impacto:** a informação principal (arte) é mutilada; o título perde
  legibilidade em capas claras.
- **Correção:** capa 1:1 ou moldura intencional; reservar faixa de texto;
  teste de colisão e contraste.
- **Complexidade:** S/M. **Confiança:** alta.

### SQ-03 — T7/T8: linha/comb flutuantes e metadados na arte

- **Categoria:** CREATIVE QUALITY / UI.
- **Severidade:** P2.
- **Reprodução:** forçar T7 e T8 em 1:1.
- **Esperado:** espectro integrado à composição; hierarquia artista antes do
  título; margem entre texto e capa.
- **Atual:** T7 tem uma linha fina atravessando a capa (parece risco, não
  espectro); T8 tem um comb de barras solto acima da capa; em ambos o texto
  encosta na arte.
- **Evidência:** `local-11-t7.jpg`, `local-11-t8.jpg`.
- **Impacto:** elementos parecem debug/3D inacabado; a capa e o texto competem.
- **Correção:** reposicionar espectro como moldura/rodapé; afastar metadados;
  remover o comb se não houver função.
- **Complexidade:** S/M. **Confiança:** alta.

### SQ-04 — T3/T4 top-heavy e vazios

- **Categoria:** CREATIVE QUALITY.
- **Severidade:** P2.
- **Reprodução:** T3/T4 em 1:1.
- **Esperado:** distribuição vertical intencional; capa e texto ocupando o
  quadrado.
- **Atual:** conteúdo concentrado no topo; 35–45% inferior vazio; T4 ainda tem
  uma coluna de waveform tipo código de barras à esquerda.
- **Evidência:** `local-11-t3.jpg`, `local-11-t4.jpg`.
- **Impacto:** a peça parece um recorte horizontal colado no feed.
- **Correção:** reposicionar bloco para o centro óptico; usar rodapé para CTA
  ou espectro; remover barcode sem função.
- **Complexidade:** M. **Confiança:** alta.

### SQ-05 — Texto sobre arte sem regra de contraste

- **Categoria:** UI / ACCESSIBILITY.
- **Severidade:** P2.
- **Reprodução:** usar capa clara/densa em T6/T7/T8.
- **Esperado:** zona de texto protegida, scrim, contorno ou fundo; nunca
  depender da arte.
- **Atual:** texto é desenhado sobre a capa sem scrim; o contraste varia com a
  imagem. Não houve oclusão total, mas a leitura é frágil.
- **Correção:** `textSafeArea` por layout, scrim automático quando a
  luminância média atrás do texto for alta, ou composição que nunca coloque
  texto sobre a arte.
- **Complexidade:** M. **Confiança:** média-alta (visual; sem medição de
  contraste pixel a pixel).

### SQ-06 — Cinco layouts inacessíveis no quadrado

- **Categoria:** BUG.
- **Severidade:** P1 (herda TPL-01).
- **Atual:** T1/T2/T6/T7/T8 não podem ser escolhidos na UI, então a maior parte
  dos problemas quadrados não é nem experimentável pelo usuário.
- **Correção:** corrigir o registro antes de redesenhar; os testes de 1:1
  devem rodar pelos oito cards, não só pelo engine.
- **Complexidade:** S. **Confiança:** alta.

## Regras de composição propostas para 1:1

1. **Grid**: margem de 6–8% (65–86 px em 1080), safe area de 12%.
2. **Âncoras**: capa em um dos quadrantes (centro, esquerda, direita, topo),
   nunca livre sem intenção.
3. **Zonas**: texto e capa não compartilham a mesma faixa; se compartilharem,
   scrim obrigatório.
4. **Hierarquia**: artista > título > álbum > CTA; no máximo 3 níveis visíveis
   ao mesmo tempo.
5. **Capa**: sempre 1:1 ou recorte declarado; nunca esmagar/cortar sem
   indicação.
6. **Elementos**: no máximo 2 elementos decorativos competindo com a capa;
   espectro integrado (rodapé/moldura), não linha sobre a arte.
7. **Vazio**: se houver, é respiro deliberado; não pode parecer “acabou o
   conteúdo”.
8. **Adaptação**: cada template declara `compositions.square`, não herda
   coordenadas do retrato.

## Direções específicas sugeridas

- **Square Hero**: capa central 56%, texto em duas linhas abaixo, tagline no
  topo, espectro no rodapé. (Evolução de T1.)
- **Square Editorial**: capa à direita 52%, bloco de texto à esquerda, CTA no
  rodapé; sem waveform decorativa. (Evolução de T3.)
- **Square Player**: capa à esquerda 48%, player compacto à direita com
  progresso real e metadados; sem glifos falsos. (Evolução de T5.)
- **Square Frame**: capa central com moldura tipográfica e espectro como
  borda; sem linha atravessando a arte.

## Acceptance criteria

- [ ] Os oito layouts selecionáveis em 1:1.
- [ ] Nenhum texto coberto pela capa em nenhum layout.
- [ ] Capa sempre inteira ou recorte explicitamente intencional.
- [ ] Contraste do texto ≥4,5:1 na pior capa de teste (clara e escura).
- [ ] Margem mínima de 6% respeitada.
- [ ] Nenhum layout com >40% de vazio não intencional.
- [ ] Teste visual dos oito layouts em 1080×1080 no CI/manual.

## Conclusão

O quadrado precisa de **direção de arte própria**, não de um `if (square)`.
Antes disso, os cinco layouts quebrados precisam ser acessíveis para que o
usuário e o QA consigam avaliá-los. O caminho mais barato: corrigir o registry,
depois redesenhar T3/T4/T6/T7/T8 com grid e zonas de texto.
