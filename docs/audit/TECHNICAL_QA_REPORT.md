# Relatório técnico de QA — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Alvo funcional: deploy em produção https://reels-album-drazyx.vercel.app/
Repositório: branch `audit/product-quality-review` (HEAD `2d8bbd0`), usado para
causa-raiz. **Nenhum código de aplicação foi alterado nesta auditoria.**

## Ambiente

- Windows, Node v25.0.0, npm 11.6.2.
- Google Chrome 158.0.8127.37 (canal do sistema) para os testes visuais.
- Playwright-core temporário em `docs/audit/.tmp` (removido depois da coleta);
  não alterou `package.json`/lockfile.
- Deploy servindo `assets/index-CWnQNSHb.js`; build local gera
  `index-DcRn0TYS.js` — versões diferentes.
- Firefox não instalado; Safari não é executável no Windows. Testes nesses
  motores: **não executados**, não aprovados.

## Baseline do repositório

| Comando | Resultado | Detalhe |
|---|---|---|
| `npm run lint` | **0** | sem erros |
| `npm run typecheck` | **0** | sem erros |
| `npm test` | **0** | 117 testes, 21 arquivos |
| `npm run build` | **0** | 126 módulos; `index-DcRn0TYS.js` 797,84 kB (218,88 kB gzip) |

O primeiro `npm ci` falhou com `EPERM` em `esbuild.exe` e depois em
`rollup.win32-x64-msvc.node` porque um dev server Vite ainda mantinha arquivos
abertos. Após encerrar os processos 11448/25456/5972, o `npm ci` concluiu com
sucesso. Isso é ambiente, não defeito do produto, mas indica que a suíte não
pode ser executada com o dev server ativo nesta máquina.

## Matriz de testes funcionais no deploy

| # | Cenário | Resultado | Evidência |
|---|---|---|---|
| 1 | Carregar MP3 CORS (1,83 MB, 01:37) | **Passa**: decodifica, duração e BPM 81 | `evidence/record-report.json`, sessão visível |
| 2 | Carregar WAV | **Passa** (usado na inspeção inicial) | `evidence/quick-report.json` |
| 3 | Substituir áudio | **Passa**: nome/duração atualizados | sessão visível |
| 4 | Carregar capa PNG | **Passa**: Stage e paleta atualizados | `evidence/flow-03-export-preview.jpg` |
| 5 | Remover áudio | **Passa**: volta ao vazio; gravação desabilita | sessão visível |
| 6 | Play/pause do transporte | **Parcial**: botão vira “Pausar” e volta; leitura precisa de tempo não foi conclusiva | sessão visível |
| 7 | Seek no transporte | **Inconclusivo**: alteração programática não refletiu no texto do tempo | sessão visível |
| 8 | Selecionar T3/T4/T5 | **Passa**: `aria-selected` muda e o Stage muda | screenshots `layout-3/4/5` |
| 9 | Selecionar T1/T2/T6/T7/T8 | **Falha**: seleção permanece em MIRAGE | `evidence/aspect-a11y-report.json`, screenshots |
| 10 | Proporção 1:1 | **Passa**: canvas 1080×1080, inner 723×723 | `aspect-a11y-report.json` |
| 11 | Proporção 16:9 | **Falha**: canvas 1920×1080, inner 952×723 (1,317 vs 1,778) | `aspect-a11y-report.json` |
| 12 | Arquivo inválido | **Passa**: erro claro, gravação desabilitada | `aspect-a11y-report.json` |
| 13 | Áudio de 2 s | **Falha de validação**: “pronto”, gravação habilitada, erro só ao clicar | `aspect-a11y-report.json` + sessão visível |
| 14 | Gravar 5 s/9:16 na aba visível | **Passa**: WebM 1.822.390 B, 1080×1920, 5,099 s, VP9+Opus, áudio decodificado | `evidence/export-validation.json` |
| 15 | Gravar em automação headless/headed | **Falha ambiental**: Blob vazio, mensagem “sem conteúdo” | `evidence/record-report.json` |
| 16 | Cancelar gravação | **Passa**: preview some, botão volta | sessão visível |
| 17 | Gravar novamente | **Passa**: novo ciclo inicia | sessão visível |
| 18 | 720p / 60 fps / 30 s | **Não executado** | — |
| 19 | Salvar e recarregar projeto | **Não existe na produção** | inspeção de UI |
| 20 | Console/rede | Sem erro bloqueante; requests externos de fontes Google | `record-report.json` |

## Defeitos confirmados (com reprodução)

### BUG-01 — Cinco cards de layout não aplicam (P1)

Reprodução:

1. Abrir o deploy, carregar qualquer áudio.
2. Clicar em “02 — STEREO FRAME”, “06 — VERTICAL TOTEM”, “07 — SYMMETRIC
   SPECTRUM” ou “08 — MONOCHROME FOCUS”.
3. Observar `aria-selected`: continua em “01 MIRAGE”; o Stage não muda.

Resultado medido: T1/T2 mantêm MIRAGE; T5/T6/T7/T8 mantêm o T5 (ALBUM PLAYER
SPLIT). Causa: `TEMPLATE_IDS` em `src/features/project/project.defaults.ts`
lista apenas `['mirage','afterimage','void','spectrum','t3','t4','t5']`;
`setTemplate` rejeita `t1,t2,t6,t7,t8`. A galeria mostra oito cards, mas cinco
ids não passam na validação do store. A suíte atual não cobre a aplicação de
cada card no Stage.

### BUG-02 — Prévia 16:9 esticada (P1)

Reprodução: viewport 1440×900 → clicar “16:9 WIDE” → medir o canvas e o
contêiner.

- Canvas: 1920×1080 (razão 1,778).
- `.stageInner`: 952×723 (razão **1,317**).
- 9:16 e 1:1 ficam corretos.

Causa: `.stageInner` usa `height:100%` + `max-width:100%` + `aspect-ratio`
inline. Quando a largura calculada pela altura excede o quadro, o `max-width`
corta apenas a largura; a altura não é recalculada. O vídeo avaliado não
corresponde ao arquivo 16:9.

### BUG-03 — Áudio menor que 5 s habilita gravação inválida (P2)

Reprodução: carregar áudio de 2 s; o painel mostra “Duração 00:02”, o slider
“DURAÇÃO” fica `min=5, max=5, value=5`, e “GRAVAR TRECHO” permanece habilitado.
Ao clicar: “muito curto (mínimo de 5s).” A validação deveria ocorrer no load ou
o botão deveria estar desabilitado com explicação.

### QUALITY-01 — Sobreposição de título e artista (P1)

No template padrão MIRAGE, “WAKE UP (SLOWED + REVERB)” ocupa duas linhas e a
segunda colide com “DRAZYX”. Visível na prévia do arquivo exportado
(`evidence/flow-03-export-preview.jpg`). O layout usa posições fixas, sem
medição de colisão/ajuste de corpo.

### UX-01 — Ação principal fora da dobra (P1)

Medições: `recordTop=3515` em 1440×900 (aside 829 px, scroll 3581),
`3514` em 1024×768 e `4205` em 390×844. O painel tem 62 elementos focáveis; a
gravação é o último. Não há CTA fixo/atalho.

## Observações de engenharia

- **Gravação depende de visibilidade.** O engine pausa o RAF quando a aba fica
  oculta (`handleVisibility`). O MediaRecorder então não recebe frames; o
  resultado vazio é coerente. A UI avisa “Mantenha esta aba visível” e exibe
  erro claro, mas não há recuperação automática. Em automação headless/headed,
  o mesmo ocorreu; na aba visível real, funcionou.
- **Validação de arquivo**: o código possui `checkRecordingSupport`,
  `StageRecorder`, validação de manifesto e `beginExport` (resolução cheia).
  O deploy antigo pode não conter todas as correções; não foi possível atribuir
  o comportamento 16:9/curto a uma versão específica sem comparar bundles.
- **Codecs**: a ordem tenta VP9/Opus, VP8/Opus, H.264/Opus, MP4. No Chrome, o
  arquivo saiu VP9+Opus. Safari/Firefox não foram testados; MP4 via
  MediaRecorder tem suporte irregular.
- **Sem dependências novas** no projeto; Playwright foi usado fora do
  `package.json` e removido.
- **Rede**: além dos assets do próprio deploy, apenas Google Fonts
  (`fonts.googleapis.com`, `fonts.gstatic.com`). Nenhum analytics observado.
  Áudio/capa permanecem em blob local.

## Cobertura de testes existente (resumo)

21 arquivos / 117 testes, todos verdes. Eles cobrem bem regras de projeto,
manifesto, validação de export, store e utilidades. **Não cobrem**:

- aplicar cada card de layout no DOM/engine;
- proporções 1:1/16:9 no layout real;
- fluxo de gravação em navegador;
- validação de áudio curto na UI;
- acessibilidade (foco, live regions, contraste);
- regressão visual dos templates.

O bug BUG-01 teria sido pego por um teste de aceitação que percorresse
`TEMPLATE_IDS`/galeria e verificasse o template ativo.

## Limitações deste relatório

- Não houve inspeção com `ffprobe` do WebM (Blob remoto não foi baixado); a
  validação usa metadados do `<video>`, tamanho/MIME e strings VP9/Opus.
- 720p, 60 fps e 30 s não foram gravados.
- Seek e leitura de tempo não foram conclusivos.
- Sem Firefox/Safari e sem GPU real para FPS.
- A produção está desatualizada; conclusões técnicas valem para o bundle
  servido, não para todo o branch.
