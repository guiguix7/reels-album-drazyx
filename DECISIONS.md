# DECISIONS — Linha de performance

## 1. Eixo de otimização
Não se trata de remover funcionalidades criativas, mas de reduzir o custo de execução
(GPU, CPU e memória) mantendo comportamento visual e qualidade de exportação.

## 2. Perfis de renderização (Fase 2–5)
- **Não há um único perfil para todos.** O sistema combina escolha explícita do usuário
  com detecção automática de capacidade.
- Os perfis `auto`, `performance`, `balanced`, `quality` e `export` cobriram escala,
  amostragem de MSAA, tipo de target (half-float/byte), habilitação do FinishPass e
  antialiasing.
- A **qualidade de exportação sempre permanece cheia**; a adaptação só age no preview
  (e nunca diminui a resolução do arquivo de vídeo).

## 3. Detecção de dispositivo (Fase 5)
- O app não impõe limites arbitrários: lê apenas indícios (`deviceMemory`,
  `hardwareConcurrency`, `maxTextureSize`, suporte a WebGL2, half-float, amostragem),
  usados para definir um perfil padrão razoável quando o usuário pede `auto`.
- O tipo `Navigator.deviceMemory` é acessado por `typeof === 'number'`, e o módulo
  `device-performance` encapsula a leitura de maneira type-safe.

## 4. Pass de acabamento (Fase 2)
- **FinishPass** é reconfigurável: amostragem de render target, tipo de target e
  habilitação do shader de acabamento. Quando desabilitado, o motor renderiza a cena
  direto no canvas.
- Isso permite degradar GPU durante edição e aplicar qualidade cheia apenas no
  export.

## 5. Context loss WebGL (Fase 2)
- `webglcontextlost` para o loop e tenta reconstruir renderer + FinishPass no
  `webglcontextrestored`, sempre com comportamento gracioso (não quebra o app).

## 6. Análise de áudio (Fase 3)
- Um único cache compartilhado por **URL + buckets** decodifica o arquivo local uma
  vez e serve picos da waveform e rítmo a partir do mesmo decode.
- `clear()` invalida o cache e revoga o object URL, evitando decodificações
  duplicadas e memory leaks.

## 7. Gravação longa (Fase 4)
- O app não “desliga” a gravação longa; adiciona um **preflight** que estima tamanho
  e memória, e adverte com o store. O usuário decide se segue com a resolução cheia
  ou reduz.
- **OPFS** é opcional e opt-in; nunca ativado automaticamente.

## 8. Tratamento de perda de contexto e visibilidade
- Durante a perda de visibilidade, o engine mantém estado, não impede o retorno.
- A perda de contexto não apaga o app; tenta restaurar.

## 9. Regra de commit
- Sempre rodar lint, typecheck, testes e build antes de qualquer commit.
- Nunca afirmar métrica sem medida; sempre registrar àquela execução específica.

## 10. Documentação
- `docs/performance/PERFORMANCE_BASELINE.md` (baseline)
- `docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md` (evolução, medidos)
