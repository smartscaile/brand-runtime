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
- `tests/interface-engineering.test.mjs`
- `tests/interface-mechanics.test.mjs`
- `tests/interface-browser.test.mjs`
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
identidade e regras, com direção local compatível antes da orientação universal. `hermes-managed-release.test.mjs` verifica
a base comum, os consumidores Brand e Presentation, a direção local e a
proveniência imutável. O gate de três slides continua específico de Presentation.

Além do contrato determinístico, uma mudança de método requer prova
comportamental com briefs sintéticos identidade-neutros, usando somente as
instruções distribuídas. Registre os documentos e hashes recebidos, as decisões
produzidas e a validação do resultado. Separe site, produto, apresentação e
documento; verifique que UI operacional preserva estados e repetição útil,
sem herdar formato de deck. Essa prova confirma aplicação das instruções,
não qualidade estética de um artefato ainda não renderizado nem aprovação humana.

O CLI também verifica descoberta read-only de entradas de design existentes,
sem impor a árvore Markdown, sem inferir aprovação e sem seguir symlinks ou
aceitar diretórios como arquivos. Os testes do conteúdo distribuído conferem
reúso da UI real, liberdade de composição e preservação das regras explícitas.
Essas verificações não demonstram que uma interface ficou visualmente melhor.

## Fundação e biblioteca global

Os testes exercitam `designAuthority` nas quatro superfícies e nos dois modos,
preservam regras explícitas e verificam a precedência dos defaults. Biblioteca:
schema legado, união dinâmica, adição idempotente, substituição explícita,
raízes inválidas, colisões e precedência local. CLI e hook precisam selecionar
o mesmo slug, incluindo a forma posicional do CLI. A instalação deve ser
conferida por perfil contra o payload publicado e os packs canônicos.

A patch de binding exercita colisão com pasta histórica sem marker, escolha
explícita da raiz, idempotência, preservação das outras marcas e dos bindings
durante `config add`, reset por `config set`, erros sem fallback e precedência
dos caminhos explícitos, ambiente e projeto. Os perfis devem consumir a mesma
pack pelo slug sem exigir um path repetido em cada chamada.

## Engenharia de interface

Contratos verificam as 24 receitas, fronteira de identidade, entradas Brand e
Presentation, quatro superfícies, dois modos de identidade, duas fixtures de
Pack distintas e falha em bundle realocado quando faltam guia, catálogo ou
mecânica. Primitivas têm relógio de teste, DAG com join/hold, ciclos inválidos,
Bézier por inversão de x, descarte de commit antigo, pausa/retomada, restart,
fontes tardias, preferência ao vivo, print, BFCache, AbortSignal e reinit.

Probes comportamentais sem histórico e exemplos renderizados são evidências
separadas. Fixtures sintéticas não são Packs oficiais nem um deck aprovado.
Inspecionar primeiro paint, intermediários, hold, retorno, contraste e conteúdo
estático. Testes de DOM simulado não provam pixels, dispositivo ou FPS.

`interface-browser.test.mjs` usa o mesmo pré-requisito Chrome/Chromium dos
testes de apresentação, em perfil isolado e com rede externa bloqueada.
A fixture de UI contém duas identidades explicitamente sintéticas, não Packs
de clientes nem um deck. O teste exerce desktop, duas larguras estreitas,
ciclo/hold/reinício, pausa por atividade e viewport, preferência reduzida ao
vivo, media print e JavaScript de página desativado. Para guardar capturas e
recibo, definir `INTERFACE_QA_DIR` e executar esse teste. Não altera navegador,
preview ou configurações do usuário. A inspeção humana/modelo dos PNGs segue
separada do PASS técnico; media print não é validação de PDF ou aparelho.

Na preparação 0.10.0, a suíte completa passou com 189 testes, sem falhas ou
skips. A revisão independente identificou coerção de IDs e RAF duplicado por
reentrada síncrona; ambos foram reproduzidos em regressões vermelhas e corrigidos.
O gate oficial inclui os três arquivos novos. O titular manteve o licenciamento
existente, sem concessão pública nova.

O probe isolado do guia final cobriu site, produto, apresentação e documento,
com duas identidades sintéticas, JSON sem chaves duplicadas, tokens exatos,
receitas válidas por superfície e gates corretos. O processo terminou sem
chamadas de ferramentas, render ou alegação de aceite. A resposta ultrapassou
a instrução de concisão; o resultado confirma compreensão semântica, não
aderência integral a todas as instruções de formato nem excelência visual.
As capturas das fixtures mostram leitura permanente, avanço e reset dos
acentos e recomposição estreita legível nos recortes inspecionados. Não são
templates aprovados, Packs oficiais ou provas de paridade com o site doador.
