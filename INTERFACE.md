# Superfícies e artefatos do Brand Runtime

Este arquivo inventaria as superfícies, famílias de composição e contratos
reutilizáveis do runtime. Ele não define identidade de cliente e não substitui
um Brand Pack validado, a direção local de uma entrega ou `DESIGNSYSTEM.MD`.

## Base observada

- Stack detectada: Node.js ESM e Chrome DevTools Protocol; Poppler é usado somente no modo PDF explícito.
- Produto: plugin universal para Codex, Claude Code e Hermes.
- Superfícies: sites, produtos, apresentações e documentos.
- Entrega de apresentações: HTML determinístico por padrão; PDF e QA PDF são opt-in.

Confirme os manifests e as fronteiras principais antes de completar o modelo genérico.

## Fontes de autoridade

| Camada | Fonte | Responsabilidade |
| --- | --- | --- |
| Identidade | Brand Pack externo validado | Tokens, assets, voz e regras oficiais do cliente |
| Direção da entrega | `docs/design/design-direction.md` no projeto consumidor | Tese visual, composição, ritmo e exceções locais |
| Sistema universal | `plugins/brand-runtime/skills/*` | Workflow, contratos, gates, renderização e QA neutros |
| Aprendizado | `docs/design/` no projeto consumidor | Evidências e decisões reutilizáveis sem contaminar o core |

## Superfícies e famílias

| Superfície | Família ou bloco | Fonte atual | Contrato e estados | Consumidores | Status |
| --- | --- | --- | --- | --- | --- |
| Apresentação | Família semântica project-local | `skills/presentation/` + `presentation.spec.json` | `id`, `job`, `family`, thresholds, aprovações, freeze e QA | Decks HTML; PDF opt-in | Contrato v1 ativo |
| Site ou produto | A mapear | `skills/brand/references/` | Hierarquia, interação, responsividade, estados e acessibilidade | Projetos consumidores | A mapear |
| Documento | A mapear | `skills/brand/references/document-export.md` | Estrutura, identidade, paginação e exportação | Documentos finais | A mapear |

## Inventário de apresentação

Cada família de slide deve ser registrada com intenção narrativa, composição,
limites de reuso e evidência renderizada. Uma classe CSS ou um template não é,
por si só, uma família visual aprovada.

| Família | Papel narrativo | Estrutura | Variações permitidas | Limite de repetição | Evidência |
| --- | --- | --- | --- | --- | --- |
| Slug declarado no projeto | Um job narrativo por slide | Composição definida pela direção local | Variações justificadas semanticamente | `qualityPolicy.maxConsecutiveFamily` | Metadados HTML, spec e renders de QA |

## Estados de apresentação

O relatório separa:

- `technicalQa`: integridade técnica e de render;
- `systemDiagnostics`: contrato e thresholds explicáveis;
- `approvals.content` e `approvals.visual`: decisões humanas;
- `freeze`: vínculo humano aos hashes de HTML, PDF e spec;
- `deliveryState`: precedência determinística até `frozen`.

Não existe estado final genérico `passed`. Decks sem contrato v1 permanecem `legacy-unverified` e não recebem metadados inferidos.

## Viewer HTML-first

| Bloco | Finalidade | Arquivo | Estados e ações | Consumidores | Regra de reaproveitamento |
| --- | --- | --- | --- | --- | --- |
| Viewer chrome | Navegar, comunicar progresso e salvar a apresentação sem alterar o canvas imprimível | `plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html` | Progresso superior; título e contador ativos; Previous/Next desabilitados nos limites; foco visível; hash e teclado sincronizados; dock em fluxo como ilha central de até 520 px no desktop e 340 px no mobile; stage transparente e recortado; sem payload: `Save PDF` chama `window.print()`; com payload validado: `Download PDF` baixa os bytes exatos; falha de decode desabilita a ação | HTML standalone e HTML com PDF opt-in | Preservar IDs, `data-title`, keyboard/hash navigation, alvos mínimos de 44 px, tokens `--viewer-*`, `@media print` e estados; tokens do Brand Pack governam somente o canvas |

O viewer não possui menu global, formulário nem controle fullscreen. A navegação principal ocorre pelo dock Previous/Next, por Left/Right, Page Up/Page Down, Home e End e por hash `#slide-N`. A barra superior comunica progresso, enquanto o dock fica centralizado 12 px abaixo do stage e expõe o título ativo e o contador; abaixo de 440 px, o título ativo é ocultado sem remover nenhuma ação. O cálculo de escala reserva a altura real da ilha e o stage usa fundo transparente com `overflow: hidden`, sem outline intermediário nas bordas do slide. A ação Save PDF abre o diálogo nativo do navegador; cancelar o diálogo não altera o deck. `.presentation-viewer` e `.presentation-dock` são excluídos da impressão, e o foco permanece visível por teclado.

## Regras de composição

1. Identidade, direção de arte, sistema de composição e conteúdo são camadas
   distintas e devem ter autoridade explícita.
2. Nenhum preset estético genérico entra no core como identidade implícita.
3. Antes de escalar uma apresentação inteira, aprovar brief, pasta, narrativa,
   tese visual e evidências; depois implementar exatamente três slides, por
   padrão os slides 1–3, sem criar os demais nem como placeholders.
4. O deck completo só pode ser construído após aprovação humana explícita do
   primeiro lote; a aprovação isolada de uma pasta ou de outro checkpoint não
   substitui essa autorização.
5. Reuso significa preservar intenção e qualidade, não repetir o mesmo arranjo
   de headline, cards, screenshots ou divisores.
6. Toda família nova ou alterada registra consumidores, estados, limites,
   acessibilidade e evidência visual no mesmo trabalho.
7. QA técnico é obrigatório, mas não equivale a aprovação de direção visual.

## Dívidas e lacunas observadas

| Lacuna | Evidência | Próxima decisão |
| --- | --- | --- |
| Diagnósticos v1 cobrem apenas paridade, repetição consecutiva e eyebrow | Contrato v1 | Calibrar novos findings com decks avaliados por pessoas, sem score de gosto |
| Golden decks ainda não possuem conjunto governado | Runtime atual | Definir proveniência, autorização e uso de regressão em trabalho posterior |
