# Frontend e design system

## Superfície real

Este repositório não é uma aplicação frontend React. A superfície visual
reutilizável observada é o starter HTML/CSS de apresentações em
`plugins/brand-runtime/skills/presentation/assets/html-starter/`. O sistema de
direção universal e o inventário de famílias ficam em `DESIGNSYSTEM.MD` e
`INTERFACE.md`; identidade e tokens continuam externos.

O Viewer usa HTML, CSS e JavaScript nativos, sem dependência de framework. Seus
tokens `--viewer-*` governam apenas o chrome; os tokens do Brand Pack governam o
canvas. A impressão exclui o Viewer e preserva somente os slides.
