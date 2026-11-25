# Auditoria do storyboard — DRAZYX

Data: 2026-11-25
Objeto: editor de cenas do build atual (não presente no deploy público).

## Resumo executivo

O conceito é o certo: dividir a faixa em cenas com hook, revelação,
desenvolvimento, pico e fechamento. A execução não é um storyboard; é um
**formulário de configuração de seis cenas, todas abertas ao mesmo tempo**.
O usuário não vê o vídeo como sequência, não seleciona uma cena, não arrasta,
não tem miniatura e não consegue prever o resultado.

**Nota de usabilidade: 1,5/5.** Não remover o conceito; substituir a interação.

## Medições reais (1440×900, storyboard ativo, preset 30 s)

| Métrica | Valor |
|---|---|
| Cenas | 6 (0–3, 3–8, 8–16, 16–23, 23–27, 27–30) |
| Altura do painel de storyboard | 2.849 px |
| Altura total do aside | 7.863 px |
| Altura da seção de gravação | `recordTop = 7.442` |
| Controles no documento | 25 selects, 13 sliders, 39 botões, 7 textboxes |
| Altura de cada cartão de cena | ~383 px |
| Timeline | 16 px, `aria-hidden="true"` |
| Tabbables | 95 |
| Preview da cena 1 (0–3 s) | ainda tocando aos 4,2 s |

Evidência: `docs/audit/evidence/storyboard-report.json`,
`local-storyboard-top.jpg`, `local-storyboard-scenes.jpg`,
`local-storyboard-real.jpg`.

## Achados

### SB-01 — Sem visão de sequência e sem seleção de cena

- **Categoria:** UX / UI. **Severidade:** P1.
- **Reprodução:** ativar “Ativar storyboard” + “Preset 30s”.
- **Esperado:** uma faixa de cenas escaneável, com miniatura, nome, duração e
  uma cena selecionada; o inspector mostra só a cena selecionada.
- **Atual:** seis blocos idênticos e completos, empilhados; nenhum destaque de
  cena ativa; não há relação visual entre a lista e o tempo do áudio. O
  usuário não sabe “onde estou” nem “o que estou editando”.
- **Evidência:** capturas do painel; todos os cartões têm os mesmos campos e
  não há `aria-current`/estado selecionado.
- **Impacto:** a tarefa de organizar narrativa vira navegação em formulário;
  comparar cenas exige rolar 2.849 px.
- **Correção:** lista horizontal/vertical compacta + timeline + inspector
  único (detalhado abaixo).
- **Complexidade:** M/L. **Confiança:** alta.

### SB-02 — “Preview da cena” não termina no fim da cena

- **Categoria:** BUG. **Severidade:** P1.
- **Reprodução:** primeira cena (0–3 s); clicar “▶ Cena”; esperar 4 s.
- **Esperado:** tocar somente 0–3 s e parar.
- **Atual:** faz `seek(0)` + `play()` no áudio completo; continua além de 3 s.
- **Evidência:** `storyboard-report.json` → `scenePreview.playingAfter4s: true`.
- **Causa:** `previewScene` não agenda stop em `scene.end`.
- **Impacto:** o preview mais importante do editor é falso; o usuário avalia
  outra coisa.
- **Correção:** `playRange(start,end)` no Audio Engine, com stop no fim e
  restauração da posição; botão “Parar”.
- **Complexidade:** S. **Confiança:** alta.

### SB-03 — Timeline não é interativa e não mostra cenas

- **Categoria:** UX / UI / ACCESSIBILITY. **Severidade:** P1.
- **Reprodução:** tentar clicar numa cena ou arrastar a fronteira na timeline.
- **Esperado:** clicar posiciona o áudio; arrastar a borda altera duração;
  rótulos e cores por cena; foco por teclado.
- **Atual:** é uma barra de 16 px, `aria-hidden`, somente leitura; o playhead é
  um marcador. Não há rótulos, miniaturas ou zonas de cena.
- **Evidência:** `storyboard-report.json` (`timeline`), captura
  `local-storyboard-real.jpg`.
- **Impacto:** o elemento que deveria ser o coração do storyboard é decorativo.
- **Correção:** timeline semântica com segmentos, zoom, clique/arraste, foco e
  teclas (`←/→` move playhead, `[`/`]` ajusta borda).
- **Complexidade:** M. **Confiança:** alta.

### SB-04 — Duração acoplada e terminologia não explicada

- **Categoria:** UX. **Severidade:** P2.
- **Reprodução:** mudar a duração da cena 2.
- **Esperado:** alterar a cena e, se necessário, empurrar/encolher vizinhas com
  feedback explícito; ou duração independente com gap/sobreposição visível.
- **Atual:** o store redistribui todas as cenas; o usuário vê números mudarem
  sem entender por quê. “Hook”, “Pico”, “Payoff”, “Desenvolvimento” não têm
  descrição; “Hook” nem está em português.
- **Evidência:** `storyboard.utils.ts` (`redistribute`), UI sem helper.
- **Impacto:** mudanças inesperadas e sensação de perda de controle.
- **Correção:** regra explícita (“Esta cena termina em X; a próxima começa em
  X”), desfazer, e microcopy para cada papel narrativo.
- **Complexidade:** M. **Confiança:** alta.

### SB-05 — Campos duplicados e densidade excessiva

- **Categoria:** UI. **Severidade:** P2.
- **Atual:** “Tipo de hook”, “Frase do hook” e “Duração do hook” aparecem no
  topo do storyboard e novamente na cena 1; cada cena repete template,
  movimento, texto, animação, duração e transição. São 383 px por cena.
- **Impacto:** o usuário edita o mesmo dado em dois lugares; o painel cresce
  sem necessidade.
- **Correção:** um inspector só; remover o bloco global de hook e editar a cena
  1 diretamente.
- **Complexidade:** S. **Confiança:** alta.

### SB-06 — O que a cena controla não está claro

- **Categoria:** UX. **Severidade:** P2.
- **Atual:** a cena tem “Texto da cena”, mas os metadados (artista, faixa,
  álbum, CTA) vêm do painel global e continuam aparecendo em todas as cenas;
  “mostrar texto” esconde apenas a tagline. O usuário pode achar que está
  criando uma cena sem título quando o título continua lá.
- **Esperado:** inspector mostra “o que aparece nesta cena”, com toggles por
  elemento e preview fiel.
- **Correção:** modelo de elementos por cena (ver UI_CUSTOMIZATION), não um
  único `text` + flags globais.
- **Complexidade:** M (depende do modelo). **Confiança:** alta.

### SB-07 — Preview completo e comparação com o áudio

- **Categoria:** UX. **Severidade:** P2.
- **Atual:** o transporte toca a faixa, mas não há “tocar storyboard” com
  parada no fim do trecho, nem indicação de qual cena está no playhead.
- **Impacto:** o usuário não consegue revisar a sequência inteira como filme.
- **Correção:** modo “Reproduzir história” que toca `clipStart → clipEnd`,
  destaca a cena ativa e para no fim.
- **Complexidade:** S/M. **Confiança:** alta.

### SB-08 — Acessibilidade do editor

- **Categoria:** ACCESSIBILITY. **Severidade:** P2.
- **Atual:** timeline `aria-hidden`; cartões sem `fieldset/legend`; 39 botões
  pequenos (muitos <44 px); nenhuma live region para “cena movida” ou
  “duração alterada”.
- **Evidência:** `storyboard-report.json`, `current-build-report.json`.
- **Correção:** regiões nomeadas, anúncios, alvos ≥44 px, foco visível.
- **Complexidade:** S/M. **Confiança:** alta.

## Modelo de interação proposto

Substituir os seis formulários por **duas zonas**:

### 1. Faixa de cenas (topo do painel, ~120 px)

Uma linha horizontal (ou grade de 2–3 colunas no aside estreito) com cartões
compactos:

```
[ 0:00–0:03  HOOK        ▶ ]  [ 0:03–0:08  REVELAÇÃO   ▶ ]
[ 0:08–0:16  DESENVOLV.  ▶ ]  [ 0:16–0:23  PICO        ▶ ]
```

Cada cartão: número, miniatura real do frame, papel, duração, botão tocar.
Clicar seleciona; o cartão selecionado ganha borda/contraste e o inspector
abaixo muda. Arrastar reordena; alça na borda altera duração; menu “⋯” duplica,
remove, divide.

### 2. Inspector da cena selecionada (~300 px)

Só a cena ativa, em grupos progressivos:

- **Conteúdo**: título/artista/álbum/CTA/tagline (toggles + texto).
- **Composição**: template e movimento, com mini-preview.
- **Tempo**: início, duração, transição; “termina em 0:08”.
- **Avançado**: animação, entrada/saída, áudio-reativo.

Nada de seis cenas abertas. O usuário vê a sequência, seleciona uma, edita,
volta. O painel total não deve passar de ~700 px.

### 3. Timeline sincronizada (fixa sob o Stage ou no topo do inspector)

Segmentos coloridos por papel, rótulos, playhead, clique para seek, arraste de
bordas, zoom. Deve ser o mesmo componente usado no transporte principal.

### 4. Preview

- “Tocar cena” → range exato, para no fim.
- “Tocar história” → `clipStart → clipEnd`, destaca cena ativa, para no fim.
- “Tocar tudo” → faixa completa (para full song).

## Acceptance criteria

- [ ] O usuário identifica a sequência em <10 s, sem abrir cena.
- [ ] Selecionar uma cena exige 1 clique; editar, 0 navegações extras.
- [ ] Alterar duração mostra o novo intervalo e o efeito nas vizinhas.
- [ ] Reordenar por arraste e por teclado.
- [ ] “Tocar cena” para no fim da cena (teste automatizado).
- [ ] “Tocar história” para no fim do trecho e destaca a cena.
- [ ] Timeline clicável e focável, com rótulos de cena.
- [ ] Adicionar/duplicar/remover em ≤2 cliques, com desfazer.
- [ ] Nenhum campo duplicado entre cabeçalho e cena 1.
- [ ] Painel de storyboard ≤700 px de altura.

## O que preservar

Papéis narrativos, sincronização com o relógio do áudio, presets 15/30,
auto storyboard e a possibilidade de desativar. O problema não é a ideia; é a
densidade, a falta de seleção e o preview falso.
