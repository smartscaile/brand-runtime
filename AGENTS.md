# Brand Runtime · Codex Entry Point

## Escopo

Plugin universal para aplicar Brand Packs privados em Codex e Claude Code sem incorporar identidade, regras ou assets de clientes.

## Fontes de Verdade

- Estado do projeto: `project.json`
- Skill canônica: `plugins/brand-runtime/skills/brand/`
- Manifest Codex: `plugins/brand-runtime/.codex-plugin/plugin.json`
- Manifest Claude Code: `plugins/brand-runtime/.claude-plugin/plugin.json`
- Validação do repositório: `scripts/validate-repository.mjs`

## Regras

- Responder e escrever em pt-BR.
- Manter o runtime universal; identidade e regras de empresas pertencem exclusivamente aos Brand Packs externos.
- Editar a fonte em `plugins/brand-runtime/`, nunca o cache instalado do plugin.
- Preservar compatibilidade entre Codex e Claude Code.
- Atualizar versões e manifests de forma consistente quando houver release.
- Validar mudanças com `npm run check`.
