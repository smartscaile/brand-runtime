# Engenharia de interface portátil

Esta base transforma experiência de implementação em contratos reutilizáveis de UI, UX e motion. É identidade-neutra e funciona sem histórico de conversa ou acesso ao projeto de origem. Não promete excelência automática: entrega uma base concreta, verificável e evolutiva para reduzir reconstruções e refinamentos evitáveis.

## Autoridade e carregamento

Aplique `design-foundation.md` primeiro. O Pack fornece identidade e restrições explícitas; o projeto escolhe anatomia, densidade, estados, dimensões e aplicação dos defaults. Este documento governa engenharia e critérios de revisão, não escolhe cores, fontes, tema ou estilo de cliente.

`context.designMethod` entrega este texto e o índice `patternCatalog`, filtrado pela superfície, com paths relativos ao plugin e SHA-256. Leia em `interface-patterns.json` somente as receitas pertinentes antes de implementar. Elas são contratos de função, não templates de aparência ou componentes visualmente aprovados. `interfaceMechanics` aponta para código original opcional em `../assets/interface/scene-runtime.mjs`. Leia sua API e integre somente os mecanismos necessários quando o titular ou uma permissão separada autorizar o uso. Esta evolução preserva o licenciamento existente e não concede licença pública nova, MIT ou outra. Terceiros não devem interpretar disponibilidade do arquivo como autorização de cópia ou redistribuição. Não importe arquivos de um cache instalado em produção. Nenhum desses caminhos depende do cwd, de pastas pessoais ou do site que motivou a extração.

Selecionar um Pack da Chakra, por exemplo, não instala Chakra UI, React ou qualquer motor de animação. Resolva as cores, tipografia, assets e regras desse Pack. Se a entrega já usa a biblioteca, reutilize seus controles e estados reais; se pede HTML standalone, use HTML/CSS/JavaScript adequados à entrega. Não finja que uma fixture de testes representa um Pack oficial que não foi validado.

## Começar perto do resultado, não de uma página vazia

1. Identifique a tarefa e a relação dominante: causa, correspondência, comparação, sequência, inspeção, estado ou decisão.
2. Em projeto existente, rastreie rota, branches realmente renderizados, estilos, dados, controladores e fallback. Import de tipo, arquivo sob `prototypes`, componente oculto e componente ativo não são a mesma coisa.
3. Registre o aceite disponível por eixo e contexto. Use `approved-scoped`, `direction-approved`, `implemented-unreviewed`, `rejected` ou `historical` como distinções, não como promoção automática. Publicação não aprova toda a estética. Em divergência, preserve o aceite mais específico comprovado e exponha o restante como pendência.
4. Escolha uma receita por função. Reutilize o componente real quando licenciado, pertinente e aprovado; evolua uma variante quando só o contexto muda; componha outro arranjo quando a relação muda. Não construa outra família apenas porque as listas de conhecimento estão vazias.
5. Faça o contrato curto abaixo, em raciocínio ou no dono local existente. Não crie documentação paralela para cada botão.
6. Resolva primeiro a composição estática no tamanho de uso. Acrescente o gesto causal, confira o ciclo inteiro e só então propague. Preserve os gates da superfície.

### Contrato mínimo de uma peça

- `intent` e `relation`: o que a pessoa entende ou faz e qual relação precisa ver.
- `sourceStatus`: conteúdo observado, dado fornecido, exemplo sintético ou hipótese. Copy e claims têm dono separado do efeito.
- `anatomy`: leitura permanente, elemento principal, detalhe, sinal, confirmação e ação, apenas quando necessários.
- `interactionMode`: leitura estática, interação manual, demonstração automática, entrada única, loop ou scroll. Não transformar abertura ilustrativa em botão clicável nem ferramenta em vídeo.
- `protectedAxes`: conteúdo, geometria, fonte, motor, curva, cadência, dados ou estados já aprovados; declarar o delta autorizado.
- `sizing`: altura ativa, máximo intrínseco entre alternativas baratas, frame de referência com scroll interno, ou escala integral autorizada. Escolher um contrato, não misturá-los por tentativa.
- `motion`: dono do relógio, dependências, viagem, reação, pausa legível, retorno e emenda; `reentry` explicitamente resume ou restart.
- `fallbacks`: sem JavaScript, APIs ausentes, carregamento de fontes, movimento reduzido ao vivo, impressão, tela estreita e cleanup.
- `verification`: estados e viewports a exercer, evidência de pixels, limites do teste e aceite humano necessário.

## Composição e acabamento que sobrevivem à troca de pack

Mantenha o objeto principal reconhecível enquanto detalhes explicam sua função. Use espaço, hierarquia e proximidade para conectar descrição e cena. Reserve o maior envelope aberto sem somar esse espaço de segurança duas vezes ao espaçamento editorial. Compare distância entre elementos pintados, não apenas wrappers. Grids iguais podem produzir vazios desiguais.

Não use a mesma distribuição para mecanismos diferentes. Armazenar, comparar, consultar e distribuir pedem relações visuais distintas. Alternar a coluna ou trocar ícones não resolve redundância. Também não retire todos os containers: eles podem ser o único agrupamento legível. Escolha a superfície pela função, sem transformar glass, dark, brilho, ruído ou borda em sinais universais de qualidade.

Mapeie papéis, não valores: canvas, superfície, tinta, apoio, borda, ação, foco e status; display, título, corpo, rótulo, dado e anotação; margem, distância de seção, inset e gap interno. Cada binding aponta ao Pack ou a uma extensão local declarada. Estado de alerta não herda cor de sucesso ao compartilhar material. Se houver translucidez autorizada, aplique-a à camada de fundo, não à opacidade do texto inteiro, e ofereça material opaco para falta de suporte, transparência reduzida e impressão.

Contenção não pode depender de cortar conteúdo. Confira maior string, idioma, moeda, estado de erro, valor e detalhe abertos. Um componente proporcionalmente menor pode continuar ilegível. Recomponha por prioridade por padrão. Escala integral é opção explícita para preservar uma ilustração, com avaliação da fonte e do toque na escala final, não solução universal de mobile.

## Coreografia causal

O movimento deve explicar uma relação que a composição já torna legível. Preserve scaffold, labels e dados necessários; mova sinal, foco ou confirmação em vez de apagar tudo a cada ciclo. Não faça estados reais mudarem só para dar vida à tela.

Declare o encadeamento antes de escolher milissegundos:

```text
origem pronta → percurso → chegada → reação → detalhe legível
                                            ↓
                                próximo destino dependente
                                            ↓
                         último feedback → hold → retorno → emenda
```

- A confirmação depende da chegada representada, não de um timer independente. Uma ilustração não comprova resposta HTTP, entrega, atribuição ou execução externa. Qualifique respostas simuladas.
- Um tronco comum avança uma vez; ramos começam após a bifurcação. Um join aguarda as dependências necessárias; a cena espera o último receptor e seu feedback antes do hold final.
- Derive viagem de comprimento lógico e velocidade local quando o significado exigir velocidade consistente. Escalar os pixels não muda a topologia nem o clock.
- Separe estado persistente de gesto transitório: sustentar cor não significa congelar escala, traço ou halo no pico. O retorno restaura cada peça na ordem definida e a emenda não deixa glifo pendente ou vazio de leitura.
- Um número e seu arco/barra devem consumir o mesmo progresso, ou o número ler a propriedade interpolada do dono existente. Não criar outro spring/count-up por aproximação. ARIA e fonte de dados permanecem estáveis, sem live announcement por frame.
- Peças independentes podem compartilhar lifecycle sem compartilhar período. Um indicador não precisa esperar a leitura de outra cena. Compare eixos protegidos no mesmo tempo físico, não em frações de ciclos que mudaram de duração.
- Entrada única, loop, manual e scroll são modalidades diferentes. Uma entrada rápida não atende a um loop solicitado; loop de destaque não precisa recontar dados históricos.

### Reúso fiel versus nova implementação

Em um port autorizado com paridade, conservar o motor efetivo e os donos de geometria/timing quando viável. Duração e Bézier iguais em CSS e outro motor não provam o mesmo gesto. Se mudar o motor, registrar aproximação e comparar os intermediários e a volta no render.

Não distribuir um port sem revisar a licença, mesmo quando o componente já é usado legalmente no projeto de origem. Uma licença que permite usar em sites pode restringir redistribuição em kits. Os mecanismos originais deste runtime não incluem True Focus, Specular Button, OptionWheel, DotField ou Decrypted Text, nem seus ports, markup, estilos, glifos ou assets. Essas referências exigem verificação por consumidor. A receita `attention-cue` descreve orientação de leitura, não fornece um clone de efeito restrito.

## Lifecycle e primeiro paint

SSR ou HTML inicial já deve conter uma leitura completa. Aprimoramento não é autorização para esconder o conteúdo enquanto a biblioteca carrega.

- **Antes de iniciar:** conferir APIs, fontes, alvo observado e geometria válida. Hidratado não significa visível. Uma duração zero pode aplicar o DOM em outro frame.
- **Primeiro paint:** uma camada geométrica pode ser mensurável e invisível até a colocação atual terminar; o texto continua nítido. Invalide conclusões antigas em resize, troca de estado, fallback e cleanup.
- **Running:** somente a cena efetivamente visível e ativa trabalha. Observar a peça, não uma seção muito maior. Slides inativos e branches ocultos recebem active=false.
- **Paused:** suspender RAF, timeouts, listeners contínuos e canais CSS/WAAPI/motor envolvidos, conservando fase ou reiniciando conforme `reentry`. Pausar desenho não garante pausar scheduler.
- **Static:** resolver a pose completa e legível, incluindo estados necessários. Não apenas congelar um frame aleatório. Movimento reduzido e sem JavaScript são caminhos diferentes.
- **Retorno e descarte:** preferências podem mudar ao vivo; tratar print, visibilidade, pagehide/pageshow e lifecycle da aplicação. Init repetido não duplica controladores. Callbacks tardios não devem reanimar a peça após dispose.

Não globalizar um workaround de biblioteca. Leia a API instalada antes de adaptar drivers, aridade de callbacks ou timeline. Writes diferenciais evitam trabalho redundante; não comprovam FPS. Separe input lag de scroll interpolado, queda de frames e leitura presa. Não instale suavizador para herdar a aparência de uma referência.

## Geometria e interação

- Meça após fontes e no mesmo sistema de coordenadas. Ao escalar uma cena, converta retângulos pintados para coordenadas lógicas uma vez. Paths base e pulso compartilham a mesma rota.
- Ancore conexões em portas reais, bordas ou primeira linha relevante. Confira a ponta e o último ponto pintados, não apenas o SVG externo. Não dependa só de animationend de um path oculto em outro breakpoint.
- Resize deve agrupar leitura/escrita e ignorar medidas iguais. Um observador que reage à própria altura pode criar loop ou reiniciar o motion aprovado.
- Para alternância de um pequeno conjunto barato, máximo intrínseco pode usar uma célula comum com inativos `visibility:hidden`, `aria-hidden` e `inert`. Isso não serve para frame fixo nem altura ativa. Complemento aditivo oculto não deve reservar um buraco.
- Link navega, botão executa, disclosure revela, formulário submete. Preserve GET/action e validação nativa quando pertinentes. Queries, listeners, IDs e ARIA pertencem a cada instância.
- Painel inicialmente aberto precisa de destino de retorno de foco mesmo sem clique de abertura. Fechar não deixa foco em elemento hidden/inert. Exercite Tab, Enter, Space e Escape quando aplicáveis.
- Menu de seção, CTA externo e formulário operacional não são intercambiáveis. Verifique destino, aba, offset, origem e handoff separadamente, sem acionar serviços reais para testar aparência.

## Receitas e aplicação por superfície

O catálogo inclui navegação, ação, disclosure, foco, canvas, lifecycle, streams, faixas, alternância estável, conectores, simulação, formulário, indicadores, diagnóstico, sequência dependente, fit, inspeção, registros, fan-out/join, comparação, plano, gráfico com fonte e viewer. Selecione pela função; nenhuma receita é obrigatória nem suficiente para aprovação visual.

- **Site:** narrativa em fluxo nativo, níveis de heading e ações claras. Não exigir pin, inércia ou reveal genérico. Canvas contínuo tem um dono, holds e limite final alcançável; tinta e paleta interna do produto são conferidas à parte.
- **Produto:** priorizar tarefa, dados extremos, estados vazio/carregando/erro/sucesso e keyboard. Repetição consistente pode ser necessária. Não importar a densidade ou coreografia comercial de um site.
- **Presentation:** transportar relação e progressão para o canvas, não a página inteira. Se motion for solicitado, ativar somente o slide atual e resolver toda a informação antes de imprimir/exportar. Diagrama estático deve contar a história sem espera. Sem blur/glass dependente de compositor no print. Preservar exatamente três slides no primeiro lote, aprovações e workflow HTML-first com PDF opt-in. Este catálogo não autoriza criar o deck inteiro.
- **Documento:** favorecer leitura contínua e navegação nativa. Motion é opcional e nunca necessário à compreensão. Em formato paginado, relações, fontes e qualificadores ficam juntos e completos na impressão.

## Primitivas originais opcionais

`scene-runtime.mjs` é ESM sem dependências e sem CSS de identidade. Não é um novo framework ou catálogo de componentes. Não substituir motor aprovado para usar o kit.

| API | Contrato |
| --- | --- |
| `compileSequence(steps, {hold})` | Cada step tem id, duration em ms e after/delay opcionais. Ordem do array não define dependência. Rejeita ciclos, IDs duplicados, referências ausentes e números inválidos. Deriva duração pelo último término mais hold. |
| `sampleSequence(plan, elapsed, {loop, ease})` | Retorna state e progress por step a partir de um tempo; não muda DOM/dados. Ease linear por padrão mecânico, não recomendação estética. Use curvas por gesto quando necessário. |
| `cubicBezier(x1,y1,x2,y2)` | Amostragem compatível com curva CSS, invertendo x antes de y. Nenhuma curva de marca embutida. |
| `createCommitGate()` | begin devolve função de commit válida só para a revisão atual; invalidate/dispose descartam conclusões antigas. Não mede nem desenha componentes. |
| `mountScene(root, options)` | render(elapsed), settle obrigatório, onState opcional, reentry resume/restart, active e AbortSignal. Retorna setActive/dispose/state/elapsed. Sem capabilities, fica static. |

`mountScene` inicia só depois de fontes e visibilidade. Pausa preserva elapsed por padrão; reentry restart zera na pausa. Reduced motion e print sempre settle e reiniciam ao voltar. O relógio suspende seu próprio RAF; `onState` deve coordenar os demais canais do consumidor, inclusive pausa real de um motor externo quando necessário. Não chama APIs remotas nem cria controles. Para HTML standalone, inline o módulo selecionado através do processo de entrega; não deixar import de caminho local externo. Em CSS, estados running/paused preservam a mesma animação e mudam play-state; static expõe a pose completa. Fallback sem JS não depende de um atributo que só o script cria.

## Gate de revisão proporcional

Antes de apresentar, compare conjunto, superfície no tamanho de uso e detalhe. Faça um recorte coerente, não um estágio sem CSS/motion na prévia do usuário. Quando a direção for rejeitada, pare, substitua só a decisão afetada e os testes que a exigiam; preserve as invariantes. “Quase lá” pede convergência, não reinício. Exploração exige prova curta; release exige regressões completas. Não repetir suíte extensa para adiar julgamento visual.

Matriz mínima aplicável: primeiro carregamento com fontes atrasadas; estados alternativos e maior conteúdo; ida, hold, volta e emenda; pausa fora da tela/aba e retomada; preferência reduzida inicial e ao vivo; sem JS; print; menor largura útil e desktop; teclado e foco; múltiplas instâncias e cleanup. Marcar N/A com motivo, não fingir cobertura.

Relatório separa `technicalQa`, `visualDiagnostics`, `humanApproval` e `publication`. Registre URL/artefato, hash, viewport pedido e útil, mecanismo de emulação, tempos amostrados e limites. DOM ou fórmula não prova pixel; screenshot isolado não prova sensação; headless/iframe não é aparelho físico; remoção de trabalho não é benchmark. Aprovação humana pertence à nova aplicação, mesmo que a receita venha de experiência aprovada.
