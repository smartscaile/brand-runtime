# Integrações

| Integração | Contrato |
| --- | --- |
| Codex | Marketplace em `.agents/plugins/marketplace.json`; manifest em `plugins/brand-runtime/.codex-plugin/plugin.json`; skills em `plugins/brand-runtime/skills/` |
| Claude Code | Marketplace em `.claude-plugin/marketplace.json`; manifest em `plugins/brand-runtime/.claude-plugin/plugin.json`; skills em `plugins/brand-runtime/skills/`; hooks em `plugins/brand-runtime/hooks/hooks.json` |
| Hermes | Manifest Agent Plugins v1 em `plugins/brand-runtime/plugin.json`; skills em `plugins/brand-runtime/skills/`; instalação gerenciada por profile e sem symlink; usa a fonte oficial corrente por padrão e pin imutável somente com `--ref <SHA-40>` explícito |
| Brand Pack | Diretório externo validado; identidade nunca é incorporada ao runtime |
| Chrome/CDP | Render e inspeção local de apresentações |
| Poppler | Dependência externa apenas para QA de PDF solicitado explicitamente |

Credenciais, tokens e configurações específicas de clientes não pertencem a
este repositório.

## Escopo da fonte v0.9.0

Os três manifests e a metadata raiz usam `0.9.0`. O bundle mantém os caminhos
de distribuição e o método compartilhado em `context.designMethod`.
`context.designAuthority` separa identidade, defaults e UI local. A biblioteca
global pode registrar múltiplas pastas `brand` via `config add`, preservando
as anteriores; `config set` continua sendo substituição explícita.

Esta preparação parte de `0.8.0` e não inclui projeção de Brand Packs nem muda
os contratos ou gates de apresentação. A versão na fonte não comprova
publicação, instalação ou ativação em qualquer host. Após uma publicação
autorizada, a instalação gerenciada deve ser verificada separadamente em cada
host e perfil, inclusive os hashes das referências efetivamente recebidas.
