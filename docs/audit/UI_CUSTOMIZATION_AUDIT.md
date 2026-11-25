# Auditoria de customização pela UI — DRAZYX

Data: 2026-11-25
Requisito: o usuário deve editar **100% pela interface**, sem alterar código.
Um template é ponto de partida, não composição bloqueada.

## Veredito direto

**O requisito não é atendido.** Hoje o usuário edita apenas:

- cinco textos globais (artista, faixa, álbum, CTA, tagline);
- visibilidade desses cinco textos;
- escala e tracking globais;
- paleta (extraída ou manual);
- seis sliders visuais + glitch + perfil de movimento;
- layout/estilo, formato e trecho.

Não é possível selecionar a capa, movê-la, redimensioná-la, girá-la, alterar
sua camada, escolher fonte por texto, adicionar/remover elementos, alterar
animação por elemento ou salvar uma composição como preset. Posições, tamanhos,
z-order e fontes são fixos no código de cada template.

**Nota de customização: 1/5.** A UI parece um painel de parâmetros globais, não
um editor visual.

## O que está hardcoded

| Propriedade | Estado | Evidência |
|---|---|---|
| Posição da capa | Fixa por template (`position.set`) | `layout01.ts` … `layout08.ts`, `mirage.ts` |
| Tamanho da capa | `viewW * 0.42`, `0.62`, etc. | mesmos arquivos |
| Rotação | Fixa (0 ou leve) | templates |
| Camadas/z-order | Ordem de desenho no código | `renderOrder`, sequência de draw |
| Tipografia | Fonte/tamanho/peso fixos; só escala/tracking globais | `stage.module.css`, canvas text |
| Texto por elemento | Só strings globais; cena tem um `text` | `project.types.ts` |
| Cores | Paleta global, não por elemento | `VisualSettings` |
| Animação | Por preset de cena, não por elemento | `scene.motion` |
| Visibilidade | Apenas os cinco textos | `TypeSettings.show*` |
| Player | Fixo em T5 | `layout05.ts` |
| Câmera | Um slider global | `VisualSettings.cameraSpeed` |

Não há `elements[]`, `layers[]`, `transform`, `fontFamily`, `keyframes` ou
`elementVisibility`. O estado é uma configuração global + scenes com
template/motion/text.

## Achados

### CUST-01 — Sem seleção e manipulação direta no Stage

- **Categoria:** MISSING CAPABILITY. **Severidade:** P0.
- **Feature:** Stage / edição.
- **Reprodução:** clicar/arrastar a capa ou qualquer texto no canvas.
- **Esperado:** seleção com contorno, alças de redimensionar/rotacionar,
  arraste com snap e inspector contextual.
- **Atual:** o canvas não tem hit testing nem overlay; cliques não fazem nada.
- **Evidência:** `hasElementSelectionHint: false`; canvas sem `role`/handler.
- **Impacto:** a edição criativa mais básica é impossível; o usuário depende do
  desenvolvedor.
- **Correção:** overlay DOM de seleção sobre o canvas + hit testing; ver
  arquitetura abaixo.
- **Complexidade:** L. **Confiança:** alta.

### CUST-02 — Sem inspetor de elemento

- **Categoria:** MISSING CAPABILITY. **Severidade:** P1.
- **Atual:** não existe painel que mostre propriedades do objeto selecionado;
  os painéis são globais.
- **Esperado:** inspetor com Posição, Dimensões, Aparência, Tipografia,
  Camadas e Movimento, apenas para propriedades aplicáveis.
- **Impacto:** mesmo que houvesse seleção, não haveria onde editar.
- **Correção:** inspector contextual com divulgação progressiva.
- **Complexidade:** M/L. **Confiança:** alta.

### CUST-03 — Sem biblioteca de elementos

- **Categoria:** MISSING CAPABILITY. **Severidade:** P1.
- **Atual:** os elementos são desenhados pelo template; não há “adicionar
  texto”, “adicionar waveform”, “adicionar player”, “duplicar capa” etc.
- **Esperado:** biblioteca com cover, texto, artista, título, álbum, CTA,
  waveform, spectrum, circular spectrum, partículas, moldura, fundo, player,
  progresso, imagem local.
- **Impacto:** o usuário não compõe; escolhe um layout pronto.
- **Correção:** catálogo de elementos + `addElement(type)` com defaults.
- **Complexidade:** L. **Confiança:** alta.

### CUST-04 — Sem presets customizados

- **Categoria:** MISSING CAPABILITY. **Severidade:** P2.
- **Atual:** “Projetos” salva a configuração global, mas não existe salvar
  composição/estilo/movimento como preset reutilizável, nem exportar/importar
  apenas a composição. O template original não é sobrescrito (bom), mas também
  não há custom para salvar.
- **Esperado:** “Salvar como preset”, “Duplicar template”, “Restaurar padrão”,
  export/import JSON com versão; aplicar a outra faixa.
- **Impacto:** o trabalho criativo não é reutilizável.
- **Correção:** serializar `SceneComposition`/`VisualPreset` com schema
  versionado.
- **Complexidade:** M. **Confiança:** alta.

### CUST-05 — Sem edição de camadas

- **Categoria:** MISSING CAPABILITY. **Severidade:** P1.
- **Atual:** ordem de desenho fixa; não há frente/trás, visibilidade por
  elemento, bloqueio.
- **Esperado:** lista de camadas, arrastar para reordenar, olho/cadeado,
  “trazer para frente”, “enviar para trás”.
- **Impacto:** não é possível resolver sobreposições nem criar composições
  próprias.
- **Correção:** `zIndex`/ordem no modelo + painel de camadas.
- **Complexidade:** M. **Confiança:** alta.

### CUST-06 — Tipografia não é por elemento

- **Categoria:** MISSING CAPABILITY. **Severidade:** P1.
- **Atual:** fonte única do sistema, tamanho definido no template, escala e
  tracking globais; sem peso, alinhamento, linha, cor, caixa ou wrap por
  elemento.
- **Esperado:** seletor de fonte (apenas fontes licenciadas/disponíveis),
  tamanho, peso, tracking, alinhamento, entrelinha, cor, opacidade, wrap.
- **Impacto:** o usuário não consegue adaptar a tipografia à capa/faixa.
- **Correção:** `TypographyStyle` por elemento e inspetor.
- **Complexidade:** M. **Confiança:** alta.

### CUST-07 — Animação não é por elemento

- **Categoria:** MISSING CAPABILITY. **Severidade:** P2.
- **Atual:** movimento é um preset de cena aplicado ao template; não há
  animação de posição/escala/rotação/opacidade por elemento, easing ou
  keyframes.
- **Esperado:** presets de entrada/saída/loop, velocidade, easing, intensidade
  audio-reativa, keyframes opcionais.
- **Impacto:** composições ficam estáticas ou uniformes; não há direção de
  movimento.
- **Correção:** `ElementMotion` + timeline de keyframes em fase 2.
- **Complexidade:** L. **Confiança:** alta.

### CUST-08 — Sem “o que aparece nesta cena”

- **Categoria:** UX / ARCHITECTURAL. **Severidade:** P2.
- **Atual:** cena tem `text` e `showText`, mas metadados globais continuam
  visíveis; o usuário não vê uma lista de elementos da cena.
- **Esperado:** árvore de elementos por cena, com visibilidade e edição.
- **Correção:** cena contém `elements[]` (ou referências a um layout base +
  overrides); inspector mostra a árvore.
- **Complexidade:** M (depende do modelo).
- **Confiança:** alta.

## Arquitetura mínima proposta

Não introduzir um framework de edição completo. Introduzir um **modelo de
elementos** e um **overlay de seleção**; reutilizar o renderer atual.

### Modelo

```ts
type ElementType =
  | 'cover' | 'text' | 'waveform' | 'spectrum' | 'circularSpectrum'
  | 'particles' | 'frame' | 'background' | 'player' | 'image';

interface VisualElement {
  id: string;
  type: ElementType;
  name: string;
  transform: {
    x: number; y: number;        // 0–1 relativo à safe area
    width: number; height: number;
    rotation: number;            // graus
    anchor: 'center' | 'top-left' | ...;
    scale: number;
  };
  style: {
    color?: string;
    opacity: number;
    glow?: number;
    blur?: number;
    border?: BorderStyle;
    background?: string;
    shadow?: ShadowStyle;
  };
  typography?: TypographyStyle;  // só type === 'text'
  layer: number;
  visible: boolean;
  locked: boolean;
  motion?: ElementMotion;
  audioReactive?: { band: 'bass'|'mid'|'treble'|'rms'; amount: number };
}

interface SceneComposition {
  schemaVersion: 1;
  templateId: string;           // proveniência, não bloqueio
  aspect: '9:16' | '1:1' | '16:9';
  background: BackgroundStyle;
  camera: CameraConfig;
  elements: VisualElement[];
}
```

- Templates passam a **produzir** `SceneComposition` padrão (factory), em vez
  de desenhar posições diretamente. O renderer ganha um caminho de elementos.
- O estilo global (`VisualSettings`) continua como “look” da cena; elementos
  referenciam ou sobrescrevem propriedades.
- Compatibilidade: projetos antigos ganham composição derivada do template;
  migração por `schemaVersion`.

### Seleção e manipulação

- Overlay HTML absoluto sobre o canvas (não desenhar alças no canvas, para não
  entrar na gravação).
- Hit testing por `elements` (retângulo rotacionado) ou por picking no engine;
  o overlay converte coordenadas de render para CSS.
- Arraste move; 8 alças redimensionam (Shift mantém proporção); alça de
  rotação; snap em guias (centro, margens, alinhamento com outros elementos).
- Teclado: setas movem 1 px, Shift 10 px; Delete remove; Ctrl+D duplica;
  `[`/`]` mudam camada.
- Inspector sincroniza com a seleção; alterações atualizam o canvas em tempo
  real e são persistidas no projeto.

### Painéis

1. **Cena** (template, movimento, fundo).
2. **Camadas** (lista, olho, cadeado, ordem).
3. **Inspetor** (posição, tamanho, aparência, tipografia, movimento).
4. **Adicionar** (biblioteca de elementos).
5. **Estilo visual** (os seis sliders atuais, com descrições).

Divulgação progressiva: “Avançado” para keyframes, blend, máscara etc. Não
colocar 50 sliders no painel principal.

### Presets

- “Salvar composição como preset” → `{schemaVersion, name, composition}` no
  IndexedDB.
- “Aplicar preset” a outra cena/faixa; “Restaurar padrão do template”.
- Export/import JSON (mesmo formato dos projetos, com validação).
- Nunca sobrescrever o preset original; custom é uma cópia.

### Menor mudança possível

1. Adicionar `elements[]` ao tipo de cena e uma factory para cada template.
2. Renderizar elementos de texto e capa via modelo (os demais podem continuar
   no template).
3. Overlay de seleção + inspetor para `transform`, `style`, `typography`,
   `layer`, `visible`.
4. Persistir e duplicar.
5. Só depois: biblioteca completa, animação por elemento e keyframes.

Isso já permite o teste de aceitação (mover capa, redimensionar, adicionar
texto, mudar fonte/cor, camada, waveform, animação, salvar/recarregar) sem
reescrever todo o engine de uma vez.

## Teste de aceitação (Test D)

Partindo de T3:

1. Selecionar a capa → **hoje impossível**.
2. Mover para outra posição → impossível.
3. Redimensionar → impossível.
4. Adicionar texto → impossível.
5. Mudar fonte/cor → só global, não por elemento.
6. Mover para frente/trás → impossível.
7. Adicionar waveform → impossível.
8. Posicionar waveform → impossível.
9. Configurar animação → só preset de cena.
10. Salvar preset → impossível.
11. Recarregar preset → impossível.
12. Resultado renderizado igual ao salvo → não aplicável.

**Conclusão do teste: falha em 10 de 12 etapas.** O requisito “100% pela UI”
não é atendido.

## Riscos e cuidados

- **Performance:** overlay/hit testing não pode rodar a 60 fps no React;
  usar refs/RAF e limitar re-render.
- **Fonte:** usar apenas fontes já licenciadas/empacotadas; não buscar Google
  Fonts em runtime (privacidade e offline).
- **Texto no canvas:** medir quebra de linha, clipping e contraste; não confiar
  em CSS para o texto exportado.
- **Serialização:** schema versionado, validação e migração; nunca importar
  JSON arbitrário sem validar.
- **Gravação:** alças/overlay não podem ser capturados; só o canvas.
- **Responsividade:** inspetor em drawer no mobile; não cobrir o Stage.
- **Acessibilidade:** seleção por teclado, lista de camadas focável, anúncios.

## Acceptance criteria

- [ ] Selecionar capa/texto/elemento no Stage com foco visível.
- [ ] Mover, redimensionar, rotacionar e alinhar com snap.
- [ ] Adicionar, duplicar, ocultar, bloquear e remover elementos.
- [ ] Reordenar camadas e resolver sobreposição.
- [ ] Editar tipografia por elemento.
- [ ] Editar animação/movimento por elemento.
- [ ] Salvar, recarregar, exportar e importar preset customizado.
- [ ] Resultado salvo reproduz idêntico após reload.
- [ ] Nenhuma propriedade importante depende de edição de código.
- [ ] Overlay não aparece na gravação.
- [ ] Teste automatizado de serialização/migração e manual de composição.

## Conclusão

O produto precisa de uma **camada de composição**, não de mais sliders. A
menor implementação útil é: elementos + overlay de seleção + inspetor +
persistência. Isso transforma templates em pontos de partida e cumpre o
requisito central; sem isso, “100% pela UI” é falso.
