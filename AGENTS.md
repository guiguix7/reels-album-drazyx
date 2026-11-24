AGENTS.md — DRAZYX VISUALIZER STUDIO
Este arquivo define como agentes de IA devem trabalhar neste repositório. Leia-o antes de editar qualquer arquivo. A especificação de produto e os critérios visuais/técnicos completos estão em PROMPT.md.
1. Objetivo e fonte da verdade
- Produto: estúdio web local-first para criar visualizers musicais e gravar vídeos curtos com áudio sincronizado.
- Primeiro preset: Drazyx — “Wake Up (Slowed + Reverb)”, álbum “My Mirage (Wake Up Remixes)”.
- PROMPT.md é a especificação principal. Em caso de conflito entre uma ideia improvisada e a especificação, siga a especificação ou registre explicitamente a decisão técnica.
- O resultado não pode ser apenas um protótipo visual. O fluxo real de áudio e gravação é obrigatório.
- Não invente assets, letras, arquivos de áudio, testes executados ou suporte de navegador.
2. Regras operacionais obrigatórias
1. Inspecione o repositório antes de modificar arquivos. Não presuma que está vazio.
2. Leia PROMPT.md, este arquivo e o README.md existente (se houver).
3. Antes de instalar uma dependência, verifique se ela é necessária e se já existe alternativa no projeto.
4. Não substitua configurações existentes sem entender por que estão ali.
5. Não faça refatorações amplas sem necessidade para a tarefa atual.
6. Não crie arquivos vazios ou componentes sem uso para aparentar progresso.
7. Não deixe TODOs em funcionalidades que o usuário espera no MVP, especialmente áudio e gravação.
8. Não declare que algo funciona sem executar ou testar o fluxo correspondente.
9. Ao terminar uma tarefa, informe o que mudou e os comandos/testes que realmente foram executados.
10. Se uma limitação do ambiente bloquear uma parte, implemente o melhor fallback possível e documente a limitação com precisão.
3. Equipe de agentes e responsabilidades
O agente coordenador divide o trabalho em subtarefas pequenas e integra as mudanças. Não permita que dois agentes editem simultaneamente os mesmos arquivos sem coordenação.
Agent: Orchestrator / Tech Lead
Responsável por: arquitetura, decomposição, contratos entre módulos, integração e decisões técnicas.

Deve:
- Mapear estrutura atual, scripts e dependências.
- Definir interfaces/types antes de paralelizar áudio, visual e recorder.
- Manter o app executável entre fases.
- Evitar duplicação de estado e dependências.
- Revisar integração e critérios de aceitação.
Não deve:
- Implementar sozinho todos os subsistemas antes de definir contratos.
- Aceitar um componente visual que não esteja conectado ao estado real.
Agent: Product Designer / UI Engineer
Responsável por: layout do editor, painéis, design tokens, responsividade, estados vazios, feedback e microinterações.

Arquivos preferenciais:
- src/components/**
- src/styles/**
- src/app/app.css
Deve:
- Seguir a identidade Drazyx: #070810, #11101A, #18131D, #F2EDF5, #A99EAE, #B84DFF.
- Priorizar o Stage e manter a interface do editor visualmente secundária.
- Garantir estados de foco, contraste, responsividade e feedback.
- Não estilizar o Stage com elementos HTML que não serão incluídos na gravação.
Não deve:
- Criar uma UI de dashboard genérica.
- Colocar painéis, botões ou cursor dentro da área capturada.
- Inventar controles que não estejam ligados a estado/comportamento real.
Agent: Creative Developer / Visual Engine
Responsável por: Three.js, cena MIRAGE, presets, shaders, partículas, câmera, tipografia capturada e performance do Stage.

Arquivos preferenciais:
- src/features/visualizer/**
- src/components/stage/** (caso exista)
Deve:
- Renderizar tudo que pertence ao vídeo em um canvas dedicado.
- Implementar pelo menos os presets MIRAGE, AFTERIMAGE, VOID e SPECTRUM.
- Expor parâmetros por tipos/props claros.
- Receber os dados normalizados do Audio Engine, sem criar outro sistema de análise.
- Usar delta time, reutilizar buffers e liberar geometria/material/texturas.
- Proteger performance em 9:16 e resolução de exportação.
Não deve:
- Criar objetos/arrays/materiais pesados em cada frame.
- Conectar diretamente a elementos de UI.
- Simular reação musical com números aleatórios quando há áudio real disponível.
Agent: Web Audio Engineer
Responsável por: upload/decodificação, playback, timeline, Web Audio API, FFT, bandas, RMS e sincronização temporal.

Arquivos preferenciais:
- src/features/audio/**
- src/lib/file-validation.ts
Deve:
- Criar uma única cadeia de áudio reutilizável.
- Criar MediaElementAudioSourceNode uma única vez por elemento de áudio.
- Tratar AudioContext suspenso/autoplay policy.
- Normalizar e suavizar bass/mid/treble/RMS/transientes para consumo do Visual Engine.
- Revogar Object URLs e liberar recursos.
- Expor estado consistente de loading/ready/playing/paused/error.
Não deve:
- Fazer upload da música para APIs.
- Usar timer independente como fonte de verdade para o tempo da música.
- Fazer o visualizador depender de volume de saída do sistema operacional.
Agent: Recording / Export Engineer
Responsável por: MediaRecorder, captura do canvas, captura de áudio, sincronização, codecs, preview e download.

Arquivos preferenciais:
- src/features/recording/**
- src/lib/browser-capabilities.ts
Deve:
- Combinar a stream de vídeo do canvas com a stream de áudio do MediaStreamAudioDestinationNode.
- Detectar suporte real de codecs com MediaRecorder.isTypeSupported().
- Manter o áudio audível durante a gravação.
- Iniciar/encerrar gravação com base na timeline real do áudio.
- Parar tracks e liberar URLs após o uso.
- Mostrar formato e limitações reais ao usuário.
- Garantir que somente o Stage seja capturado.
Não deve:
- Fingir exportação com um Blob vazio ou arquivo sem áudio.
- Assumir suporte universal a MP4.
- Capturar a tela inteira quando a intenção é gravar apenas o Stage, exceto se o usuário escolher explicitamente um modo alternativo.
Agent: QA / Test Engineer
Responsável por: testes, cenários negativos, reprodução de bugs, validação de build e verificação do arquivo exportado.

Deve:
- Testar upload, playback, seek, substituir arquivo, selecionar trecho, gravar, parar e baixar.
- Verificar áudio e vídeo no arquivo gerado, não apenas a presença do Blob.
- Testar navegador sem codec preferido, arquivo inválido, áudio curto e troca de resolução.
- Verificar memory leaks básicos, console errors e responsividade.
- Registrar comandos e resultados reais.
Não deve:
- Marcar testes como aprovados sem executar.
- Ignorar erros de autoplay, CORS, WebGL ou MediaRecorder.
4. Contratos entre subsistemas
Defina os tipos/interfaces compartilhados antes da implementação paralela. Nomes podem variar, mas os contratos precisam preservar estas responsabilidades.
Project Config
Deve centralizar, no mínimo:
- artistName
- trackTitle
- albumTitle
- ctaText
- coverImage
- audioFile
- clipStart
- clipEnd
- aspectRatio
- outputWidth
- outputHeight
- fps
- visualPreset
- visualSettings
Audio Engine Output
Deve fornecer estado e dados normalizados, por exemplo:
- status: idle/loading/ready/playing/paused/error
- currentTime
- duration
- frequencyData ou resumo de bandas
- waveformData (quando necessário)
- bass: 0–1
- mid: 0–1
- treble: 0–1
- rms: 0–1
- transient: valor/flag suavizado
- referências necessárias para playback/recording stream, sem expor detalhes internos desnecessários
Visual Engine Input
Deve receber:
- Configuração do projeto/preset.
- Dimensões da saída.
- Dados normalizados do áudio.
- Tempo atual da faixa.
- Estado de reprodução.
Deve expor:
- Canvas do Stage.
- Método de resize/resolution.
- Método de dispose/cleanup.
- Estado de prontidão e erro.
Recorder Input
Deve receber:
- Canvas do Stage.
- Audio MediaStreamTrack ou stream originado de MediaStreamAudioDestinationNode.
- FPS e trecho solicitado.
- Callbacks de progresso, estado, erro e conclusão.
Deve retornar:
- Blob válido.
- MIME type real.
- Extensão correta.
- Metadados de duração/resolução quando disponíveis.
5. Limites de propriedade de arquivos
Para evitar conflitos:
- UI Agent não altera AudioEngine.ts, Recorder.ts ou shaders sem coordenação.
- Audio Agent não altera layout visual nem componentes de painel, salvo contrato de integração aprovado.
- Visual Agent não implementa playback nem export.
- Recording Agent não altera o pipeline de análise FFT, apenas consome seu stream/track.
- Orchestrator é responsável por arquivos de configuração compartilhada e integrações.
- Se a estrutura existente for diferente, o Tech Lead documenta a nova propriedade antes de dividir as tarefas.
6. Convenções de código
- TypeScript estrito. Evitar any; quando inevitável, justificar e isolar.
- Preferir componentes pequenos e funções puras para lógica testável.
- Separar UI, domínio, áudio, visualização e gravação.
- Nomes de variáveis e funções em inglês; textos da interface em português ou inglês conforme a direção visual do produto, mas manter consistência. O preset inicial pode usar metadados em inglês por ser identidade de artista.
- Comentários explicam decisões não óbvias, não descrevem literalmente cada linha.
- Tratar erros e estados assíncronos explicitamente.
- Limpar listeners, RAFs, timers, tracks, Object URLs, AudioNodes e recursos Three.js.
- Não adicionar bibliotecas para tarefas triviais.
- Não fixar versões antigas por conveniência; resolver versões compatíveis e registrar no lockfile.
7. Qualidade visual
Antes de aceitar a interface:
- Verificar hierarquia, espaçamento, alinhamento e contraste.
- Verificar o Stage em 9:16, não apenas em viewport desktop.
- Conferir safe zones de texto para Reels/Shorts/TikTok.
- Garantir que o vídeo continua interessante sem movimento agressivo.
- Garantir que o título e o nome Drazyx ficam legíveis no final.
- Evitar gradientes aleatórios, excesso de glow, partículas demais e componentes genéricos.
- Não usar emojis na interface final.
8. Regras de áudio e gravação
- Não alterar a velocidade/pitch original da faixa, a menos que uma opção explícita seja criada e testada.
- Não inventar beat markers; analisar o áudio carregado.
- Preferir dados FFT suavizados para movimento orgânico.
- AudioContext precisa ser iniciado/resumido por ação do usuário.
- Nunca criar várias MediaElementAudioSourceNode para o mesmo media element.
- O áudio gravado precisa vir da stream de áudio do Web Audio API.
- A saída de vídeo precisa vir do canvas do Stage.
- Testar codecs por feature detection; nunca assumir video/mp4.
- Parar e limpar todas as tracks ao finalizar/cancelar.
- O tempo da faixa é a fonte de verdade da timeline e do stop automático.
9. Fluxo de trabalho recomendado
1. Inspect: listar arquivos, ler package.json, identificar scripts e estado atual.
2. Plan: dividir o trabalho em pequenas tarefas e identificar dependências entre agentes.
3. Contract: definir types/interfaces compartilhadas.
4. Implement: construir uma fatia funcional de cada vez.
5. Integrate: integrar após cada subsistema, sem esperar o projeto inteiro.
6. Validate: rodar lint/typecheck/test/build existentes ou adicionar os mínimos necessários.
7. Manual QA: executar o fluxo no navegador e testar uma gravação real.
8. Report: resumir alterações, testes e limitações.
Ordem sugerida de implementação
1. Estrutura e editor visual.
2. Stage estático em 9:16.
3. Upload e playback de áudio.
4. Analyser e dados normalizados.
5. Preset MIRAGE conectado ao áudio.
6. Presets adicionais.
7. Recorder de canvas + áudio.
8. Seleção de trecho de 30 s e export/download.
9. QA, documentação e polimento.
10. Comandos e validação
Use os scripts definidos no package.json. Se não existirem, adicione apenas os necessários, normalmente:
- npm run dev
- npm run lint
- npm run typecheck
- npm run test
- npm run build
Não afirme que um comando passou sem executá-lo. Se uma ferramenta não estiver instalada ou o ambiente não permitir teste de navegador, diga isso diretamente e forneça os passos manuais que faltaram.
11. Segurança e privacidade
- Não enviar arquivos de áudio/imagem para serviços externos.
- Não adicionar analytics, pixels ou trackers no MVP.
- Não armazenar arquivos do usuário em backend.
- Não incluir tokens ou credenciais em código cliente.
- Validar e tratar arquivos como dados não confiáveis.
- Não usar eval, new Function ou execução dinâmica de conteúdo carregado.
12. Definição de pronto
Uma tarefa só está pronta quando:
- O comportamento funciona no fluxo real, não apenas em mockup.
- Os estados de loading, sucesso e erro foram considerados.
- Os recursos são limpos corretamente.
- Typecheck/build e testes relevantes foram executados.
- A integração com os demais subsistemas não foi quebrada.
- A documentação/reflexão de limitações foi atualizada quando necessário.
Prioridade absoluta do produto: carregar áudio → visualizar → selecionar 30 s → gravar Stage + áudio → baixar arquivo válido. Polimento visual é obrigatório, mas não substitui esse fluxo.