# Testes

O runner é `node:test`.

| Comando | Cobertura |
| --- | --- |
| `npm run test` | Suíte funcional completa |
| `npm run test:tdd` | Viewer e runtime de apresentação |
| `npm run validate` | Estrutura e invariantes do repositório |
| `npm run check` | Validação estrutural seguida da suíte completa |

## Arquivos

- `tests/brand-command-hook.test.mjs`
- `tests/brand-cli.test.mjs`
- `tests/hermes-plugin-integration.test.mjs`
- `tests/hermes-managed-release.test.mjs`
- `tests/presentation-viewer-ui.test.mjs`
- `tests/presentation-runtime.test.mjs`
- `tests/no-legacy-framework-critical-path.test.mjs`

O último teste garante que o framework removido não volte ao caminho crítico.
O snapshot inclui o próprio arquivo do guard; somente as ocorrências necessárias
ao autoteste são aceitas, por comparação exata dos hashes das linhas autorizadas.
