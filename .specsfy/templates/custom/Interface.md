# Superfícies e artefatos do Brand Runtime

Este arquivo inventaria as superfícies, famílias de composição e contratos
reutilizáveis do runtime. Ele não define identidade de cliente e não substitui
um Brand Pack validado, a direção local de uma entrega ou `DESIGNSYSTEM.MD`.

## Base observada

- Stack detectada: {{STACK_LABEL}}
- Produto: plugin universal para Codex e Claude Code.
- Superfícies: sites, produtos, apresentações e documentos.
- Entrega de apresentações: HTML determinístico, PDF e QA renderizado.

{{STACK_GUIDANCE}}

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
| Apresentação | A mapear | `skills/presentation/` | Papel narrativo, composição, densidade, asset e QA | Decks HTML/PDF | A mapear |
| Site ou produto | A mapear | `skills/brand/references/` | Hierarquia, interação, responsividade, estados e acessibilidade | Projetos consumidores | A mapear |
| Documento | A mapear | `skills/brand/references/document-export.md` | Estrutura, identidade, paginação e exportação | Documentos finais | A mapear |

## Inventário de apresentação

Cada família de slide deve ser registrada com intenção narrativa, composição,
limites de reuso e evidência renderizada. Uma classe CSS ou um template não é,
por si só, uma família visual aprovada.

| Família | Papel narrativo | Estrutura | Variações permitidas | Limite de repetição | Evidência |
| --- | --- | --- | --- | --- | --- |
| A mapear | A mapear | A mapear | A mapear | A definir por spec | A mapear |

## Regras de composição

1. Identidade, direção de arte, sistema de composição e conteúdo são camadas
   distintas e devem ter autoridade explícita.
2. Nenhum preset estético genérico entra no core como identidade implícita.
3. Antes de escalar uma apresentação inteira, validar um conjunto pequeno de
   slides representativos que prove narrativa, direção de arte e sistema.
4. Reuso significa preservar intenção e qualidade, não repetir o mesmo arranjo
   de headline, cards, screenshots ou divisores.
5. Toda família nova ou alterada registra consumidores, estados, limites,
   acessibilidade e evidência visual no mesmo trabalho.
6. QA técnico é obrigatório, mas não equivale a aprovação de direção visual.

## Dívidas e lacunas observadas

| Lacuna | Evidência | Próxima decisão |
| --- | --- | --- |
| Taxonomia de famílias ainda não formalizada | Runtime atual | Definir na primeira spec de qualidade de apresentações |
| Gates editoriais e visuais ainda não são contratos executáveis | Runtime atual | Definir critérios, estados e evidências na primeira spec |
