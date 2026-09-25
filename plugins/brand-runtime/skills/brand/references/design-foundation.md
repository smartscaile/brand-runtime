# Universal design foundation

This foundation defines a quality floor for interface and artifact direction. It is deliberately identity-neutral. A Brand Pack supplies official identity in `brand-pack`; an explicitly provisional project direction owns non-official visual choices in `brand-pending`.

## Boundaries

- In `brand-pack`, never introduce a color, font, logo, icon family, radius style, shadow style, voice, or visual motif that the selected Brand Pack does not authorize.
- In `brand-pending`, keep identity-like choices project-local, provisional, and replaceable. Never add an official logo or claim that these choices represent the client's brand.
- Never treat this foundation as a fallback Brand Pack.
- Never call a particular aesthetic universally premium, modern, elegant, technical, editorial, or beautiful.
- Prefer relationships and semantic roles over isolated values.
- Let content, user intent, medium, and brand determine composition.

## Método comum de composição

Este método é obrigatório para site, produto, apresentação e documento, em `brand-pack` e `brand-pending`. Execute-o antes de implementar uma composição nova ou uma mudança estrutural. Em um ajuste localizado, reaproveite a direção aprovada e registre somente a decisão afetada. Não transforme um refinamento em um novo questionário ou redesign completo.

### Mapa de conteúdo

Para cada unidade relevante, como seção, tela, slide, página ou componente, identifique:

- **Intenção ou afirmação:** o que a pessoa precisa compreender ou concluir. Em UI operacional, use a tarefa, não uma headline comercial.
- **Evidência ou conteúdo:** dados, texto, interface ou mecanismo que sustentam essa intenção. Preserve fonte, qualificadores e copy aprovada.
- **Relação dominante:** comparação, sequência, hierarquia, causa, decisão, correspondência ou estado que o desenho precisa revelar.
- **Densidade:** conteúdo e controles necessários à tarefa, distância de leitura e meio. Não reduza informação útil para imitar uma landing page.
- **Restrições:** identidade, conteúdo, componentes aprovados, tecnologia, estados, acessibilidade e limites do pedido.

Escolha a forma pela relação: tabela para correspondências exatas, sequência para etapas, gráfico com escala e unidade para quantidades, diagrama para mecanismo, campos e controles para tarefas. Não use cards como resposta automática. Reutilizar tokens ou um componente não prova que sua anatomia serve ao novo contexto.

### Perfil de composição

Defina quatro decisões locais, sempre com uma justificativa ligada ao conteúdo:

- **densidade:** esparsa, equilibrada ou densa;
- **distribuição:** concentrada em um foco ou distribuída entre grupos relacionados;
- **simetria:** estável, deslocada ou assimétrica;
- **continuidade:** repetição, contraste ou ruptura em relação às unidades vizinhas e aos estados da tarefa.

Não use esses campos como score, preset fixo, identidade ou aprovação automática. Consistência operacional pode exigir repetição; não alterne layouts apenas para produzir variedade. Assimetria e espaço vazio não são objetivos por si sós.

### Candidatos estruturais

Quando uma escolha material estiver ambígua, compare pelo menos duas estruturas em baixa fidelidade antes de produzir o layout completo. Descreva entrada dominante, percurso de leitura ou ação, tratamento da evidência, espaço negativo e relação com os vizinhos. Variantes que mudam só cor, borda ou ícone não são alternativas estruturais.

Escolha pela tarefa, conteúdo, evidência e direção aprovada, nunca por randomização ou rotação de presets. Se o caminho estiver claro, aplique-o sem pedir ao usuário que resolva detalhes de implementação. Peça decisão apenas quando mudar intenção, identidade, conteúdo aprovado ou escopo. Não reabra alternativas já rejeitadas.

### Prova antes de escalar

Antes de propagar uma estrutura nova, renderize um recorte coerente que exponha seus maiores riscos. O tamanho e a autorização do lote pertencem ao projeto e ao fluxo da superfície, não a uma quantidade universal. Preserve os gates específicos de Presentation; não imponha canvas de slides ou controles de deck a sites, produtos ou documentos.

Use conteúdo autorizado e estados relevantes, não placeholders decorativos para simular um resultado pronto. Exemplos sintéticos devem estar identificados como exemplos, nunca como dados observados. Primeiro resolva a composição estática; depois acrescente motion que explique uma relação. Esse recorte de validação não reduz o escopo de entrega já autorizado.

Registre mapa, perfil, decisão e evidência no documento de direção existente para criações substanciais. Em ajustes pequenos, mantenha apenas o delta necessário no contexto de trabalho. Não crie uma árvore paralela de planos ou catálogos de layouts.

## Information and hierarchy

- Give each composition one dominant idea, one primary evidence or content block, and one clear next action when an action exists.
- Make hierarchy understandable through size, weight, position, spacing, and sequence. Do not rely on color alone.
- Keep supporting copy subordinate to the main message and control line length for comfortable reading.
- Preserve meaningful content and order unless the user explicitly requests editorial changes.
- Keep related items visibly closer to one another than to unrelated groups.

## Layout relationships

Before implementation, map four spacing roles to declared Brand Pack tokens or provisional project-local roles:

1. page or canvas margin;
2. section gap;
3. component inset;
4. internal stack gap.

Reuse a role consistently. Change it deliberately by breakpoint or composition, never as an isolated patch. Use grid columns, alignment, proportion, and negative space to establish rhythm rather than filling every region with a component.

## Content-safe components

- Size text-bearing containers from content by default.
- Use fixed dimensions only when the output format requires them and rendered content remains inside every inset.
- Avoid hidden overflow, masks, clipping, and line clamping for authored content unless truncation is requested and communicated.
- Use predictable border-box sizing, container padding, layout gaps, and controlled child margins.
- Treat cards, dividers, badges, pills, and callouts as semantic components, not automatic decoration.
- Do not repeat one card anatomy merely to create visual consistency.

## Typography

- In `brand-pack`, use only declared families, roles, styles, and weights. In `brand-pending`, select accessible, licensed project-local typography and mark it provisional.
- Establish clear display, heading, body, label, data, and annotation roles only when the content needs them.
- Preserve readable line height and measure at every breakpoint.
- Avoid arbitrary scale changes used only to force content into a fixed box.
- Wait for final fonts before judging wrapping, density, or containment.

## Color and contrast

- Use semantic color roles before primitive values. In `brand-pending`, keep their values provisional and project-local.
- Maintain readable contrast for text, controls, focus, and status communication.
- Reserve accent colors for meaningful emphasis or action.
- Do not use gradients, glows, noise, translucency, or dark surfaces as automatic signals of quality.
- Keep status colors tied to status meaning.

## Imagery and iconography

- Define what imagery must communicate before choosing or generating it.
- Keep subject, crop, light, perspective, grading, and density coherent with the project thesis.
- Use declared Brand Pack assets in `brand-pack`; use only authorized project assets in `brand-pending`. Preserve proportions and intended use.
- Map official icons to real functions before adding decorative symbols.
- Prefer typography, spacing, data, or imagery when an icon adds no meaning.

## Interaction and motion

- Make primary actions identifiable and keep state changes stable across pointer, keyboard, touch, loading, success, and error states.
- Use motion to explain continuity, hierarchy, progress, or causality.
- Avoid motion that competes with reading or exists only to imply polish.
- Respect reduced-motion preferences while preserving state feedback.

## Responsive behavior

- Recompose by priority instead of shrinking a desktop arrangement mechanically.
- Preserve readable measure, touch targets, content order, and mapped insets.
- Verify long content, localization, keyboard navigation, zoom, and reduced motion when relevant.
- On mobile, remove nonessential chrome before reducing content or interaction clarity.

## Visual QA

Render the required breakpoints and exports after final assets and fonts load. Inspect:

- hierarchy and focal point;
- alignment and proximity;
- density and negative space;
- text and child bounds;
- scroll dimensions and edge insets;
- contrast and interaction states;
- asset integrity;
- repeated visual patterns without semantic purpose;
- consistency with the project design direction and the selected direction mode.

Structural correctness is necessary but not sufficient. Refine until the composition communicates the intended perception without generic decorative shortcuts.

## Crítica em três escalas

Execute a crítica após renderizar e antes de apresentar a revisão ao usuário, não somente depois de uma rejeição. Se não houver acesso ao render, informe essa limitação; leitura de código não substitui inspeção visual.

1. **Conjunto:** observe miniaturas, seções vizinhas ou etapas da tarefa sem depender da leitura do texto. Compare massas, foco, densidade, silhuetas e espaço negativo. Repetição deve servir à continuidade, não denunciar um template.
2. **Superfície:** percorra a página, tela, slide ou unidade de documento no tamanho real de uso. Verifique a entrada principal, ordem de leitura ou ação, relação entre informação e evidência, estados e saída. Inspecione o scroll real e as transições quando fizerem parte da experiência.
3. **Detalhe:** confira tipografia, alinhamento, proporção, insets, ícones, anotações, foco, alvos de interação e conteúdo extremo. Corrija detalhes depois de resolver a estrutura.

Em web e produto, examine breakpoints e estados relevantes; em apresentação, distância de leitura e sequência; em documento, fluxo e paginação quando aplicável. Não use uma captura desktop como prova de toda a experiência.

## Refinamento pela causa

Classifique o problema dominante como conteúdo, hierarquia, composição, sistema, evidência, interação, imagem ou entrega. Diga o que deve permanecer intacto. Corrija a causa antes de acrescentar bordas, sombras, ícones ou animação.

- **Conservador:** preserve estrutura e corrija acabamento quando a relação já estiver clara.
- **Editorial:** reorganize hierarquia, escala, proximidade e ritmo preservando conteúdo e mecanismo.
- **Estrutural:** mude a forma de informação apenas quando ela for a causa e o escopo permitir.

Recomende uma direção com motivo concreto. Implemente uma passagem coerente, renderize novamente e repita a crítica em três escalas. Verifique vizinhos, variantes e estados aprovados. Não apresente um build verde como resposta a uma rejeição estética nem repita microajustes que preservam a causa.

## Diagnósticos de composição genérica

Trate os sinais abaixo como hipóteses contextuais, não proibições estéticas universais:

- mesma anatomia de ícone, título, texto e card para conteúdos com relações diferentes;
- todos os grupos com peso igual, sem ponto de entrada ou ação dominante;
- headlines, eyebrows, badges, divisórias, efeitos e superfícies sem função;
- barrinhas que parecem carregamento, gráficos sem unidade ou dados decorativos apresentados como informação;
- componente pequeno e isolado em um vazio que rompe sua ligação com a explicação;
- elementos independentes aparentando conexão por proximidade acidental;
- motion que encobre uma composição fraca, compete com leitura ou apaga conteúdo;
- remoção indiscriminada de caixas que destrói agrupamentos necessários;
- variação cosmética ou troca de nomes de famílias usada para alegar diversidade.

Para cada achado, identifique o elemento, a evidência renderizada, a consequência e a correção ou exceção aprovada. Separe verificação técnica, crítica de composição e aprovação humana. Referências carregadas e `designMethod.status: instructions-only` provam disponibilidade do método, não sua execução, maturidade visual ou aceite. Não invente uma nota de beleza.

Consulte `design-method-provenance.md` ao auditar ou modificar a adaptação externa. Ele registra a origem e os limites do método, não uma dependência online nem uma autoridade de identidade.
