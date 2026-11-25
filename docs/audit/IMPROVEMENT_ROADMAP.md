# Roadmap de melhorias — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Base: achados de `MASTER_FINDINGS.md`. Ordem por **impacto no usuário × esforço**,
não por preferência estética. Nenhuma correção foi aplicada nesta auditoria.

## Princípios

1. **Restaurar confiança antes de adicionar recursos.** Cinco layouts mortos e
   uma prévia distorcida custam mais que qualquer feature nova.
2. **Uma ação principal visível.** O usuário nunca deve rolar 3.500 px para
   exportar.
3. **Fidelidade preview = arquivo.** O que se vê no Stage é o que sai no WebM.
4. **Progressive disclosure.** O básico primeiro; sliders avançados depois.
5. **Cada correção com teste de aceitação.** Especialmente layouts e formatos.

## Fase 0 — Correções de confiança (1–2 dias)

| Ordem | Item | Achado | Esforço | Critério de pronto |
|---|---|---|---|---|
| 1 | Incluir todos os ids no `TEMPLATE_IDS` / derivar do registry | BUG-01 | S | Clicar em cada um dos 8 cards muda `aria-selected` e o Stage; teste cobre os 8. |
| 2 | Corrigir o contêiner do Stage para 16:9 | BUG-02 | S | Canvas e contêiner com a mesma razão em 1440×900 e viewport alta; 1:1/9:16 preservados. |
| 3 | Transformar “Gravar trecho” em CTA persistente | UX-01 | S/M | Botão visível sem rolar no desktop e no mobile; estado de progresso; mantém o painel. |
| 4 | Corrigir colisão título/artista no MIRAGE | QUALITY-01 | M | Títulos curtos e longos sem sobreposição no preview e no export. |
| 5 | Publicar o branch atualizado após QA | PRODUCT-01 | S/M | Produção com o mesmo bundle/feature set do branch; hash verificável. |

**Por que primeiro:** são os cinco P1; quatro são correções pequenas e a quinta
é processo. Sem isso, melhorias de UX são construídas sobre uma base quebrada.

## Fase 1 — Fluxo e validação (1 semana)

| Item | Achado | Esforço | Critério de pronto |
|---|---|---|---|
| Estado vazio integrado ao Stage (sem cobrir texto) | UX-03 | S | Nenhuma sobreposição; CTA de upload no Stage. |
| Validação de áudio curto no load | BUG-03 | S | Áudio <5 s desabilita gravar com explicação, ou mínimo real de 2 s; slider clampado. |
| Contraste do botão primário | ACCESS-02 | S | ≥4,5:1 para texto normal. |
| Alvos de toque 44 px | ACCESS-01 | S | Botões/segmentados/sliders com área mínima no mobile. |
| `aria-live` para status/erros + canvas nomeado | ACCESS-03 | S | Upload, BPM, gravação e erro anunciados; canvas com `role`/label. |
| Reduzir texto <12 px e agrupar avançados | UX-04 | M | Nenhum texto auxiliar abaixo de 12 px; “Avançado” recolhido. |
| Onboarding em 5 passos | UX-05 | M | Primeira visita mostra 1 Fonte → 2 Estilo → 3 Trecho → 4 Texto → 5 Exportar. |

**Por que agora:** depois de restaurar o núcleo, o próximo gargalo é o usuário
não saber o que fazer nem confiar no que vê.

## Fase 2 — Utilidade criativa (2–4 semanas)

| Item | Achado | Esforço | Critério de pronto |
|---|---|---|---|
| Waveform com seleção do trecho | MISSING-02 | M/L | Arrastar seleção, zoom, prévia do trecho, duração precisa. |
| Persistência local + autosave + “meus projetos” | MISSING-01 | M | Recarregar restaura áudio/capa/config; lista de projetos; sem upload. |
| Undo/redo de configurações | UX-06 | M | Pelo menos texto, paleta, visual e formato. |
| Safe area 9:16 + guias de UI | MISSING-05 | S/M | Overlay opcional com zonas de Reels/TikTok/Shorts. |
| Presets de plataforma | MISSING-03 | S | Reels/TikTok/Shorts/Feed ajustam formato, resolução, fps. |
| Corrigir T1/T2 e equilibrar T4 | QUALITY-03/04 | M | T2 visivelmente diferente; T4 sem vazio involuntário. |
| Remover/reduzir fantasmas de capa | QUALITY-02 | S | Nenhum texto fantasma atrás do bloco principal. |
| CTA animado e teste de safe area | QUALITY-05 | S | Entrada do CTA nos últimos 2 s; dentro da zona segura. |

## Fase 3 — Diferenciação e retenção (4–8 semanas)

| Item | Achado | Esforço | Observação |
|---|---|---|---|
| Publicar MOVIMENTO/RECIPES/BATCH/RETENTION do branch | PRODUCT-01 | M | Só depois de QA; não misturar com correções. |
| Storyboard curto por padrão (hook → reveal → CTA) | QUALITY-05 | M | Testar retenção com métricas reais. |
| Legendas/letra sincronizada | MISSING-02/novo | L | Diferencial para TikTok/Reels. |
| Presets de marca salvos | MISSING-07 | M | Reuso semanal. |
| Crop/enquadramento de capa | UX-07 | M | Zoom/posição com máscara. |
| Loop perfeito e validação de sync | AUDIOVISUAL | M | Medir offset de beat e loop. |
| 720p/60 fps/30 s com validação de arquivo | TEST-01 | S/M | Cobrir matriz de export. |
| Performance: preview adaptativo + orçamento de FPS | PERF-01/02 | M | Medir em hardware real. |

## Matriz impacto × esforço

| | Esforço baixo | Esforço médio | Esforço alto |
|---|---|---|---|
| **Impacto alto** | BUG-01, BUG-02, UX-01, ACCESS-02, BUG-03 | QUALITY-01, waveform, persistência, onboarding | — |
| **Impacto médio** | UX-03, ACCESS-01/03, QUALITY-02, presets de plataforma | T1/T2, T4, safe area, undo | legendas, batch |
| **Impacto baixo** | copy de privacidade, tooltips | crop, loop | — |

## Cinco próximas ações

1. **Corrigir os oito layouts** (BUG-01): uma linha de dados + teste de
   aceitação. É a correção de maior impacto por menor custo.
2. **Consertar o Stage 16:9** (BUG-02): uma regra de layout; impede decisões
   criativas erradas.
3. **Fixar o CTA de gravação** (UX-01): barra no Stage/rodapé; torna o produto
   descobrível.
4. **Corrigir a tipografia do MIRAGE** (QUALITY-01): o arquivo padrão precisa
   sair legível.
5. **Publicar o branch com QA e versionar o deploy** (PRODUCT-01): alinhar
   produção e repositório; sem isso, o trabalho já feito não chega ao usuário.

## Métricas para validar o roadmap

- **Ativação**: % de visitantes que carregam áudio e chegam a “Gravação
  concluída”.
- **Tempo até o primeiro export**: meta <3 min no caminho feliz.
- **Sucesso de export**: % de gravações com Blob >0 e áudio presente.
- **Erros por layout**: zero cards sem efeito.
- **Acessibilidade**: contraste ≥4,5:1; 0 violações críticas de axe; CTA
  alcançável em ≤10 Tabs.
- **Performance**: 30 fps estáveis em mobile médio; preview ≤720p fora do
  export.

## Não fazer agora

- Redesign visual completo: a identidade funciona; o problema é hierarquia.
- Novos templates antes de os oito existentes funcionarem.
- Analytics/integrações de terceiros antes de resolver privacidade e copy.
- Batch/recipes em produção antes de um export 9:16 confiável e testado.
