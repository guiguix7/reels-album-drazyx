# Auditoria dos controles visuais — DRAZYX

Data: 2026-11-25
Objeto: painel “VISUAL” do build atual (também presente, com menos recursos, no
deploy).

## Estado atual

Seis sliders e três escolhas:

| Controle | Rótulo atual | Valor padrão | O que realmente faz | Descrição na UI |
|---|---|---:|---|---|
| Intensidade | `INTENSIDADE` | 72% | Multiplica a reação ao áudio (bandas/RMS) na cena. | **Nenhuma** |
| Partículas | `PARTÍCULAS` | 60% | Densidade/opacidade das partículas do preset. | **Nenhuma** |
| Força do grave | `FORÇA DO GRAVE` | 65% | Peso do bass no movimento/pulso. | **Nenhuma** |
| Brilho | `BRILHO` | 55% | Intensidade de glow/halo e luz atmosférica. | **Nenhuma** |
| Grão | `GRÃO` | 35% | Intensidade do noise/grain fílmico. | **Nenhuma** |
| Câmera | `CÂMERA` | 45% | Velocidade/amplitude da deriva de câmera. | **Nenhuma** |
| Glitch | `OFF / SUTIL / FORTE` | OFF | Frequência/intensidade de deslocamento digital. | **Nenhuma** |
| Movimento | `DREAM / PULSE / ...` | Dream | Perfil de movimento; este **tem** descrição. | Sim |
| Loop visual | checkbox | off | Reinicia a cena no início do trecho. | Parcial |

Evidência: `local-visual-panel.jpg`,
`current-build-report.json` (`hasPerControlDescription: false`), snapshot do
painel com seis sliders sem `aria-describedby` nem helper.

## Achados

### VIS-01 — Nenhuma descrição por ajuste

- **Categoria:** UX / UI. **Severidade:** P1.
- **Reprodução:** abrir “VISUAL”.
- **Esperado:** uma frase curta por controle, sempre visível ou em tooltip,
  explicando o efeito e a direção do valor.
- **Atual:** só o nome e a porcentagem. O usuário precisa experimentar para
  descobrir; “Brilho” pode ser cor, exposição ou glow; “Câmera” pode ser
  velocidade, zoom ou ângulo.
- **Impacto:** o painel expõe implementação, não criatividade; aumenta tentativa
  e erro e desencoraja ajustes.
- **Correção:** helper de 1 linha por controle (abaixo), `aria-describedby`,
  tooltip no hover/focus e exemplo visual imediato.
- **Complexidade:** S. **Confiança:** alta.

### VIS-02 — Rótulos ambíguos e sem agrupamento

- **Categoria:** UX. **Severidade:** P2.
- **Atual:** lista plana de seis sliders + glitch + movimento + loop; sem
  grupos por finalidade. “Intensidade” e “Força do grave” se sobrepõem
  conceitualmente; “Brilho” não diz se é luz ou cor; “Câmera” não é uma
  grandeza.
- **Esperado:** grupos claros, vocabulário consistente e valores com unidade
  (“×”, “%”, “s”).
- **Correção:** agrupar em **Movimento**, **Luz e textura**, **Reação ao
  áudio**, **Efeitos**; renomear “Câmera” para “Velocidade da câmera” e
  “Brilho” para “Glow”.
- **Complexidade:** S. **Confiança:** alta.

### VIS-03 — Sem feedback de valor e sem reset por controle

- **Categoria:** UX / UI. **Severidade:** P2.
- **Atual:** “REDEFINIR” restaura todos; não há duplo-clique, nem valor padrão
  visível, nem indicação de “alterado”. O usuário perde a referência do preset.
- **Esperado:** marcador de modificado, reset individual, valor padrão no
  tooltip e atualização imediata no Stage.
- **Correção:** `defaultValue`, `isDirty`, botão “voltar ao padrão” por linha.
- **Complexidade:** S. **Confiança:** alta.

### VIS-04 — Sliders não escalam para a customização proposta

- **Categoria:** ARCHITECTURAL LIMITATION. **Severidade:** P1 (frente ao
  requisito de 100% pela UI).
- **Atual:** os parâmetros são globais e fixos; não há como escolher um
  elemento, uma camada ou uma cena e ver propriedades contextuais. Adicionar
  posição/tamanho/fonte como mais seis sliders globais não resolve.
- **Esperado:** inspector contextual por elemento selecionado, com grupos
  posição/tamanho/aparência/tipografia/camada/movimento.
- **Correção:** depender do modelo de elementos (`UI_CUSTOMIZATION_AUDIT.md`);
  o painel Visual global permanece apenas para estilo da cena.
- **Complexidade:** L. **Confiança:** alta.

### VIS-05 — Acessibilidade e precisão

- **Categoria:** ACCESSIBILITY. **Severidade:** P3.
- **Atual:** inputs `range` sem `aria-valuetext` além do número; alterações não
  são anunciadas; alvos pequenos; contraste do texto auxiliar baixo.
- **Correção:** `aria-valuetext="60%, médio"`, live region discreta, foco
  visível, alvos ≥44 px.
- **Complexidade:** S. **Confiança:** alta.

## Microcopy proposta

Descrições curtas, verificadas contra a implementação:

- **Intensidade** — “Quanto a cena reage ao áudio. Valores altos deixam o
  movimento mais forte; baixos, mais contido.”
- **Partículas** — “Quantidade de partículas visíveis. Reduza para uma imagem
  mais limpa.”
- **Força do grave** — “Quanto os graves empurram o movimento e o pulso.”
- **Glow** — “Intensidade da luz e do halo ao redor da capa.”
- **Grão** — “Textura de filme e ruído sutil sobre a imagem.”
- **Velocidade da câmera** — “Ritmo da deriva/zoom da câmera. Baixo para um
  plano quase estático.”
- **Glitch** — “Intensidade de distorção digital. Desligado para uma imagem
  limpa.”
- **Movimento** — “Personalidade do movimento: Dream, Pulse, Cinematic,
  Fragment, Organic, Intense ou Minimal.” (já existe)

Cada descrição deve aparecer como helper de uma linha, não como parágrafo. O
tooltip pode trazer uma segunda frase e um exemplo.

## Agrupamento recomendado

```
MOVIMENTO
  Movimento (perfil)   [descrição]
  Velocidade da câmera [descrição]

REAÇÃO AO ÁUDIO
  Intensidade          [descrição]
  Força do grave       [descrição]

LUZ E TEXTURA
  Glow                 [descrição]
  Grão                 [descrição]
  Partículas           [descrição]

EFEITOS
  Glitch               [descrição]
```

Quatro grupos são suficientes; não criar um grupo por slider. “Loop visual”
fica em “Tempo/Storyboard”, não em Visual.

## Comportamento esperado

- Arrastar atualiza o Stage em tempo real (já ocorre).
- Valores mostram unidade e padrão; “alterado” é visível.
- Reset individual e global.
- Teclado: setas ±1, Shift ±10, Home/End.
- Presets de movimento alteram apenas parâmetros de movimento, não a paleta.
- Mudanças sobrevivem a trocar de template? Definir: por template ou globais.
  Recomendação: parâmetros visuais pertencem ao **preset de cena** e são
  restaurados ao trocar de template, com opção “manter ajustes”.

## Conclusão

O painel não é ruim por ter seis sliders; é ruim por **não dizer o que eles
fazem** e por ser a única forma de customização. A correção de curto prazo é
microcopy + agrupamento + reset. A de médio prazo é mover a customização para
um inspector de elemento, mantendo estes sliders como “estilo da cena”.
