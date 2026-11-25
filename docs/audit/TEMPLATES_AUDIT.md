# Auditoria de templates e composição — DRAZYX

Data: 2026-11-25
Método: build atual (dev server local) + deploy público; capturas dos oito
layouts forçados no engine em 9:16 e 1:1, e T3/T5 em 16:9. A UI foi testada
separadamente para cada card.

## Resumo

- **Cinco dos oito layouts não são selecionáveis pela UI** (T1, T2, T6, T7, T8).
- Dos três acessíveis, **T3, T4 e T5** são distintos entre si, mas T3/T4
  compartilham o mesmo vício de composição “metade de cima, vazio embaixo”.
- **T1/T2** são quase a mesma composição; a waveform de T2 vira uma linha
  horizontal fina.
- **T6–T8** (vistos via engine) têm qualidade inferior: corte da capa,
  metadados sobre a arte e elementos flutuantes desconectados.
- O usuário tem razão ao estranhar “alguns elementos 3D”: badge de T3,
  waveform de T2/T7, comb de T8 e glifos de player de T5 parecem primitivas
  soltas, não partes da direção de arte.

## Seleção dos layouts

| Card | `aria-selected` após clique | Template ativo | Resultado |
|---|---|---|---|
| 01 Centered Hero | 01 MIRAGE | mirage | **Não seleciona** |
| 02 Stereo Frame | 01 MIRAGE | mirage | **Não seleciona** |
| 03 Offset Cinema | 03 Offset Cinema | t3 | Funciona |
| 04 Editorial Cover | 04 Editorial Cover | t4 | Funciona |
| 05 Album Player Split | 05 Album Player Split | t5 | Funciona |
| 06 Vertical Totem | 05 Album Player Split | t5 | **Não seleciona** |
| 07 Symmetric Spectrum | 05 Album Player Split | t5 | **Não seleciona** |
| 08 Monochrome Focus | 05 Album Player Split | t5 | **Não seleciona** |

**TPL-01 — BUG, P1.** `TEMPLATE_IDS` em `project.defaults.ts` ainda lista
`mirage, afterimage, void, spectrum, t3, t4, t5`; `setTemplate` descarta os
demais. A galeria renderiza oito cards, mas cinco não têm efeito. Evidência:
`current-build-report.json` e `quick-report` do deploy. Correção: derivar de
`TEMPLATE_REGISTRY` e teste de aceitação por card. Complexidade S, confiança
alta.

## Avaliação 9:16

### T1 — CENTERED HERO

- Capa central, título abaixo, barras no vão, tagline no topo.
- **Boa hierarquia** e equilíbrio; é o layout mais seguro.
- O fundo fica muito uniforme; a capa em preto e branco gera paleta cinza e
  apaga o acento Drazyx.
- CTA ausente no início (só aparece no fim), o que é correto para a narrativa,
  mas não há indicação de que ele exista.
- Evidência: `local-916-t1.jpg`.

### T2 — STEREO FRAME

- **Quase idêntico a T1.** A diferença prometida (waveforms espelhadas) não se
  lê: aparece uma linha horizontal fina atravessando a capa, com traços nas
  laterais que parecem um divisor/glitch.
- O olho interpreta a linha como artefato, não como stereo.
- **TPL-03 — CREATIVE QUALITY, P1/P2:** a composição não justifica existir
  separada de T1.
- Evidência: `local-916-t2.jpg`.

### T3 — OFFSET CINEMA

- Texto no topo-esquerda, capa à direita, espectro na base. É a composição mais
  editorial e uma das melhores.
- **Problemas:** o “badge” é um ponto/badge minúsculo no canto, sem função
  clara; há um fantasma grande de “REMIXES”/“MY MIRAGE” atrás da capa e do
  texto, que parece camada esquecida; a metade inferior fica vazia.
- A tipografia é legível e a hierarquia título → artista → álbum funciona.
- **TPL-04 — CREATIVE QUALITY, P2:** remover o badge arbitrário ou
  transformá-lo em elemento com significado; reduzir o fantasma; usar o vazio
  com intenção.
- Evidência: `local-916-t3.jpg`, `local-11-t3.jpg`.

### T4 — EDITORIAL COVER

- Texto à esquerda, capa grande à direita, coluna de waveform à esquerda.
- **Problemas:** a coluna vertical parece um código de barras desconectado;
  ~40% inferiores vazios; a capa domina e o texto fica pequeno no canto.
- Sem sobreposição de texto/capa em 9:16 e 1:1, mas a composição é top-heavy.
- Evidência: `local-916-t4.jpg`, `local-11-t4.jpg`.

### T5 — ALBUM PLAYER SPLIT

- A mais “produto”: capa + painel de player com progresso real.
- **Problemas visuais:** o player tem um vazio enorme entre álbum e progresso;
  a barra de progresso parece uma linha pontilhada; os glifos de play/pause
  são minúsculos e parecem um troféu/artefato; “0:00 / 0:30” é quase ilegível.
- A ideia é boa e deve ser preservada, mas o player precisa de desenho real,
  não de geometria decorativa.
- Evidência: `local-916-t5.jpg`, `local-169-t5.jpg`.

### T6 — VERTICAL TOTEM

- Capa alta central, barras laterais, metadados na base.
- Em 9:16, a capa é **cortada em proporção 0,78** (não quadrada), cortando as
  laterais da arte; o título fica imediatamente sobre a base da capa.
- Em 1:1, o corte e a sobreposição ficam mais evidentes: a arte perde
  informação e o texto compete com a imagem.
- **SQ-02 — CREATIVE QUALITY, P2.** Evidência: `local-916-t6.jpg`,
  `local-11-t6.jpg`.
- O layout é inacessível pela UI por TPL-01, o que agrava: o usuário não
  consegue nem escolhê-lo para corrigir.

### T7 — SYMMETRIC SPECTRUM

- Capa central com uma **linha horizontal fina atravessando toda a imagem**,
  incluindo a capa; não parece espectro, parece corte/risco.
- Em 1:1, “DRAZYX” fica acima do título (hierarquia invertida) e encostado na
  capa.
- **SQ-03 — CREATIVE QUALITY, P2.** Evidência: `local-916-t7.jpg`,
  `local-11-t7.jpg`.

### T8 — MONOCHROME FOCUS

- Tagline no topo, **comb de barras flutuando** acima da capa, capa central,
  metadados na base.
- O comb não se conecta a nada; parece elemento de debug. Em 1:1, o título
  encosta na base da capa.
- **SQ-03 / TPL-04.** Evidência: `local-916-t8.jpg`, `local-11-t8.jpg`.

## Problemas transversais

1. **Elementos 2.5D arbitrários**: badge de T3, linha de T2/T7, comb de T8,
   glifos de T5, barcode de T4. Não há critério de necessidade; são primitivas
   Three.js que ocupam espaço sem reforçar a música.
2. **Fantasmas de capa**: T3 e T5 usam a capa como textura de fundo com
   opacidade baixa; o texto “MY MIRAGE”/“REMIXES” aparece atrás da composição
   e parece watermark de terceiros.
3. **Vazio não intencional**: T3/T4 em 1:1 e 9:16; T5 no painel.
4. **Similaridade**: T1≈T2; T7≈T8; T3/T4 compartilham a mesma lógica
   editorial. O usuário não ganha oito direções, ganha cerca de quatro.
5. **Paleta**: com capa preta e branca, a extração automática resulta em cinza;
   todos os templates perdem o roxo da marca. Não é bug, mas falta um fallback
   de identidade ou opção “acento Drazyx”.
6. **Cover não é quadrada em T6** e é cortada; a capa é a informação principal
   e não pode perder bordas sem controle.
7. **Sem adaptação por formato**: cada template calcula posições em um único
   sistema `viewW/viewH`; não existe conceito de composição 9:16/1:1/16:9
   separada. Onde há `min()` evita estouro, mas não cria enquadramento
   intencional.

## 16:9 (amostra)

- **LAND-01 (P1):** Stage 16:9 é exibido em 1432×903 (1,586) para canvas
  1344×756 (1,778); a prévia é esticada. Ver `current-build-report.json`.
- T3 em 16:9: capa enorme, fantasma gigante, texto pequeno à esquerda; não é
  uma composição cinematográfica.
- T5 em 16:9: é o único com split horizontal real, mas o painel tem vazio
  central e glifos estranhos; sem modo de faixa completa, não vira music video.
- MIRAGE/AFTERIMAGE usam `coverSize = viewW * 0.62/0.58`; em 16:9 a capa fica
  maior que a altura visível e corta. Isso não é “adaptação”, é overflow.

## O que remover ou redesenhar

- **Remover**: badge sem função de T3; linha de T2/T7; comb de T8; barcode de
  T4; glifos decorativos de T5 (ou redesenhá-los como player real).
- **Redesenhar**: T6 com capa quadrada e hierarquia; T3/T4 com uso intencional
  do rodapé; T5 com player coerente.
- **Diferenciar**: T1/T2 e T7/T8 precisam de composições, não de efeitos.
- **Preservar**: T1, T3, T4 e a ideia de T5; identidade, capa como heroína,
  tipografia editorial.

## Recomendação

Antes de adicionar novos templates, **fazer os oito existentes funcionarem e
terem razão de existir**. Um template deve ser uma direção de arte, não uma
variação de posição de câmera. A correção mais barata é TPL-01; a mais
importante é separar composição por formato e remover os elementos 2.5D
arbitrários.
