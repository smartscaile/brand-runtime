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
