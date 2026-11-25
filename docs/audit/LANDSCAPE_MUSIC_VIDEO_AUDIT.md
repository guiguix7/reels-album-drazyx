# Auditoria do formato paisagem e modo música completa — 1920×1080

Data: 2026-11-25
Escopo: 16:9, produção de faixa inteira, composições paisagem, player e câmera.

## Veredito

**O modo FULL MUSIC VIDEO não existe.** O 16:9 é um formato de exportação, não
um ambiente de produção. Hoje:

- o Stage 16:9 é exibido esticado (1,586 em vez de 1,778);
- não há modo de produção nem gravação da faixa completa;
- só T5 tem uma composição horizontal real; os outros layouts permanecem
  verticais centralizados ou estouram;
- não há player configurável, câmera cinematográfica, keyframes ou progresso
  de gravação longa;
- o limite de 30 s continua valendo em 16:9.

Não é possível declarar suporte a music video completo sem implementar e testar
uma gravação de ponta a ponta.

## Evidência atual

| Item | Medição |
|---|---|
| Canvas 16:9 | 1344×756 (1,778) |
| Contêiner exibido | 1432×903 (**1,586**) |
| Templates com ramo `landscape` | apenas T5 |
| MIRAGE/AFTERIMAGE | capa `viewW * 0.62/0.58`, ultrapassa a altura |
| Modo full song | ausente |
| Limite de gravação | 30 s (`clipEnd`) |
| Player configurável | não |
| Câmera | um slider de velocidade; sem presets/keyframes |
| Gravação longa testada | não |

Evidência: `current-build-report.json` (`stages.wide`),
`local-169-t3.jpg`, `local-169-t5.jpg`, código de `mirage.ts`,
`afterimage.ts`, `spectrum.ts`, `t5.ts`, `useRecordingFlow.ts`.

## Achados

### LAND-01 — Preview 16:9 distorcido

- **Categoria:** UI / BUG. **Severidade:** P1.
- **Feature:** Stage / formato.
- **Reprodução:** selecionar 16:9 Wide.
- **Esperado:** contêiner com a mesma razão do canvas; letterbox se necessário.
- **Atual:** 1432×903 (1,586) para canvas 1344×756 (1,778); a imagem é
  esticada horizontalmente.
- **Evidência:** `current-build-report.json`; capturas 16:9.
- **Causa:** `.stageInner { height: 100%; max-width: 100% }`; a largura é
  limitada sem recalcular a altura.
- **Impacto:** o usuário toma decisões de enquadramento sobre uma imagem que
  não corresponde ao arquivo; todo o 16:9 fica não confiável.
- **Correção:** `max-height: 100%; width: auto; aspect-ratio`; teste de razão
  em 9:16, 1:1 e 16:9.
- **Complexidade:** S. **Confiança:** alta.

### LAND-02 — Modo música completa ausente

- **Categoria:** MISSING CAPABILITY / ARCHITECTURAL LIMITATION.
- **Severidade:** P0.
- **Feature:** produção / gravação.
- **Reprodução:** procurar modo de faixa inteira; carregar uma faixa longa.
- **Esperado:** modo 2 com duração = áudio, gravação até o fim real, progresso,
  cancelamento e arquivo reproduzível.
- **Atual:** um único fluxo de clipe; `MAX_CLIP_SECONDS = 30`; recorder usa
  `clipStart/clipEnd`; storyboard e batch assumem 30 s.
- **Evidência:** `useRecordingFlow.ts`, `project.defaults.ts`, teste
  `setClipDuration(45) → 30`.
- **Impacto:** o requisito central do paisagem não é executável; não há como
  produzir um music video completo.
- **Correção:** `productionMode: 'clip' | 'full'`; em `full`, `clipEnd =
  audioDuration`, UI sem cap, recorder longo e testes com faixa completa.
- **Complexidade:** L. **Confiança:** alta.

### LAND-03 — Não há sistema criativo paisagem

- **Categoria:** CREATIVE QUALITY / ARCHITECTURAL LIMITATION.
- **Severidade:** P1.
- **Feature:** templates / composição.
- **Reprodução:** percorrer os oito layouts em 16:9.
- **Esperado:** composições horizontais com hierarquia, espaço negativo,
  profundidade e enquadramento cinematográfico.
- **Atual:** T1/T2/T6/T7/T8 mantêm o bloco vertical centralizado; T3/T4 são
  editoriais, mas com capa gigante e texto pequeno; T5 é o único split
  horizontal, com vazio central e glifos estranhos. MIRAGE/AFTERIMAGE/SPECTRUM
  dimensionam a capa por `viewW`, estourando a altura.
- **Evidência:** código dos templates; screenshots 16:9.
- **Impacto:** o 16:9 parece um 9:16 colocado de lado; não há razão artística
  para escolher paisagem.
- **Correção:** conjunto de composições paisagem dedicadas (abaixo), com
  `compositions.landscape` por template e teste de overflow.
- **Complexidade:** XL. **Confiança:** alta.

### LAND-04 — Player não é um componente configurável

- **Categoria:** MISSING CAPABILITY / CREATIVE QUALITY.
- **Severidade:** P2.
- **Feature:** player / composição.
- **Atual:** T5 desenha um player fixo: capa, metadados, progresso e glifos.
  Não é possível mover, redimensionar, ocultar partes, escolher estilo ou
  adicionar um player a outro layout. O progresso usa a timeline real (bom),
  mas os glifos e o tempo têm legibilidade ruim.
- **Esperado:** componente “Music Player” na biblioteca de elementos, com
  partes configuráveis: arte, título, artista, álbum, progresso, tempo atual,
  duração, waveform, controles decorativos, release info.
- **Impacto:** um dos principais diferenciais do modo paisagem não pode ser
  usado fora de T5 e não pode ser ajustado.
- **Correção:** elemento de player com bindings reais, sem controles
  interativos falsos no vídeo exportado; configurar quais partes aparecem.
- **Complexidade:** M/L. **Confiança:** alta.

### LAND-05 — Câmera limitada a um slider

- **Categoria:** MISSING CAPABILITY / CREATIVE QUALITY.
- **Severidade:** P2.
- **Feature:** câmera / movimento.
- **Atual:** “CÂMERA” controla velocidade/amplitude de uma deriva; não há dolly,
  tracking, órbita, parallax, foco, handheld, plano estático ou keyframes.
- **Esperado:** presets artísticos (Slow Dolly In/Out, Lateral Track, Orbit,
  Parallax, Static, Handheld sutil) + ajustes de intensidade/velocidade/easing;
  keyframes opcionais em fase avançada.
- **Impacto:** o movimento é genérico e não acompanha a narrativa; não há
  controle cinematográfico.
- **Correção:** sistema de câmera com presets avaliados por `motion profile`,
  sem nausea; respeitar `prefers-reduced-motion`.
- **Complexidade:** L. **Confiança:** alta.

### LAND-06 — Longa duração não foi projetada nem testada

- **Categoria:** PERFORMANCE / MISSING CAPABILITY.
- **Severidade:** P2 (bloqueia full song).
- **Feature:** recorder.
- **Atual:** gravação usa um Blob no fim, sem gestão explícita de chunks,
  memória, progresso longo, cancelamento ou recuperação. O teste real é de
  5 s; não há evidência de faixa completa.
- **Esperado:** chunks periódicos, limite de memória, progresso por tempo e
  tamanho, cancelamento com limpeza de tracks, parada no fim do áudio, Blob
  final íntegro.
- **Impacto:** gravar 3–5 minutos pode falhar ou travar; não se pode prometer
  full song.
- **Correção:** recorder em chunks, teste de 1, 3 e 5+ minutos, medição de
  memória, codec fallback, aviso de limites.
- **Complexidade:** L. **Confiança:** média-alta (risco técnico conhecido, não
  reproduzido por ausência do modo).

### LAND-07 — Nenhuma diferenciação de gênero/artista

- **Categoria:** CREATIVE QUALITY.
- **Severidade:** P2.
- **Atual:** os layouts não têm conceito narrativo; são arranjos de capa,
  texto e barras. Não há “cinematic artwork”, “split screen”, “editorial
  minimal”, “atmospheric wide” etc. como direções distintas.
- **Impacto:** o artista não escolhe uma estética; escolhe posições.
- **Correção:** cada composição com uma intenção declarada e uma razão para
  existir; evitar seis variações do mesmo centro.
- **Complexidade:** M. **Confiança:** alta.

## Sistema paisagem proposto

### Modos explícitos

```
MODO 1 — SOCIAL CLIP
  9:16 / 1:1
  5–45 s (limitado ao áudio restante)
  stories, reels, shorts

MODO 2 — FULL MUSIC VIDEO
  16:9 principal
  duração = faixa completa (ou trecho opcional)
  sem cap de 45 s
  progresso longo, cancelamento, export único
```

A escolha do modo deve vir antes do formato e mudar o painel, não apenas o
`aspectRatio`. Em `full`, o storyboard pode cobrir a faixa inteira; em `clip`,
respeita o range.

### Direções de composição (não todas obrigatórias)

1. **Cinematic Artwork** — capa grande em um terço, ambiente com profundidade,
   texto editorial no espaço negativo, câmera lenta.
2. **Editorial Player** — capa à esquerda, player à direita com progresso real,
   tipografia grande; versão paisagem do T5 bem resolvida.
3. **Split Spectrum** — metade capa, metade visualização; linha divisória
   intencional; sem elementos soltos.
4. **Atmospheric Wide** — capa pequena integrada a um ambiente atmosférico;
   foco em luz/partículas; texto mínimo.
5. **Minimal Editorial** — quase só tipografia e um detalhe de capa; muito
   espaço negativo; para faixas lentas.
6. **Full-Bleed Environment** — capa como textura de fundo em tela cheia,
   tipografia em primeiro plano, scrim para legibilidade.

Cada uma precisa de: grid, safe area, hierarquia, comportamento de câmera e
teste em 16:9 real (não esticado).

### Player

- Elemento opcional, não obrigatório em todos os layouts.
- Partes independentes: cover, title, artist, album, progress, current time,
  duration, waveform, transport (decorativo), release.
- Progresso e tempo ligados à timeline real; nunca inventar informação.
- Controles desenhados como parte do vídeo, sem prometer interação no arquivo.
- Layout compacto e legível: tempo com contraste ≥4,5:1, glifos reconhecíveis.

### Câmera

Presets iniciais: `Static`, `Slow Dolly In`, `Slow Dolly Out`, `Lateral
Track`, `Orbit`, `Parallax`, `Handheld Subtle`. Parâmetros: intensidade,
velocidade, easing, foco. Keyframes em fase posterior, com curvas e preview.
Evitar movimento que corte a capa, atravesse texto ou cause náusea; oferecer
“movimento reduzido”.

## Arquitetura de gravação longa

- `RecordingSession` com estado `preparing/recording/finalizing/error`.
- `MediaRecorder.start(timeslice)` e coleta de chunks; Blob ao final.
- Stop automático no evento `ended` do áudio ou quando `currentTime >= end`.
- Progresso: `currentTime`, duração alvo, bytes acumulados.
- Cancelar: parar recorder, tracks, limpar chunks, restaurar UI.
- Codec: detectar VP9/VP8/Opus; fallback documentado; nunca assumir MP4.
- Memória: medir em 1/3/5 min; avisar se o navegador não suportar.
- Teste de aceitação: gravar uma faixa completa, baixar, abrir, verificar
  duração, resolução e áudio.

## Acceptance criteria

- [ ] 16:9 exibido na razão 1,778.
- [ ] Modo FULL selecionável, com duração derivada do áudio.
- [ ] Gravação de uma faixa completa chega ao fim e gera arquivo com áudio.
- [ ] Progresso e cancelamento funcionam em gravação longa.
- [ ] Pelo menos 3 composições paisagem dedicadas, distintas entre si.
- [ ] Player configurável em pelo menos uma composição.
- [ ] Câmera com presets e ajuste, sem cortar texto/capa.
- [ ] Nenhum layout 16:9 com capa maior que a altura ou texto fora da safe
  area.
- [ ] Teste real de 16:9 e full song documentado; sem Declaração de sucesso
  sem arquivo verificado.

## Conclusão

O 16:9 precisa ser tratado como **produto separado**, com modo, composições,
player, câmera e recorder próprios. A distorção do preview é o primeiro bug a
corrigir, mas não é o problema principal: mesmo corrigida, não há modo música
completa nem direção paisagem. Este é o maior gap do produto.
