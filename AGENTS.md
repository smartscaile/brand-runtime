# Brand Runtime · Codex Entry Point

## Escopo

Plugin universal para aplicar Brand Packs privados em Codex, Claude Code e Hermes sem incorporar identidade, regras ou assets de clientes.

## Fontes de Verdade

- Estado do projeto: `project.json`
- Skill canônica: `plugins/brand-runtime/skills/brand/`
- Manifest Codex: `plugins/brand-runtime/.codex-plugin/plugin.json`
- Manifest Claude Code: `plugins/brand-runtime/.claude-plugin/plugin.json`
- Manifest Hermes: `plugins/brand-runtime/plugin.json`
- Validação do repositório: `scripts/validate-repository.mjs`

## Regras

- Responder e escrever em pt-BR.
- Manter o runtime universal; identidade e regras de empresas pertencem exclusivamente aos Brand Packs externos.
- Editar a fonte em `plugins/brand-runtime/`, nunca o cache instalado do plugin.
- Preservar compatibilidade entre Codex, Claude Code e Hermes.
- Atualizar versões e manifests de forma consistente quando houver release.
- Validar mudanças com `npm run check`.

## Fluxo de mudança

- Antes de alterar comportamento, leia `PROJECT.md`, `DESIGNSYSTEM.MD`,
  `INTERFACE.md` e a documentação específica da superfície afetada.
- Trate código, contratos, testes e documentação viva como fontes normativas;
  não crie uma árvore paralela de specs, planos ou tarefas no repositório.
- Para bug, feature ou mudança de contrato, escreva primeiro um teste que falhe
  pela causa esperada, implemente a correção mínima e mantenha a suíte verde.
- Execute `npm run test`, `npm run check` e `git diff --check` antes de concluir.
- Registre decisões arquiteturais duráveis em `docs/decisions.md`; trabalho
  futuro pertence ao tracker, não a arquivos de backlog locais.

## Apresentações

- HTML standalone é a entrega padrão; PDF automatizado só existe com `--pdf`.
- Não adicionar fullscreen ao Viewer; `Save PDF` continua usando
  `window.print()` quando não há payload PDF explícito.
- Antes de construir um deck, apresentar e obter aprovação explícita do brief,
  pasta de saída, narrativa, tese visual e plano de evidências.
- A primeira implementação contém exatamente três slides, por padrão os slides
  1–3. Não criar os demais slides, nem como placeholders, até aprovação humana
  explícita para escalar o deck.
- Aprovar pasta, brief ou outro checkpoint isolado não aprova os checkpoints
  restantes nem autoriza o deck completo.
