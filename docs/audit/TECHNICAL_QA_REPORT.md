# QA técnico — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Alvos: build atual do repositório (`index-DcRn0TYS.js`, dev server local) e
deploy público (`index-CWnQNSHb.js`). Nenhum código de produção foi alterado.

## 1. Baseline do repositório

Executado antes desta rodada de documentação:

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 erros |
| `npm run typecheck` | 0 erros |
| `npm run test` | 117 testes / 21 arquivos, todos passando |
| `npm run build` | sucesso; `index-DcRn0TYS.js` 797,84 kB (218,88 kB gzip) |

Os testes cobrem store, clamp de 30 s, utils de clipe/storyboard, recorder e
componentes isolados. **Não cobrem** seleção dos oito layouts, razão do Stage,
preview de cena, 45 s, full song, gravação real ou acessibilidade — por isso o
baseline verde não valida o produto.

## 2. Build atual × produção

| Item | Produção | Build atual |
|---|---|---|
| Bundle | `index-CWnQNSHb.js` | `index-DcRn0TYS.js` |
| Storyboard editor | não | sim |
| Recipes / projetos / batch / retention | não | sim |
| Export curto 9:16 com áudio | validado (5,099 s, 1.822.390 B) | validado (5,173 s, 2.544.640 B) |
| Limite de clipe | 30 s | 30 s |
| Cinco layouts quebrados | sim | sim |
| 16:9 distorcido | sim | sim |

Conclusão: a produção está desatualizada e não representa o branch. As
observações do dono sobre storyboard podem se referir ao build atual, não ao
deploy; o deploy não tem o editor de cenas.

## 3. Export real — build atual

Configuração: T3, 9:16, 1080p, 30 fps, trecho 0–5 s, storyboard desativado,
`outfoxing.mp3` (1:37) e capa local.

| Propriedade | Valor |
|---|---|
| Arquivo | `Drazyx_Wake-Up-Slowed-Reverb_5s_Visualizer.webm` |
| Tamanho | 2.544.640 bytes (UI: 2,4 MB) |
| MIME | `video/webm` |
| Duração | 5,173 s |
| Resolução | 1080×1920 |
| Vídeo | VP9 (`V_VP9`) |
| Áudio | Opus (`OpusHead`) |
| Áudio decodificado | 274.619 bytes |
| Download | link com nome correto |

Evidência: `current-export-validation.json`. Isso valida **um clipe curto
9:16**. Não valida 1:1, 16:9, 720p, 60 fps, 45 s ou faixa completa.

### Export anterior (produção)

5,099 s, 1080×1920, VP9/Opus, 1.822.390 bytes, áudio presente
(`export-validation.json`, `record-report.json`). Confirma que o pipeline
básico funciona nos dois bundles.

## 4. Formatos e dimensões

| Formato | Canvas | CSS | Razão CSS | Esperado | Status |
|---|---|---|---|---|---|
| 9:16 | 1080×1920 | 1012×1799 | 0,562 | 0,5625 | OK |
| 1:1 | 756×756 | 903×903 | 1,000 | 1,000 | OK |
| 16:9 | 1344×756 | 1432×903 | **1,586** | **1,778** | **Falha** |

A falha 16:9 é de layout CSS, não do canvas. Evidência:
`current-build-report.json` → `stages.wide`.

## 5. Limite de clipe e gravação

- `setClipDuration(45, 97.4)` → **30**.
- Slider de duração: `min=5`, `max=30`.
- Texto: “cada vídeo usa no máximo 30 s”.
- Storyboard: presets 15/30; cenas terminam em 30.
- Não há `productionMode`; não há gravação de faixa completa.
- Teste de áudio curto (2 s) no deploy: store aceita, UI/recorder exigem 5 s →
  estado impossível. Código atual mantém o clamp mínimo 1.
- Gravação exige aba visível; automação headless produziu arquivo vazio.

**Full song: não testado porque não existe.** Não declarar sucesso.

## 6. Storyboard

| Métrica | Valor |
|---|---|
| Cenas | 6 |
| Painel | 2.849 px |
| Aside | 7.863 px |
| `recordTop` | 7.442 px |
| Controles | 25 selects, 13 sliders, 39 botões, 7 textos |
| Timeline | 16 px, `aria-hidden` |
| Preview da cena 1 (0–3 s) | ainda tocando aos 4,2 s |

O preview de cena é o bug funcional mais claro: `seek(start)+play()` sem stop
em `end`. Evidência: `storyboard-report.json`.

## 7. Acessibilidade (build local)

| Métrica | Valor |
|---|---|
| Tabbables | 95 |
| Textos <12 px | 135 de 215 |
| Botões <44 px | 38 de 50 |
| Live regions | 0 |
| Canvas com role/label | não |
| Contraste do CTA | 3,79:1 (abaixo de 4,5:1) |
| Timeline | `aria-hidden` |
| Reduced motion | canvas continua animando |

Evidência: `current-build-report.json` (`accessibility`). Não foi executado
leitor de tela; as métricas são DOM/estilo, não uma auditoria assistiva
completa.

## 8. Performance

- Build compacto (218,88 kB gzip); sem dependências obviamente excessivas.
- MIRAGE pode instanciar até 900 partículas; qualidade baixa cai para 220.
- Sem FPS medido em GPU real; não afirmar 60 fps.
- O DOM do aside chega a 7.863 px e 95 focáveis com storyboard; o custo é
  mais de usabilidade do que de render.
- Gravação longa não testada; memória e estabilidade de track são riscos
  abertos.
- `prefers-reduced-motion` não interrompe a animação do canvas.

## 9. Matriz de testes executados

| Teste | Resultado |
|---|---|
| Upload de áudio/capa | OK |
| Playback/seek | OK |
| Seleção dos 8 layouts | **5/8 falham** |
| 1:1 | OK (composição fraca em T3/T4/T6–T8) |
| 16:9 | **distorcido** |
| 45 s | **rejeitado (30)** |
| Storyboard: ativar, preset, editar | funcional, porém confuso |
| Preview de cena | **não para no fim** |
| Gravação 5 s 9:16 | OK, VP9/Opus, áudio |
| Download | OK, nome correto |
| Música completa | **não existe** |
| 60 fps / 720p / 1:1 / 16:9 em gravação | não executado |
| Firefox/Safari | não disponível |
| Leitor de tela | não executado |
| Longa duração | não executado |

## 10. Riscos técnicos abertos

1. **Gravação longa:** Blob único, memória, chunks, cancelamento e parada no
   fim do áudio não foram projetados/testados.
2. **Codec:** VP9/Opus é o caminho validado; fallback e MP4 não devem ser
   prometidos sem detecção/teste.
3. **Full song:** exige mudança de domínio, UI, recorder e testes; não é um
   flag.
4. **Elementos:** o engine atual desenha por template; customização exige
   modelo e renderer, não apenas controles.
5. **Fontes:** qualquer seletor de fonte precisa de fontes locais licenciadas;
   evitar requests a Google Fonts (privacidade/offline).
6. **Acessibilidade:** timeline, canvas, contraste, alvos e reduced motion.
7. **Release:** produção desatualizada; sem isso, correções não chegam ao
   usuário.

## 11. Comandos e evidências

- `npm run dev` / Vite em `http://127.0.0.1:5175`.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
- `docs/audit/evidence/current-build-report.json`
- `docs/audit/evidence/storyboard-report.json`
- `docs/audit/evidence/current-export-validation.json`
- Capturas `local-916-*`, `local-11-*`, `local-169-*`, `local-storyboard-*`,
  `local-visual-panel.jpg`, `local-clip-panel.jpg`.

## 12. Limitações

- Sem teste com usuários reais, leitor de tela, Firefox ou Safari.
- Sem `ffprobe` do WebM remoto; a validação foi por metadados do elemento de
  vídeo + inspeção de bytes (VP9/Opus).
- Sem medição de FPS em GPU real.
- T6–T8 foram forçados no engine; a UI os rejeita.
- Full song, 45 s, longa duração e gravações 1:1/16:9 não foram executadas
  porque não existem ou não foram realizadas. **Não tratar como aprovadas.**

## Conclusão técnica

O pipeline curto 9:16 é real e entrega arquivo com áudio. O produto, porém,
não está pronto para o escopo declarado: faltam 45 s, full song, composições
por formato, customização por elemento e cobertura de regressão para os fluxos
críticos. O baseline verde é necessário, mas insuficiente.
