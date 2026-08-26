# Persistência e fontes duráveis

O Brand Runtime não usa banco de dados. A persistência é deliberadamente
baseada em arquivos com ownership e fronteiras explícitas.

## Fontes de dados

<!-- specsfy:database:start -->
| Fonte | Tecnologia/forma | Evidência |
| --- | --- | --- |
| Configuração do usuário | JSON no diretório padrão de configuração do sistema | `plugins/brand-runtime/scripts/brand-root-config.mjs` |
| Brand Pack | JSON, Markdown e assets em diretório externo | `plugins/brand-runtime/skills/brand/references/brand-pack-contract.json` |
| Regras de marca | `brand.rules.json` dentro do Brand Pack selecionado | `plugins/brand-runtime/skills/brand/references/client-rules-contract.json` |
| Conhecimento do projeto | Markdown e evidências em `docs/design/` no projeto consumidor | `plugins/brand-runtime/skills/brand/references/project-learning.md` |

## Estruturas detectadas

| Estrutura | Tipo | Campos | Relações | Fonte |
| --- | --- | --- | --- | --- |
| Configuração do brand root | JSON versionado por schema | `schemaVersion`, `brandRoot`, `updatedAt` | Aponta para a biblioteca externa de Brand Packs | `plugins/brand-runtime/scripts/brand-root-config.mjs` |
| Brand Pack | Diretório contratual | fonte, tokens, guideline, manifest, assets e regras opcionais | Selecionado por slug e validado antes do uso | `plugins/brand-runtime/skills/brand/scripts/brand.ts` |
| Entrada de conhecimento | Markdown estruturado | contexto, decisão, evidência, alcance e status | Pertence ao projeto consumidor; pode originar regra confirmada | `plugins/brand-runtime/skills/brand/references/project-learning.md` |
<!-- specsfy:database:end -->

## Decisões, ownership e retenção

- O plugin universal pertence ao runtime e não recebe conteúdo privado de
  clientes.
- Brand Packs e `brand.rules.json` pertencem ao cliente e ficam externos.
- A configuração do usuário guarda somente o caminho absoluto do diretório
  `brand`, nunca credenciais nem uma cópia do conteúdo.
- O conhecimento local pertence ao projeto consumidor e só é promovido para
  regra de marca após confirmação normativa explícita.
