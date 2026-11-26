# PERFORMANCE BASELINE — DRAZYX VISUALIZER STUDIO

Última atualização: 2026-11-25
Branch de base: `feat/product-quality-improvements` (HEAD `cebed56`)
Baseline desta otimização: branch `perf/mobile-memory-rendering-optimization`, criada a partir do mesmo commit.

## Escopo e metodologia

Esta é uma **nova linha de trabalho de performance**, separada do ciclo de melhoria de produto anterior.
O objetivo não é demonstrar um resultado bonito, mas registrar o que o código atual faz antes de alterar
nada, para que cada otimização posterior tenha um referência real.

Os números abaixo são coletados no ambiente de desenvolvimento disponível neste workspace
(Windows + Node v25 + npm 11.6.2 + Chrome/Edge desktop). Eles cobrem o que é mensurável aqui:
build, testes e análise estática do pipeline. **Não substituídem validação em dispositivo móvel físico.**

Limitações declaradas desde o início:
- Sem medição real de uso de memória do navegador (heap snapshot) neste momento.
- Sem teste em Android físico neste momento.
- Sem monitoramento de GPU (driver/thermal) neste momento.
- As estimativas de custo GPU estão baseadas no que o pipeline solicita, não em telemetria de driver.

## 1. Build e carregamento

### 1.1 Bundle de produção (medido)

| Item | Valor |
|---|---|
| Build tool | Vite 5.4.10 |
| Arquivo JS de produção | `dist/assets/index-BFyuuw7c.js` |
| JS não compactado | 844.74 kB |
| JS gzip | 232.84 kB |
| CSS | `dist/assets/index-B8n6aWui.css` — 34.83 kB (gzip 7.01 kB) |
| Módulos transformados | 145 |
| Tempo de build | 4.05 s |

### 1.2 Checks (medidos)

| Check | Status | Tempo |
|---|---|---|
| `npm run lint` | 0 warnings / 0 errors | rápido |
| `npm run typecheck` | 0 erros | rápido |
| `npm run test` | 153/153 testes, 30/30 arquivos | ~26 s (a maior parte é overhead de environment/setup/collect, não tempo de testes) |
| `npm run build` | verda | 4.05 s |

### 1.3 Observação inicial sobre o bundle

O bundle é grande principalmente porque o app carrega **tudo** de uma vez:
Three.js, todos os templates, motion engine, storyboard, recipes, batch, retention, persistence, gravação.
Não há code splittingConsum. Isso afeta startup e consumo inicial de memória, mas não é a causa raiz
dos travamentos de renderização nem da instabilidade em GPU fraca.

## 2. Pipeline de renderização — o que roda a cada frame

### 2.1 Loops ativos

| Componente | Loop | Quando começa | Para quando |
|---|---|---|---|
| `AudioEngine` | `requestAnimationFrame → analyze()` | Construtor (inicia imediatamente) | `destroy()` |
| `VisualEngine` | `requestAnimationFrame → renderFrame()` | `start()` (chamado uma vez na criação do Stage) | `stop()` / `dispose()` |

Ambos rodam continuamente independentemente um do outro. Isso é intencional hoje, mas gera trabalho
contínuo mesmo sem áudio, sem reprodução e com aba oculta.

### 2.2 O que `VisualEngine.renderFrame()` faz a cada frame

Em ordem aproximada:
1. `AdaptiveResolution.push(dt)` — monitora frame budget e decide escala.
2. `getAudioEngine().getFrame()` — lê frame pré-calculado pelo AudioEngine.
3. Avança tempo do visual (tempo do áudio quando tocando, decaimento reduzido quando não).
4. Calcula progresso do trecho.
5. Aplica motion profile, storyboard atual (se ativo), loop visual.
6. `instance?.update()` — template ativo.
7. `composition?.update()` — camadas editáveis.
8. Aplica câmera global.
9. Atualiza transição.
10. **Chama `FinishPass.render()`** — renderiza a cena num render target e aplica o shader de acabamento.

### 2.3 O custo mais inflável: FinishPass

FinishPass é, até este momento, o pass mais caro do pipeline por construção:

- Render target: `THREE.HalfFloatType` + **4 MSAA samples**, tamanho da cena.
- Durante export/qualidade cheia: untiliza resolução real (ex.: até 1080×1920).
- Dois passos de renderização por frame:
  1. `renderer.setRenderTarget(target)` → `renderer.clear()` → `renderer.render(scene, camera)`
  2. `renderer.setRenderTarget(null)` → renderiza quad fullscreen com shader de acabamento.
- Shader de acabamento faz, por fragmento:
  - glitch band jitter condicional
  - **3 samples da textura de cena** (R 오프셋, G central, B 오프셋) para aberração cromática
  - scanline modulation
  - vignette por `smoothstep`
  - grain por hash espacial + temporal
  - conversão linear→sRGB

Em 1080×1920, isso é um número muito grande de fragmentos com alta taxa de amostragem e multi-sample
por frame, a cada frame, mesmo que a cena esteja quase estática.

O custo não é “bug”. É uma escolha de qualidade. O ponto da otimização é torná-la **adaptável**.

## 3. Pipeline de edição — custo de interação

### 3.1 Cadeia de arraste no Stage

Fluxo atual de um movimento de ponteiro:

1. `CompositionOverlay` `onPointerMove` → `updateElement(id, patch)` no Zustand.
2. Zustand atualiza o item no array `config.elements` (immer-style via estado imutável).
3. `Stage.tsx` tem `useEffect([elements])` que chama `engineRef.current?.setElements(elements)`.
4. `VisualEngine.setElements()` substitui `this.elements` e chama `rebuildComposition()`.
5. `rebuildComposition()` chama `composition?.dispose()`, cria nova `CompositionLayer` com _todos_ os elementos.

Ou seja: **um arraste pode despachar reconstrução completa da composição editável a cada evento de ponteiro**,
não apenas no final. Isso é um problema real de interação, não apenas “performance geral”.

### 3.2 O que a reconstrução completa faz

`CompositionLayer.rebuild()`:
- `clear()` — despacha `item.text?.dispose()`, `item.cover?.dispose()`, `item.wave?.dispose()`,
  `item.player?.timeLabel.dispose()`, e percorre o grupo despachando geometria/material de todos os meshes.
- Recria textos, cover cards, waveforms, players e formas para _todos_ os elementos visíveis.

`TextLayer` cria `HTMLCanvasElement` + `CanvasTexture` + dispõe o anterior em cada `redraw()` real.
`CoverCard` mantém texturas placeholder/capa; troca de capa reconstrói o template inteiro.

### 3.3 Onde isso é aceitável e onde não é

Aceitável:
- Troca de template.
- Troca de capa (hoje reconstrói o template — custoso, mas raro).
- Inclusão/remoção de elemento.
- Troca de aspecto/quality que muda o view size (hoje também reconstrói — custoso, mas raro).

Não aceitável para arraste comum:
- Mover um elemento deve atualizar posição, não reconstruir a cena.
- Redimensionar um elemento deve atualizar dimensões.
- Mudar opacidade/transformação deve atualizar apenas o item afetado.

## 4. Áudio — duplicação de decodificação

### 4.1 Dois caminhos de decodificação distintos

| Função | Onde | O que faz |
|---|---|---|
| `AudioEngine.detectRhythm()` | interno ao AudioEngine | fetch do object URL → `arrayBuffer()` → `ctx.decodeAudioData()` → `detectRhythmFromBuffer()` (BPM) |
| `loadWaveformPeaks()` | `features/audio/waveform.ts` | cria **novo** `AudioContext()` → `fetch` → `decodeAudioData()` → `computeWaveformPeaks()` → cache por URL |

### 4.2 O que isso significa na prática

- O mesmo arquivo local é decodificado **duas vezes** para fins diferentes.
- A waveform cria seu próprio `AudioContext` temporário e o fecha — mais criação/destruição de contexto,
  mais custo de decode.
- O AudioEngine já possui analisador e dados de áudio em tempo real; a waveform é basicamente uma análise
  offline da mesma mídia.

Isso não é um problema para áudio curto, mas se torna um problema real para faixas longas e para
dispositivos com menos memória/CPU.

## 5. Gravação — memória do MediaRecorder

### 5.1 Arquitetura atual

`StageRecorder`:
- Acumula chunks em `this.chunks: Blob[]`.
- Ao parar, cria `new Blob(this.chunks, { type })`.
- Devolve blob + metadados.
- O `useRecordingFlow` cria um object URL do blob resultante para preview.

### 5.2 O que isso significa para gravações longas

Para um vídeo longo (ex.: ~134 MB reportado para a faixa completa):
- Os próprios chunks acumulados já representam a faixa codificada completa em memória.
- O Blob final é outra representação completa em memória.
- O object URL de preview mantém mais uma referência até ser revogada.
- O app ancora o stream codificado inteiro antes de libertar qualquer parte.

Isso é especialmente perigoso em dispositivos móveis com RAM limitada e em gravações longas.
Não é um problema para clips sociais curtos.

Hoje ainda **não existe**:
- Stream para arquivo via File System Access API.
- Stream para OPFS.
- Preflight de tamanho estimado antes de gravação longa.
- Alerta/alternativa para dispositivos com pouca memória.

## 6. Configuração do renderer — hoje muito agressiva por padrão

`VisualEngine` cria o renderer assim:

```ts
new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  premultipliedAlpha: false,
})
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.04
renderer.setPixelRatio(1)
```

Pontos de atenção:
- `powerPreference: 'high-performance'` é solicitado para **todo mundo**, inclusive dispositivos móveis
  e laptops com GPU integrada e restrições térmicas.
- `antialias: true` é fixo.
- A adaptação de resolução existe, mas só reduz escala interna; não reduz, por exemplo, MSAA,
  custo do pass de acabamento, densidade de partículas ou frequência de renderização.
- Não há perfil de dispositivo: o app escolhe qualidade por configuração manual, não automaticamente.

## 7. Resumo inicial de suspeitas (Classificação preliminar)

A classificação detalhada vai para `PERFORMANCE_BOTTLENECKS.md`. Em resumo, nesta baseline:

Alta confiança / impacto provável:
1. Arraste no Stage pode reconstruir composição completa a cada movimento.
2. FinishPass de alta resolução + 4 MSAA + 3 samples por fragmento roda sempre que o Stage desenha.
3. Duas decodificações do mesmo arquivo (ritmo + waveform).

Confiança média / impacto provável:
4. Dois loops RAF contínuos rodam mesmo sem áudio/reprodução/aba visível.
5. Gravacao longa acumula o vídeo completo em memória sem stream para disco.
6. `powerPreference: 'high-performance'` padrão para todos os dispositivos.

Confiança menor ou dependente de medição:
7. `CompositionLayer.resize()` reconstrói tudo em troca de aspecto/quality.
8. `WaveformLine.computeBoundingSphere()` todo frame.
9. TextLayer recria canvas/texture em mudança real de conteúdo (aceitável, mas verificar se o cachê está sendo benefício real).
10. Ausência de code splitting para módulos opcionais.

## 8. O que não está na baseline por enquanto

Não foi medido neste momento (e não será aludido como medido):
- Heap snapshots antes/depois.
- Tempo de primeiro frame significativo.
- Desempenho real em dispositivo móvel físico.
- Medição de FPS/P50/P95 em uso real por cenário.
- Tamanho efetivo de memória do blob vs chunks vs preview durante gravação longa.

Isso será adicionado à medida que a otimização avança e/ou ficar acreditável de medir aqui.
