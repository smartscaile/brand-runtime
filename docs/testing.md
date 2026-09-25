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

## Método comum de composição

`brand-cli.test.mjs` verifica o conteúdo e os hashes de `context.designMethod`
nas quatro superfícies, nos modos `brand-pack` e `brand-pending`, preservando
identidade, regras e precedência. `hermes-managed-release.test.mjs` verifica
a base comum, os consumidores Brand e Presentation, a direção local e a
proveniência imutável. O gate de três slides continua específico de Presentation.

Além do contrato determinístico, uma mudança de método requer prova
comportamental com briefs sintéticos identidade-neutros, usando somente as
instruções distribuídas. Registre os documentos e hashes recebidos, as decisões
produzidas e a validação do resultado. Separe site, produto, apresentação e
documento; verifique que UI operacional preserva estados e repetição útil,
sem herdar formato de deck. Essa prova confirma aplicação das instruções,
não qualidade estética de um artefato ainda não renderizado nem aprovação humana.
