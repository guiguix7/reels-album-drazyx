# PERFORMANCE BOTTLENECKS — DRAZYX VISUALIZER STUDIO

Última atualização: 2026-11-25
Base: leitura do código atual + baseline de build/test.
Usado como guia de prioridade para as fases de otimização.

## Como ler esta página

Duas dimensões:
- **Impacto estimado**: o quanto isso deve afetar CPU/GPU/memória/instabilidade.
- **Confiança**: o quanto posso afirmar isso antes de medir.

Recomendação é reclassificar tudo após medição real nas fases seguintes.

## 1. Arraste no Stage recompila a composição inteira (alta confiança / impacto alto)

**Onde:** `CompositionLayer.rebuild()`, `VisualEngine.setElements()`,
`Stage.tsx` efeito `[elements]`, `CompositionOverlay` moveDrag.

**O que acontece:**
Movimento, redimensionamento ou rotação disparam `updateElement` → novo array de elementos →
`setElements` → `rebuildComposition()` → dispose de tudo + recriação de tudo.

**Por que é grave:**
- Um arraste comum vira múltiplas reconstruções completas.
- Recria texturas de texto, 커버 카드, waveforms, players, formas.
- Gera alocações e GC durante interação, não só em mudanças estruturais.
- É exatamente o tipo de coisa que trava editores criativos em uso real.

**O que provavelmente resolverá:**
Atualização incremental. Um movimento atualiza posição; um redimensionamento atualiza tamanho;
mudança de opacidade atualiza material; rotação atualiza transform.
Só recriar recursos quando realmente mudar conteúdo/estrutura/dimensões do mundo.

## 2. FinishPass caro por padrão (alta confiança / impacto alto)

**Onde:** `objects/finish-pass.ts`, `VisualEngine.renderFrame()`.

**O que acontece:**
Render target half-float + 4 MSAA + cena completa + fullscreen shader com 3 samples de textura
e vários efeitos por fragmento, a cada frame, na resolução atual (até 1080×1920).

**Por que é grave:**
- Multiplica custo GPU com a resolução.
- Roda mesmo em cenas quasi-estáticas.
- não há perfil leve para ele hoje.

**O que provavelmente resolverá:**
Não removê-lo. Torná-lo adaptável:
- baixa memória: lower resolution target, menos/msaa zero, efeitos opcionais.
- balanced: o que temos, mas em escala adaptada.
- high quality: full quando o dispositivo sustentar.
- export: perfil de gravação que preserva qualidade com gerenciamento de recursos.

## 3. Duplicação de decodificação de áudio (alta confiança / impacto médio-alto)

**Onde:** `AudioEngine.detectRhythm()` e `waveform.ts:loadWaveformPeaks()`.

**O que acontece:**
O mesmo arquivo local é decodificado duas vezes por caminhos diferentes, com dois contextos distintos.

**Por que é grave:**
- Evitável sem perder funcionalidade.
- Mais crítico em faixas longas.
- Pior em dispositivos com menos RAM/CPU.

**O que provavelmente resolverá:**
Pipeline de análise reutilizável: decodificar uma vez, reter análise compacta,
liberar PCM grande quando não for mais necessário, adiar análise pesada até necessário.

## 4. Dois loops contínuos rodando sempre (confiança média / impacto médio)

**Onde:** `AudioEngine.startLoop()`, `VisualEngine.start()`.

**O que acontece:**
- AudioEngine analisa a cada frame mesmo sem áudio carregado.
- VisualEngine renderiza a cada frame mesmo pausado/obscuro.

**Por que é grave:**
- Trabalho desnecessário em idle e em aba oculta.
- Contribui para consumo de bateria/CPU mesmo sem interação.

**O que provavelmente resolverá:**
- AudioEngine: analisar só quando há áudio e só quando necessário; reduzir em pausa/oculto.
- VisualEngine: já tem `handleVisibility`, mas pode reduzir frequência em pausa/cena estática.

## 5. Gravação acumula vídeo completo em memória (confiança média / impacto médio-alto em longo)

**Onde:** `StageRecorder`, `recorder.ts`.

**O que acontece:**
Chunks acumulam; no stop, monta o blob completo; preview mantém object URL até substituição.

**Por que é grave:**
- Seguro para clips curtos.
- Potencialmente perigoso para gravações longas em dispositivos limitados.
- Não há alternativa de streaming/arquivo local nem aviso prévio.

**O que provavelmente resolverá:**
Sink abstrato com estratégias: memória (curto), File System Access (explícito), OPFS (se confiável),
fallback com aviso/estimativa/alternative para gravações longas.
Liberar chunks intermediários quando possível.

## 6. Renderer configurado para máximo por padrão (confiança média / impacto médio)

**Onde:** `VisualEngine` construtor, `performance.ts`.

**O que acontece:**
`powerPreference: 'high-performance'`, `antialias: true`, pixel ratio fixo 1,
sem perfil de dispositivo real.

**Por que é grave:**
- Pedir alto desempenho para todo mundo é especialmente ruim em móveis/integrados.
- Adaptação de resolução existe mas é só parte da história.

**O que provavelmente resolverá:**
Detect capability hints (deviceMemory, hardwareConcurrency, WebGL limits, measured behavior),
escolher perfil automaticamente e tornar os perfis mais expressivos
(low/balanced/high/export com efeitos e alocação adequados).

## 7. Resize do composition layer reconstrói tudo (confiança média / impacto variável)

**Onde:** `CompositionLayer.resize()`.

**O que acontece:**
Qualquer mudança de view size reconstrói elementos, não apenas os dependentes de tamanho.

**Por que pode ser grave:**
- Troca de aspecto/quality aciona reconstrução.
- Reconstrói texturas de texto desnecessariamente se o conteúdo não mudou.

**O que provavelmente resolverá:**
Reconstruir só recursos dependentes de tamanho; atualizar outros in place.

## 8. Ondas de pequeno custo que somam (confiança baixa-média / impacto baixo-médio)

**Onde:** `WaveformLine.update()` (`computeBoundingSphere` todo frame),
`TextLayer` recria canvas/texture em mudança real.

**O que fazer:**
- remover computeBoundingSphere desnecessário.
- manter cachê de texto, mas revisar se chave está correta para evitar recriação por mudanças irrelevantes.

## 9. Code splitting ausente (confiança média / impacto médio em startup)

**Onde:** ponto de entrada único do app.

**O que acontece:**
Todas as features carregam de uma vez.

**Por que pode ser grave:**
- Aumenta tempo de start e memória inicial.
- Módulos pesados/opcionais poderiam carregar sob demanda.

**O que provavelmente resolverá:**
Lazy loading para recursos não essenciais: retention lab, batch creator, histórico avançado, painéis
pouco usados. Não atrasar Stage nem essência do fluxo.

## 10. Outras suspeitas a confirmar ou descartar por medição

- Overdraw/transparentes/partículas: existe, mas espera-se que seja menor que os pontos 1 e 2.
- Context loss: não amplamente observado neste momento, mas deve ter tratamento/resiliência.
- Quantidade de draw calls / materiais: revisar em fases de renderização.
- Alocação de vetores temporários no loop: pesquisar no código real das funções de análise.

## Classificação rápida para decisão

| # | Problema | Impacto | Confiança | Fase provável |
|---|---|---|---|---|
| 1 | Reconstrução do composition layer no arraste | alto | alta | 1 |
| 2 | FinishPass sempre caro | alto | alta | 2 |
| 3 | Duplicação de decode | médio-alto | alta | 3 |
| 4 | Dois loops contínuos | médio | média | 1–2 |
| 5 | Memória de gravação longa | médio-alto (longo) | média | 4 |
| 6 | Renderer agressivo por padrão | médio | média | 2 + 5 |
| 7 | Reconstrução no resize | variável | média | 1 |
| 8 | Custos pequenos somáveis | baixo-médio | baixa-média | 1–2 |
| 9 | Sem code splitting | médio (startup) | média | 6 |
| 10 | Suspeitas a medir | variável | baixa | 0/7 |

Esta classificação é preliminar e será atualizada após medição real.
