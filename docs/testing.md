# Testes

## Correção do inventário automático

O runner é o `node:test`, acionado por `npm run test` e `npm run check`. Os
arquivos atuais são:

- `tests/brand-command-hook.test.mjs`
- `tests/brand-cli.test.mjs`
- `tests/presentation-runtime.test.mjs`

O comando `npm run check` também executa `scripts/validate-repository.mjs`.

<!-- specsfy:documentator:start -->
## Resumo

- Arquivos de teste: 0.
- Runner: não identificado.
- Scripts: check: node scripts/validate-repository.mjs && node --test tests/brand-command-hook.test.mjs tests/brand-cli.test.mjs tests/hermes-plugin-integration.test.mjs tests/presentation-runtime.test.mjs; test: node --test tests/brand-command-hook.test.mjs tests/brand-cli.test.mjs tests/hermes-plugin-integration.test.mjs tests/presentation-runtime.test.mjs; test:tdd: node --test tests/presentation-runtime.test.mjs; validate: node scripts/validate-repository.mjs.

| Arquivo |
| --- |
| Nenhum teste identificado |
<!-- specsfy:documentator:end -->
