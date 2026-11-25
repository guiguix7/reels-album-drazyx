# Auditoria de duração do clipe — 30 s versus 45 s

Data: 2026-11-25
Requisito: o modo SOCIAL CLIP deve permitir até **45 s**, sem exceder o áudio
restante. O modo FULL MUSIC VIDEO não tem esse limite.

## Resultado

**O limite de 45 s não existe.** O produto está limitado a 30 s em todas as
camadas: constante de domínio, normalização do store, slider, storyboard,
presets, nomes de arquivo e testes.

Teste direto no build atual:

```
setClipDuration(45, 97.4) → config.clipDuration = 30
slider DURAÇÃO → min=5, max=30, value=5
texto do painel → "cada vídeo usa no máximo 30 s"
```

Evidência: `current-build-report.json` (`duration45`),
`storyboard-report.json`, `local-clip-panel.jpg`.

## Mapa de dependências

| Camada | Local | Estado para 45 s |
|---|---|---|
| Constante | `src/features/project/project.defaults.ts` | `MAX_CLIP_SECONDS = 30` |
| Store | `src/features/project/project.store.ts` | `clamp(..., MIN, MAX_CLIP_SECONDS)` em init, áudio, início e duração |
| Tipos | `src/features/project/project.types.ts` | sem `productionMode`; `clipStart/clipEnd` apenas |
| UI | `src/components/editor/ClipPanel.tsx` | slider max 30; min 5; texto “até 30s” |
| Storyboard | `storyboard.utils.ts`, `StoryboardPanel.tsx` | presets 15/30; clamps de 30 |
| Gravação | `useRecordingFlow.ts` | usa `clipEnd`, mas nunca recebe >30 |
| Batch | `BatchCreatorPanel` / store | herda o limite |
| Nome do arquivo | `buildClipFileName` / recording | inclui duração, mas não valida |
| Testes | `project.store.test.ts`, `clip.utils.test.ts` | afirmam 30; falhariam com 45 |
| Documentação | `AGENTS.md` (MVP 30 s), `PROMPT.md` | desatualizados para o novo requisito |

## Achados

### CLIP-01 — Limite máximo continua 30 s

- **Categoria:** MISSING CAPABILITY. **Severidade:** P1.
- **Reprodução:** tentar definir 45 s pela UI ou por `setClipDuration`.
- **Esperado:** 45 s aceitos, desde que `start + 45 ≤ duration`.
- **Atual:** 30 s; UI nem oferece o valor.
- **Evidência:** acima.
- **Impacto:** o requisito comercial de clipes até 45 s não é atendido.
- **Correção:** `MAX_CLIP_SECONDS = 45`; limites derivados de
  `Math.min(MAX, duration - clipStart)`; slider máximo dinâmico; testes.
- **Complexidade:** M (não é só a constante).
- **Confiança:** alta.

### CLIP-02 — Sem waveform e sem leitura do trecho

- **Categoria:** UX. **Severidade:** P2.
- **Atual:** dois sliders (“Início”, “Duração”) e um resumo `00:00 → 00:05`;
  nenhuma forma de onda, marcadores de cena ou indicação de refrão.
- **Impacto:** escolher o melhor trecho é adivinhação; o usuário precisa tocar,
  pausar e ajustar várias vezes.
- **Correção:** waveform clicável com seleção arrastável, snap opcional a
  batidas e preview do range.
- **Complexidade:** M. **Confiança:** alta.

### CLIP-03 — Áudio curto passa na validação e falha na gravação

- **Categoria:** BUG. **Severidade:** P2.
- **Atual:** `setAudioMeta` limita a duração a `max(1, min(30, duration))`,
  então uma faixa de 2 s pode deixar `clipDuration = 1`. A UI do trecho tem
  mínimo 5 e o recorder exige ≥5, resultando em erro após o usuário carregar
  um arquivo válido. (Comportamento reproduzido no deploy anterior; o código
  atual mantém o mesmo clamp.)
- **Esperado:** se o áudio tem menos de 5 s, desabilitar a gravação com
  mensagem clara ou permitir clipes de 1–5 s coerentes entre store, UI e
  recorder.
- **Correção:** uma única função `getClipBounds(duration)` usada por store, UI,
  recorder e testes.
- **Complexidade:** S. **Confiança:** média-alta (código + reprodução no
  deploy).

### CLIP-04 — Máximo do slider não reflete o áudio restante

- **Categoria:** UX. **Severidade:** P2.
- **Atual:** o slider de duração tem `max=30` fixo; quando `clipStart` está
  perto do fim, o store reduz o valor efetivo, mas o controle continua
  oferecendo 30. O usuário arrasta e vê o número “voltar”.
- **Esperado:** `max = min(45, duration - clipStart)` e mensagem
  “restam 12,4 s nesta faixa”.
- **Correção:** derivar bounds no componente; desabilitar início que não deixa
  o mínimo.
- **Complexidade:** S. **Confiança:** alta.

### CLIP-05 — Não há modo de produção

- **Categoria:** MISSING CAPABILITY / ARCHITECTURAL. **Severidade:** P0
  (para o modo música completa).
- **Atual:** um único fluxo de “Trecho do vídeo”; 16:9 usa o mesmo clipe de
  30 s. Não existe “MODO 1 — SOCIAL CLIP” / “MODO 2 — FULL MUSIC VIDEO”.
- **Impacto:** o usuário não consegue gravar a música inteira em 1920×1080.
- **Correção:** `productionMode` explícito, com regras separadas:
  - `clip`: 5–45 s, 9:16/1:1, trecho configurável.
  - `full`: duração do áudio, 16:9, progresso longo, sem cap de 45 s.
- **Complexidade:** L. **Confiança:** alta.

## Regras propostas para o modo SOCIAL CLIP

- Duração mínima: 5 s (ou 1 s se o produto quiser aceitar áudios curtos).
- Máxima: `min(45, audioDuration - clipStart)`.
- Se `audioDuration < min`, bloquear gravação com mensagem, não permitir um
  estado impossível.
- Ao mover `clipStart`, se `clipStart + duration > audioDuration`, reduzir a
  duração e mostrar “ajustado ao fim da faixa”.
- Ao trocar de áudio, revalidar o trecho; preservar início se possível.
- Rótulos: “Até 45 s” somente quando o áudio restante permitir; caso contrário,
  “Máximo disponível: 12,4 s”.
- Nome do arquivo: `..._45s_...` derivado da duração efetiva.
- Storyboard: presets 15/30/45; cenas não podem ultrapassar `clipEnd`.
- Testes: 45 s aceito; 45,1 rejeitado; 45 s perto do fim reduzido; áudio de
  2 s bloqueado; gravação usa exatamente o range.

## Regras propostas para o modo FULL MUSIC VIDEO

- Duração = `audioDuration` (ou trecho opcional escolhido pelo usuário).
- Sem 45 s; sem redistribuição forçada de storyboard para 30 s.
- 16:9 como saída principal; 9:16/1:1 apenas se o usuário escolher.
- Progresso de gravação por tempo e por tamanho; possibilidade de cancelar.
- Aviso de memória/durabilidade; `MediaRecorder` com chunks e Blob final.
- Parada automática no fim real do áudio, não em timer independente.
- Teste obrigatório com uma faixa completa antes de declarar suporte.

## Conclusão

Alterar o slider para 45 sem alterar store, storyboard, recorder e testes
produziria um controle mentiroso. A correção é um **contrato único de duração**
e dois modos de produção. O 45 s é uma mudança de produto, não de CSS.
