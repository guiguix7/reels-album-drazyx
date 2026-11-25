# Baseline de melhoria — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Branch de trabalho: `feat/product-quality-improvements`
Base: `audit/product-quality-review` (`efad673`)

## Objetivo

Reconciliar código, auditoria e produção antes de alterar o produto. Este
documento registra o que existe de fato, o que foi medido e a sequência de
implementação.

## Baseline executado

| Comando | Resultado |
|---|---|
| `npm ci` | sucesso após encerrar o Vite antigo que bloqueava `esbuild.exe` (272 pacotes) |
| `npm run lint` | 0 erros |
| `npm run typecheck` | 0 erros |
| `npm run test` | 117 testes / 21 arquivos, todos passando |
| `npm run build` | sucesso; `index-DcRn0TYS.js` 797,84 kB (218,88 kB gzip) |

O baseline verde não valida os fluxos de produto: os testes não cobrem seleção
dos 8 layouts, proporção do Stage, 45 s, full song, preview de cena,
customização por elemento ou gravação longa.

## Produção × branch

- Produção agora serve `assets/index-DZ5U_6t5.js` (798.211 B) e
  `assets/index-D_7g-IMl.css` (24.528 B).
- O bundle contém `Storyboard`, `Batch`, os oito layouts e `Retention`; a
  produção **não** é mais o bundle antigo `index-CWnQNSHb.js` citado na
  auditoria anterior.
- Ainda assim, produção e build local não são idênticos
  (`DZ5U_6t5` × `DcRn0TYS`) e não há versão/commit visível no app. O release
  precisa de verificação explícita, não de suposição.
- `npm ci` instalou versões compatíveis com o lockfile; nenhuma dependência foi
  adicionada.

## Arquitetura atual

- React 18 + TypeScript + Vite; Zustand para o projeto; CSS Modules.
- `VisualEngine` Three.js desenha o Stage; templates `t1…t8` e estilos
  `mirage/afterimage/void/spectrum` no `TEMPLATE_REGISTRY`.
- `TEMPLATE_IDS` em `project.defaults.ts` contém apenas 7 ids e rejeita
  `t1/t2/t6/t7/t8`; a galeria renderiza 8 layouts. **Causa confirmada de
  BUG-01.**
- O Stage usa `.stageInner` com `height:100%`, `max-width:100%` e
  `aspect-ratio` inline; o contêiner pode esticar o 16:9 quando a largura é
  limitada sem recalcular a altura.
- Áudio: um `<audio>`, um `MediaElementAudioSourceNode`, analyser, monitor e
  `MediaStreamAudioDestinationNode`; o tempo do áudio é a fonte de verdade.
- Gravação: `StageRecorder` com `captureStream` + track clonada,
  `MediaRecorder` com timeslice de 1 s, auto-stop por `playClip`.
- Storyboard: 6 cenas no preset 30 s, todos os cartões expandidos; preview de
  cena faz seek + play sem parar no fim.
- Persistência: IndexedDB para projetos/exports/métricas; JSON versionado;
  áudio e capa não são persistidos.
- Customização: apenas textos globais, paleta, seis sliders visuais, movimento,
  layout/formato/trecho. Posições, tamanhos, camadas, fontes e animações por
  elemento estão hardcoded nos templates.

## Achados confirmados no código/UI

1. Cinco layouts não selecionam (registry × `TEMPLATE_IDS`).
2. 16:9 pode distorcer no viewport real; precisa de teste de razão.
3. Storyboard é um formulário longo, sem seleção de cena, timeline clicável ou
   preview limitado ao range.
4. MIRAGE usa um único `TextLayer` para título + artista; títulos longos mudam
   a altura e o bloco pode colidir com o álbum/CTA. Falta medição explícita por
   bloco.
5. Áudio de 2 s: store aceita duração mínima 1 s, UI/recorder exigem 5 s.
6. Controles visuais sem descrição; alvos e textos pequenos.
7. 16:9 não tem composições dedicadas; full song e 45 s não existem.
8. Não há modelo de elementos, seleção no Stage, inspector, camadas ou presets
   de composição.
9. Produção está mais nova que a auditoria, mas sem versão verificável.

## Riscos

- OneDrive e processos Vite podem bloquear `npm ci`; encerrar somente o PID
  dono da porta antes de instalar.
- MediaRecorder em longa duração pode estourar memória; precisa de chunks,
  progresso, cancelamento e teste real.
- Alterar o modelo de cena pode quebrar projetos antigos; exigirá migração e
  defaults.
- Aumentar o Stage sem perder controles pode comprometer 1024×768 e mobile.
- Fontes web externas violam o local-first; usar apenas fontes já carregadas
  pelo app ou pilhas locais.

## Sequência planejada

1. **Phase 1** — registry, proporção, MIRAGE, áudio curto, estado vazio.
2. **Phase 2** — workspace, CTA persistente, onboarding, descrições,
   tipografia/alvos.
3. **Phase 3** — storyboard compacto, timeline interativa, waveform, 45 s.
4. **Phase 4** — composições por formato e diferenciação dos templates.
5. **Phase 5** — modelo de elementos, seleção direta, inspector, presets.
6. **Phase 6** — modos de produção, full song, player e câmera.
7. **Phase 7** — autosave, undo/redo e presets de marca.
8. **Phase 8** — QA, regressão, release verificável.

Cada fase terá commit próprio; nenhuma será marcada como concluída sem checks
executados e limitações registradas.
