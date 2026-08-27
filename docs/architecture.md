# Arquitetura

## Fronteiras reais observadas

```mermaid
flowchart LR
  CodexClaude[Codex ou Claude Code] --> Hook[Hook de comando]
  Hermes[Hermes] --> Portable[Índice portátil Agent Plugins v1]
  Hook --> Brand[Skill Brand]
  Hook --> Presentation[Skill Presentation]
  Portable --> Brand
  Portable --> Presentation
  Brand --> CLI[CLI e contratos]
  CLI --> Pack[Brand Pack externo]
  Brand --> Knowledge[docs/design no projeto consumidor]
  Presentation --> Runtime[Runtime de apresentação]
  Runtime --> HTML[Deck HTML local]
  HTML --> Browser[Navegador local]
  Browser --> SavePDF[Save PDF pelo usuário]
  Runtime --> ExplicitPDF[PDF explícito e evidências de QA]
```

O plugin distribuído permanece identidade-neutro. Brand Packs e conhecimento
mutável pertencem respectivamente ao cliente e ao projeto consumidor.

## Distribuição Hermes na v0.6.0

O Hermes instala o pacote portátil como diretório regular gerenciado em cada
perfil. Instalação e atualização usam o instalador nativo contra a fonte
Smartscaile aprovada, seguidas por Plugin Doctor e uma nova sessão; o diretório
instalado não aponta para o checkout de desenvolvimento.

<!-- specsfy:documentator:start -->
## Componentes

| Tipo | Quantidade |
| --- | --- |
| Código | 1 |
| Testes | 0 |

## Diagramas

```mermaid
flowchart TD
  Application[Aplicação]
```

```mermaid
classDiagram
  class Application
```
<!-- specsfy:documentator:end -->
