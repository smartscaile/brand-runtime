# Stack do sistema

Documente tecnologias estruturais e a evidência executável que confirma cada
uma. Preserve decisões humanas nas seções livres deste arquivo.

## Inventário detectado

<!-- specsfy:stack:start -->
| Camada | Tecnologia | Evidência |
| --- | --- | --- |
| Runtime | Node.js | `package.json` |
<!-- specsfy:stack:end -->

## Decisões e observações do projeto

- JavaScript em ES modules é declarado por `type: module` em `package.json`.
- O baseline operacional é Node.js 22.20.0 ou superior, declarado por `engines.node`; ele cobre os globals `fetch` e `WebSocket` usados pelo Runtime.
- O plugin é empacotado para Codex e Claude Code por manifests independentes em
  `plugins/brand-runtime/.codex-plugin/` e
  `plugins/brand-runtime/.claude-plugin/`.
- O Hermes consome o manifest portátil Agent Plugins v1 em
  `plugins/brand-runtime/plugin.json` por instalação gerenciada em cada perfil.
- Skills e referências Markdown são parte executável do produto e vivem em
  `plugins/brand-runtime/skills/`.
- A apresentação usa HTML/CSS e o navegador local para renderização; PDF e
  Poppler são ativados somente quando `--pdf` é explícito, conforme `skills/presentation/references/html-delivery.md` e
  `skills/presentation/scripts/presentation-runtime.mjs`.
- Os testes usam o test runner nativo do Node.js, conforme o script `check` em
  `package.json` e os arquivos em `tests/`.
- Specsfy é dependência de desenvolvimento e governa a evolução por specs; não
  integra o plugin distribuído nem o runtime dos clientes.
