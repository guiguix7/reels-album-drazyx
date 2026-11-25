# Acessibilidade, performance e privacidade — DRAZYX VISUALIZER STUDIO

Data: 2026-11-25
Base: deploy público, Chrome 158, viewports de 1920 a 360 px. Não houve teste
com leitor de tela real nem auditoria Lighthouse completa; as conclusões vêm
de DOM, teclado, contraste calculado e medições de rede/carga.

## Acessibilidade

### Estrutura e semântica

- `lang="pt-BR"` e `<title>` corretos.
- Um `<main>`, um banner e uma região complementar (“Painéis do editor”).
- Dois `role="listbox"` para layouts/estilos, com 12 `role="option"` no total.
- **O canvas do Stage não tem `role`, `aria-label` nem descrição**. Um usuário
  cego não sabe que existe uma prévia visual nem o que ela contém.
- **Não há `aria-live`, `role="status"` ou `role="alert"`** em nenhum lugar.
  Mensagens como “Decodificando áudio…”, “Áudio pronto”, “muito curto” e
  “gravação sem conteúdo” aparecem visualmente, mas não são anunciadas.
- Os dois únicos controles sem rótulo são `input[type=file]` ocultos
  (`display:none`), não focáveis; não são um problema de leitor de tela, mas
  poderiam ter `aria-label` por completude.
- O padrão listbox não implementa navegação por setas/Home/End; os cards são
  botões com `role="option"`. Falta o comportamento esperado do padrão ARIA.

### Teclado e foco

- `:focus-visible` tem `outline: solid 2px` e offset — **foco visível, ponto
  positivo**.
- Há **62 elementos tabuláveis**; a gravação é o último. No móvel, isso exige
  dezenas de Tabs ou rolagem.
- Não há skip link para o Stage ou para a gravação.
- A ordem de tabulação segue o DOM (Fonte → cards → estilos → storyboard →
  paleta → trecho → visual → tipografia → formato → gravação), o que é lógico
  para configuração, mas não para a tarefa principal.

### Contraste

| Combinação | Razão | Onde | WCAG AA (texto normal) |
|---|---|---|---|
| `#FFFFFF` / `#B84DFF` | **3,79:1** | botões primários (12 px) | **Reprova** |
| `#F2EDF5` / `#11101A` | ~16:1 | texto principal | Passa AAA |
| `#A99EAE` / `#11101A` | 7,36:1 | secundário | Passa AA |
| `#CF8AFF` / `#11101A` | 7,85:1 | acento | Passa AA |

O botão primário é o principal problema: além do contraste, texto branco sobre
roxo claro reduz a hierarquia em relação ao fundo. Um accent mais escuro ou
texto escuro sobre o roxo resolveria.

### Tamanho de texto e alvos

- 76 de 137 textos do painel têm menos de 12 px (9,5–11 px).
- Botões pequenos medidos entre 25 e 34 px de altura; sliders com thumb de
  14 px. Abaixo dos 44×44 px recomendados para toque.
- O botão de ícone de 34×34 px sem nome acessível textual (apenas ícone) foi
  observado; precisa de `aria-label`.

### Movimento

O CSS global respeita `prefers-reduced-motion` **apenas para transições/animações
CSS**; o comentário no código diz explicitamente que “o visualizer permanece”.
O canvas continua em `requestAnimationFrame`, e não há botão de pausar o
movimento. Pessoas com sensibilidade vestibular não conseguem parar a cena
(apenas pausar o áudio). O storyboard também anima.

### Recomendações de acessibilidade

1. `aria-live="polite"` para status e `role="alert"` para erros de upload/
   gravação; associar mensagens ao campo.
2. Nomear o canvas: `role="img"`/`aria-label="Prévia do visualizer 9:16"` e um
   resumo textual do template e do trecho.
3. Botão “Pausar movimento” e respeito real a `prefers-reduced-motion` no
   engine (reduzir partículas/câmera, não só CSS).
4. Corrigir contraste do botão primário; aumentar alvos para 44 px.
5. Implementar setas no listbox ou trocar por botões/radios nativos.
6. CTA de gravação também acessível por atalho e no topo da ordem de foco.

## Performance

### Números medidos

| Métrica | Valor | Contexto |
|---|---|---|
| Transferência inicial | ~215 KB | assets iniciais observados na rede da página |
| DOMContentLoaded | 483–629 ms | duas execuções, rede local |
| Heap JS | ~70,6 MB | após carregar áudio e interagir; leitura do Chrome |
| Bundle principal | 797,84 kB (218,88 kB gzip) | build local; 126 módulos |
| Canvas no preview móvel | 1080×1920 | medição logo após carga em 390×844 |

### Análise

- O canvas é criado em **1080×1920** mesmo no preview de 390 px. O código tem
  `AdaptiveResolution` e `beginExport`, mas não foi possível confirmar no deploy
  que a escala cai de forma consistente; a medição inicial mostra resolução
  cheia. O custo de rasterização é o dobro/triplo do necessário em mobile.
- O engine roda um loop contínuo de `requestAnimationFrame`, com Three.js,
  pós-processamento (grão, vinheta, aberração, scan/glitch), partículas e
  texturas. É o maior custo da página.
- `handleVisibility` para o RAF quando a aba fica oculta; isso economiza
  bateria, mas é também a causa provável de gravações vazias em automação/aba
  oculta.
- Não há benchmark de FPS confiável: o Chrome headless usa SwiftShader (CPU),
  que não representa a GPU do usuário. Não foi possível medir 30/60 fps reais.
- O bundle de 798 kB (219 kB gzip) é aceitável para uma ferramenta criativa,
  mas o app não faz code-splitting visível; todos os painéis e o engine entram
  no primeiro load.
- 70 MB de heap é alto, mas não absurdo para Three.js + áudio decodificado;
  precisa de medição com arquivos longos e várias trocas de capa/áudio.

### Recomendações de performance

1. Garantir preview em escala adaptativa (ex.: 540×960 em mobile) e só subir
   para 1080 no `beginExport`.
2. Medir FPS/GPU em hardware real e definir orçamento (ex.: 30 fps estável em
   iPhone 12 / Android médio).
3. Pausar o loop quando não houver áudio **e** quando a cena estiver fora da
   viewport (IntersectionObserver), não só com a aba oculta.
4. Code-split de painéis avançados (Storyboard e futuros Retention/Batch) e carregar
   Three.js depois do primeiro paint, se a métrica justificar.
5. Adicionar um teste de orçamento de bundle no CI.

## Privacidade

### O que foi observado

- O áudio e a capa são lidos via `File`/`blob:` e processados no navegador.
  Nenhum upload de mídia foi visto.
- Requests externos: `fonts.googleapis.com`, `fonts.gstatic.com` e assets do
  próprio domínio Vercel. Nenhum analytics, pixel ou endpoint de terceiros.
- O app não tem login, banco ou armazenamento remoto na produção.
- A gravação fica em Blob local e o download é local.
- Não há persistência: recarregar perde o projeto (privacidade alta, utilidade
  baixa).

### A afirmação “nada sai do seu navegador”

Ela é **parcialmente precisa**: mídia não sai, mas o carregamento de fontes do
Google envia IP, user-agent e referrer ao Google, e o site é servido pelo
Vercel (logs de acesso). Para uma promessa absoluta, seria necessário
self-host das fontes e uma política de privacidade explícita. Recomenda-se
trocar por “Seu áudio e sua capa não saem do navegador” — que é verdadeiro — ou
self-hostar as fontes.

### Outros pontos

- Sem CSP observada no HTML; para um app que manipula arquivos locais, uma CSP
  restritiva reduziria risco de injeção via metadados (embora o app não
  renderize HTML do usuário).
- O nome do arquivo de áudio/capa aparece na UI; não é sanitizado para HTML,
  mas o React escapa por padrão. Sem achado de XSS.
- A gravação pode conter a capa e o áudio do usuário; o arquivo é local, mas
  deve haver aviso de que ele será baixado e pode ir para redes sociais.

## Conclusão

Acessibilidade é o eixo mais fraco: contraste do CTA, 62 paradas de tab, texto
minúsculo, canvas sem nome, nenhum anúncio de status e movimento não pausável.
Performance não foi medida em GPU real, mas o preview em resolução cheia e o
loop contínuo são riscos concretos. Privacidade é boa para a mídia; a frase
absoluta precisa ser ajustada ou as fontes precisam ser locais.
