# Relatório de testes de regressão — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Escopo: baseline automatizado do repositório + verificação funcional do deploy.
Nenhum teste de aplicação foi adicionado ou alterado nesta auditoria; o objetivo
foi medir a cobertura e documentar falhas, não corrigi-las.

## Baseline automatizado

Branch `audit/product-quality-review` (HEAD `2d8bbd0`), dependências instaladas
com `npm ci`.

| Comando | Exit | Resultado |
|---|---|---|
| `npm run lint` | 0 | limpo |
| `npm run typecheck` | 0 | limpo |
| `npm test` | 0 | **117 testes / 21 arquivos**, todos passando |
| `npm run build` | 0 | 126 módulos; bundle 797,84 kB / 218,88 kB gzip |

Observação: o primeiro `npm ci` falhou com `EPERM` em binários nativos
(`esbuild.exe`, `rollup.win32-x64-msvc.node`) por um dev server Vite ainda
aberto. Após encerrar os processos, a instalação passou. Não é regressão do
produto, mas afeta a reprodutibilidade local.

## O que a suíte cobre

Os 21 arquivos exercitam, entre outros:

- defaults e validação de projeto;
- store (clip, formato, tipografia, storyboard);
- manifesto de export e validação de saída;
- suporte a codecs e mensagens de erro;
- utilidades de tempo, paleta e storyboard;
- componentes de UI em jsdom (quando presentes).

## O que a suíte não cobre

| Lacuna | Impacto |
|---|---|
| Aplicação de cada card de layout no engine/DOM | **BUG-01 passou** (5/8 cards são no-op) |
| Proporções 1:1 e 16:9 no layout real | **BUG-02 passou** (16:9 esticado) |
| Gravação real com MediaRecorder | Falha de conteúdo vazio e sucesso só na aba visível não são testados |
| Áudio curto (<5 s) na UI | **BUG-03 passou** (botão habilitado, erro tardio) |
| Colisão de texto / regressão visual | **QUALITY-01 passou** |
| Acessibilidade (foco, contraste, live regions) | Nenhum teste |
| Persistência/recarga | Não há teste de projeto salvo |
| Ordem/hierarquia do painel | **UX-01** não é detectável por teste unitário |

A suíte é forte em **regras puras** e fraca em **integração de navegador**. O
bug mais grave (cinco layouts mortos) é exatamente o tipo que um teste de
aceitação de UI pegaria.

## Testes de navegador executados nesta auditoria

Ferramenta: Playwright-core temporário (fora do `package.json`), Chrome do
sistema. Os scripts Playwright temporários foram removidos após a coleta; os
relatórios ficam em `docs/audit/evidence/`.

### Resultados

| Verificação | Status | Evidência |
|---|---|---|
| Carga inicial e console | Passa (sem erro bloqueante) | `record-report.json` |
| Upload MP3/ WAV | Passa | `record-report.json`, `quick-report.json` |
| Upload inválido | Passa (erro claro) | `aspect-a11y-report.json` |
| Áudio de 2 s | **Falha de UX/validação** | `aspect-a11y-report.json` + sessão |
| Capa e paleta | Passa | `flow-03-export-preview.jpg` |
| Play/pause | Parcial | sessão |
| Seek | Inconclusivo | sessão |
| T3/T4/T5 | Passa | screenshots |
| T1/T2/T6/T7/T8 | **Falha** | `aspect-a11y-report.json`; screenshots |
| 1:1 | Passa | `aspect-a11y-report.json` |
| 16:9 | **Falha** | `aspect-a11y-report.json` |
| Gravação 5 s (aba visível) | **Passa** | `export-validation.json` |
| Gravação headless/headed | Falha ambiental (blob vazio) | `record-report.json` |
| Cancelar/regravar | Passa | sessão |
| 720p/60 fps/30 s | Não executado | — |
| Salvar/recarregar | Não existe no deploy | inspeção |
| Contraste/tamanho de alvo | Falha (3,79:1; 25–34 px) | `ACCESSIBILITY_PERFORMANCE_PRIVACY.md` |
| Canvas nomeado / live regions | Falha | `aspect-a11y-report.json` |
| Responsividade 360–1920 | Sem overflow; CTA fora da dobra | `quick-report.json` |

### Evidências principais

- `evidence/quick-report.json`: viewports, posições, fontes, sobreposição do
  estado vazio.
- `evidence/aspect-a11y-report.json`: proporções, foco, controles sem rótulo,
  arquivo inválido, áudio de 2 s.
- `evidence/record-report.json`: tentativa de gravação em automação, erro de
  conteúdo vazio, rede/heap.
- `evidence/export-validation.json`: export real bem-sucedido.
- `evidence/flow-03-export-preview.jpg`: preview com sobreposição de texto.
- `evidence/layout-1..8.jpg`: capturas dos oito cards.

## Casos de teste recomendados (não implementados)

1. **Aceitação de layouts**: para cada id da galeria, clicar e verificar
   `aria-selected`, `data-template`/estado do engine e um pixel/atributo
   observável. É o teste que faltou para BUG-01.
2. **Proporções**: medir `canvas.width/height` e a razão do contêiner em
   9:16/1:1/16:9, em 1440×900 e viewport alta.
3. **Upload e validação**: arquivo inválido, áudio de 2 s (botão deve estar
   desabilitado ou o trecho deve ser re-clampado), remoção de áudio.
4. **Gravação E2E**: usar um canvas determinístico e MediaRecorder real em
   Chrome headed; validar Blob > 0, VP9/Opus, duração e áudio decodificado.
   Rodar fora do modo headless/SwiftShader.
5. **Regressão visual**: screenshots dos 3 templates com texto curto e longo,
   incluindo colisão de título/artista.
6. **Acessibilidade**: axe-core para contraste/labels; teste de tab order;
   `aria-live` para status; prefers-reduced-motion.
7. **Persistência**: salvar, recarregar, restaurar áudio/capa/config.

## Conclusão

O baseline do repositório está verde, mas **verde não significa pronto**: a
suíte não exercita o navegador nem a galeria de layouts. A cobertura de 117
testes dá confiança nas regras de domínio; os defeitos P1 estão todos na
camada de integração/UI que os testes atuais não alcançam. A prioridade de QA é
adicionar um teste de aceitação por layout e um E2E de gravação em Chrome
headed, sem substituir os testes unitários existentes.
