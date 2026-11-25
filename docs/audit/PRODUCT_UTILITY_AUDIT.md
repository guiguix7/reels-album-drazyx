# Auditoria de utilidade do produto — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Escopo: deploy público. A avaliação pergunta, para cada controle, **qual problema
do usuário ele resolve, se a resolução é compreensível, se produz efeito
observável e se deve ser mantido, simplificado, redesenhado ou removido.**
Não é uma lista de desejos: cada lacuna abaixo foi ligada a uma tarefa real de
quem publica Reels/Shorts.

## Proposta de valor observada

“Transforme uma faixa e uma capa em um visualizer vertical de até 30 s, no
navegador, e baixe um WebM com áudio.” O valor central é **produzir um vídeo
social pronto para postar sem editor externo**. O app entrega isso no caminho
9:16 + T3/T4/T5: upload, composição, texto, gravação e download. O export real
foi validado (1080×1920, 5,1 s, VP9/Opus, 1,82 MB).

O que enfraquece a proposta:

- A produção está **desatualizada** em relação ao repositório e ao próprio
  README: não há MOVIMENTO, RECIPES, BATCH CREATOR, RETENTION LAB nem perfis de
  plataforma, embora o branch contenha esses recursos. O bundle servido
  (`index-CWnQNSHb.js`) não contém esses textos; o build local atual gera
  `index-DcRn0TYS.js`.
- Cinco dos oito layouts anunciados não funcionam (BUG-01).
- A ação de exportar está escondida no fim de uma coluna de 3.581 px (UX-01).

## Mapa de utilidade

| Área / controle | Problema que promete resolver | Efeito observado | Compreensão | Veredito |
|---|---|---|---|---|
| Carregar áudio | Fornecer a matéria-prima e o ritmo | Decodifica, mostra duração e BPM | Clara | **Manter** |
| Carregar capa | Dar identidade visual e paleta | Atualiza Stage e paleta automática | Clara, mas sem miniatura | **Manter + preview** |
| Remover áudio/capa | Recomeçar sem recarregar a página | Funciona; volta ao vazio | Clara | Manter |
| 8 cards de layout | Variar a composição para diferentes conteúdos | 3 funcionam; 5 são no-op | Card parece clicável | **Corrigir (P1)** |
| 4 estilos visuais | Mudar a “cena” (Mirage, Afterimage, Void, Spectrum) | Todos selecionam; diferenças por vezes sutis | Nomes poéticos, sem preview claro | Manter, com thumbnails reais |
| Storyboard (toggle + presets) | Criar arco de hook → revelação → pico → CTA | Presets mudam a duração; sem áudio o auto fica indisponível | “Hook/CTA” é jargão para parte do público | **Manter, mas progressive disclosure** |
| Extrair paleta / modo manual | Coerência de cor com a capa | Funciona; três cores editáveis | Clara | Manter |
| Início + duração (sliders) | Escolher o trecho que vira vídeo | Funciona, mas sem waveform; passo 0,5 s; faixa de 2 s vira 5 s | Só entende quem já conhece edição | **Redesenhar (P2)** |
| Intensidade, partículas, grave, brilho, grão, câmera | Ajuste fino da cena | Efeitos existem, mas são difíceis de comparar; seis sliders 0–100% | Rótulos claros, efeito não | **Simplificar / agrupar** |
| Glitch OFF/SUTIL/FORTE | Quebra visual pontual | Três estados respondem | Clara | Manter (avançado) |
| Escala / tracking | Ajuste tipográfico | Responde; tracking em número sem unidade | “Tracking 6” não é autoexplicativo | Manter com exemplos |
| Cinco campos de texto + checkboxes | Controlar o que aparece no vídeo | Funciona; checkbox liga/desliga cada linha | Clara | **Manter, com validação de overflow** |
| 9:16 / 1:1 / 16:9 | Adaptar ao destino | 1:1 correto; 16:9 esticado (BUG-02) | Clara | **Corrigir (P1)** |
| FULL 1080 / LEVE 720 | Pesar qualidade × tempo/arquivo | 1080 gera 1,82 MB/5 s; 720 não testado | “Leve” é claro; “FULL” é vago | Manter + estimativa de tamanho |
| 30 / 60 fps | Suavidade | 30 fps validado; 60 não testado | Clara | Manter |
| Gravar trecho | Exportar o vídeo final | Valida em aba visível; falha em automação/aba oculta | Clara quando encontrado | **Mover para CTA fixo (P1)** |
| Preview + baixar + descartar | Conferir e salvar | Preview com metadados corretos; download nomeado | Clara | **Manter** |

## Recursos que faltam para a tarefa real

| ID | Lacuna | Por que importa | Prioridade |
|---|---|---|---|
| MISSING-01 | **Salvar/retomar projeto** (produção) | Recarregar a página perde áudio, capa, ajustes e gravação. Publicar um Reels costuma envolver revisão em outra sessão. O branch tem persistência, mas ela não está no deploy. | P2 |
| MISSING-02 | **Seleção visual do trecho (waveform)** | Sem forma de onda, o usuário não vê onde está o drop/refrão; escolhe às cegas com dois sliders. É a maior lacuna de utilidade criativa. | P1 |
| MISSING-03 | **Perfis/atalhos de plataforma** | O usuário precisa saber que Reels é 9:16/1080/30; TikTok/Shorts idem, feed 1:1. O branch tem perfis, o deploy não. | P2 |
| MISSING-04 | **Undo/redo** | Ajustes criativos são destrutivos e não há histórico. Um clique errado em “Redefinir” perde o look. | P2 |
| MISSING-05 | **Guias de área segura / UI do Reels** | O CTA pode ficar sob a interface do Instagram/TikTok; não há overlay de zona segura. | P2 |
| MISSING-06 | **Crop/enquadramento da capa** | Capas quadradas em 9:16 são recortadas sem controle; não há zoom/posição. | P3 |
| MISSING-07 | **Presets salvos / marca** | Quem publica semanalmente refaz o mesmo estilo; não há “meu preset”. | P3 |
| MISSING-08 | **Batch/recipes/retention** | Existem no branch, mas não no deploy; não foram avaliados como recurso em produção. | P3 (após publicar) |

## Recursos presentes que não justificam o custo

- **Seis sliders de cena + glitch + escala + tracking** ocupam ~40% do painel
  Visual e produzem diferenças difíceis de perceber em miniatura. Para o
  usuário iniciante, um preset “suave/cinematográfico/agressivo” + “avançado”
  resolveria melhor.
- **Quatro estilos com nomes poéticos** sem thumbnails de resultado. O usuário
  precisa clicar em cada um para descobrir; nomes como “VOID” e “AFTERIMAGE”
  não antecipam a imagem.
- **Dois cards quase idênticos** (T1/T2) e **cards que não funcionam** (T6–T8)
  aumentam a sensação de escolha sem entregar variedade.

## Utilidade percebida por perfil

| Perfil | O que precisa | O app entrega? |
|---|---|---|
| Criador de Reels musical | Vertical, capa, trecho do drop, CTA, arquivo com áudio | Parcialmente: vertical e export ok; trecho às cegas; 5 layouts quebrados |
| Designer/editor | Controle de composição e tipografia | Parcialmente: T3/T4/T5, bons controles de texto; sem safe area/undo |
| Podcaster/clipador | Corte de 15–30 s com legendas | Não: sem waveform, sem legendas, sem fala |
| Pequeno negócio | Reaproveitar capa/logo e template consistente | Parcialmente: sem salvar preset/projeto |
| Usuário móvel | Fazer tudo no celular | Parcialmente: layout responsivo, mas record a 4.205 px e upload fora da dobra |

## Conclusão

O produto tem uma **utilidade central real** e um caminho de export que
funciona. Ainda assim, a produção entrega uma fração do que o repositório e a
UI prometem, e as duas tarefas mais importantes — escolher o trecho certo e
exportar — são as mais mal servidas (sem waveform; CTA enterrado). A prioridade
de utilidade não é adicionar recursos: é **fazer os oito layouts funcionarem,
corrigir a prévia 16:9, colocar a gravação ao alcance e dar contexto ao trecho**.
