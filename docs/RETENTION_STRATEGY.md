# Estratégia de Retenção — DRAZYX VISUALIZER STUDIO

Documento de baseline da Fase 0. Descreve o que existe hoje, as lacunas de produto,
a arquitetura proposta para vídeos orientados a retenção e os riscos conhecidos.
Não declara funcionalidades que ainda não foram implementadas.

## 1. O que já existe (verificado no código e nos testes)

- Editor React + TypeScript + Vite, Stage WebGL (Three.js) separado da UI.
- Upload local de áudio e capa, playback, pause, seek, remoção e substituição.
- Análise em tempo real: FFT, waveform, bass, mid, treble, RMS, energia e transiente.
- Seleção de trecho (5–30 s), duração padrão de 30 s e auto-stop pela timeline do áudio.
- 7 templates visuais: MIRAGE, AFTERIMAGE, VOID, SPECTRUM, TEMPLATE 03, 04 e 05.
- Metadados editáveis (artista, faixa, álbum, CTA) e parâmetros de cena.
- Exportação 9:16 / 1:1 / 16:9, 720p / 1080p, 30 / 60 fps.
- Gravação real via `canvas.captureStream()` + `MediaStreamAudioDestinationNode` +
  `MediaRecorder`, com preview e download após o término.
- Paleta automática extraída da capa (com fallback manual) e estimativa de BPM.
- 60 testes unitários, lint, typecheck e build verdes na baseline.

## 2. Limitações atuais relevantes para retenção

- Um único template/layout por export: não há storyboard com múltiplas cenas.
- Sem Hook Engine: a abertura é fixa por template, não testável por variante.
- Sem recipes (formatos narrativos reutilizáveis) nem batch de variações.
- Sem persistência de projeto: recarregar a página perde configuração e assets.
- Sem registro local de desempenho (views, retenção, saves, cliques).
- Sem separação formal entre layout, estilo visual e perfil de movimento.
- WebM é o formato confiável; MP4 depende do navegador e não é prometido.
- Sem detecção de seções/beat como verdade absoluta; BPM é estimativa.
- Referências visuais originais (8 wireframes e “Broken Poems”) não estavam
  disponíveis no ambiente durante a auditoria; a direção segue as descrições do prompt.

## 3. Relação entre retenção e funcionalidades

| Alavanca de retenção | Funcionalidade que a habilita | Fase |
|---|---|---|
| Parar o scroll nos primeiros segundos | Hook Engine com variantes A–E e preview A/B | 2 |
| Vídeo que evolui e surpreende | Storyboard com cenas, transições e pico emocional | 2 |
| Identidade visual reconhecível | 8 layouts distintos + estilos MIRAGE/AFTERIMAGE/VOID/SPECTRUM | 3 |
| Movimento que acompanha a música | Motion profiles (DREAM, PULSE, CINEMATIC, FRAGMENT, ORGANIC, INTENSE, MINIMAL) | 4 |
| Volume de testes sem retrabalho | Recipes + Batch Creator com platform profiles | 5 |
| Aprendizado com dados reais | Persistência local + Retention Lab (métricas manuais/CSV) | 6 |
| Qualidade e consistência | Otimização, revisão visual por proporção, regressão | 7–8 |

## 4. Arquitetura proposta (evolutiva, sem rewrite)

Camadas atuais preservadas: UI → Project State → Audio Engine → Visual Engine → Recorder.

Adições planejadas:

1. **Layouts** (`visualizer/layouts/`): composição geométrica por proporção
   (9:16, 1:1, 16:9), sem cores fixas de lançamento.
2. **Visual Styles**: MIRAGE, AFTERIMAGE, VOID, SPECTRUM e equivalentes antigos
   (T3/T4/T5) como presets de cor, luz, textura e intensidade.
3. **Storyboard** (`features/storyboard/`): cenas tipadas com `role`, `layoutId`,
   `visualStyleId`, `transition`, `motionProfile`, textos e keyframes. O engine
   visual consome a cena ativa; a timeline continua tendo o áudio como fonte de verdade.
4. **Hook Engine**: presets de abertura com duração configurável (0–1 s interesse,
   1–3 s curiosidade, 3–5 s revelação) aplicados como primeira cena.
5. **Motion System**: perfis que combinam parâmetros de câmera, partículas,
   reação a graves/agudos e eventos de transiente, com determinismo por seed.
6. **Recipes/Batch**: presets de produção que populam storyboard + export config;
   fila de jobs reaproveitando o mesmo pipeline de gravação.
7. **Persistência local** (IndexedDB): projetos, assets e manifests de export.
8. **Retention Lab**: entrada manual/CSV de métricas por variante e dashboard
   comparativo com definições transparentes, sem alegar causalidade.

## 5. Prioridade e dependências

Ordem obrigatória do master prompt (um commit por fase):

0. Baseline documentado e checks verdes. *(concluída nesta fase)*
1. Robustez de áudio, gravação e estado do editor.
2. Storyboard + Hook Engine (depende de 1).
3. Oito layouts + galeria (depende de 2 para cenas).
4. Motion engine avançado (depende de 3).
5. Recipes + batch (depende de 2–4).
6. Persistência + Retention Lab (depende de 5 para manifests úteis).
7. Performance/QA visual/export (após features estáveis).
8. Regressão ampla e documentação final.

## 6. Riscos e dependências

- **Áudio no arquivo final**: nunca considerar a gravação válida sem track de áudio
  real; testar com arquivo baixado e `ffprobe` quando disponível.
- **MediaRecorder/codecs**: suporte varia por navegador; detectar dinamicamente,
  usar MIME real e extensão coerente; WebM como caminho confiável.
- **Ciclo de vida de mídia**: revogar Object URLs, parar tracks e liberar nós de áudio;
  a track de áudio precisa continuar reutilizável em gravações seguintes.
- **Three.js**: limpar cena entre templates (já corrigido com `scene.clear()`),
  evitar alocações por frame e liberar texturas/geometrias/materiais.
- **Ambiente OneDrive/Vite**: cache de transform já exigiu reinício do dev server;
  documentar como troubleshooting.
- **Tempo real**: animação deve continuar viva em trechos silenciosos e busca
  reversa deve reconstruir o estado pelo tempo do áudio.
- **Escopo**: 8 layouts + storyboard + recipes + batch + retention é grande;
  cada fase deve permanecer executável e testada antes do commit.

## 7. Compatibilidade

- Alvo principal: Chrome e Edge desktop atuais (MediaRecorder + WebGL + Web Audio).
- Firefox/Safari: compatibilidade progressiva; codecs e APIs podem diferir.
- Sem backend, sem APIs pagas, sem trackers; áudio e imagens permanecem no navegador.
- Export 1080p pode cair para 720p em hardware modesto.
