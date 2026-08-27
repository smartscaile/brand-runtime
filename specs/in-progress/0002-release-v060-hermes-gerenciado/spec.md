# Especificação integrada: Release v0.6.0 e instalação gerenciada no Hermes

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0002 |
| Slug | 0002-release-v060-hermes-gerenciado |
| Status | Implementing |
| Effort | 4 |
| Effort updated at | 2026-08-26 |
| Effort rationale | Mudança pequena de produto, mas com versionamento multi-runtime, onboarding remoto, instalação externa e publicação no main. |
| ClickUp Task | |
| Milestones | Release v0.6.0 |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-08-26 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A integração Hermes e o fluxo HTML-first foram publicados no `main` depois da release 0.5.0 sem alterar o número da versão. A instalação Hermes documentada sem `--force` é bloqueada pelo scanner comunitário, e a documentação ainda admite symlink embora a regra operacional confirmada seja instalação gerenciada em cada perfil.

#### Resultado desejado

O time da Checkgrow instala ou atualiza o Brand Runtime v0.6.0 como plugin gerenciado do Hermes, sem symlink, usando um comando executável e verificável, e consegue confirmar a nova versão e as skills `brand` e `presentation`.

#### Métricas de sucesso

- 100% dos manifests e metadados canônicos declaram a release 0.6.0 de forma consistente.
- Instalação e reinstalação em `HERMES_HOME` limpo saem com código 0, criam diretório regular e carregam duas skills.
- Zero orientação ou contrato de symlink permanece no escopo de instalação Hermes.
- `npm run check` passa integralmente antes da publicação.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] A instalação pública documentada funciona em Hermes limpo — Verdict: refuted — Confidence: high — Evidence: execução local isolada de `hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --enable`, bloqueada pelo scanner `CAUTION` — Budget: 1/2.
- **R-002** [critical] `--force --enable` produz instalação gerenciada válida — Verdict: verified — Confidence: high — Evidence: execução local isolada com exit 0, diretório regular, versão 0.5.0 e Plugin Doctor exit 0 — Budget: 1/2.
- **R-003** [critical] A integração nova possui versão distinta da release anterior — Verdict: refuted — Confidence: high — Evidence: commits `9afffa0` e `d51bd2d` e manifests locais ainda em 0.5.0 — Budget: 1/2.

#### Fontes e contexto consultados

- `package.json`, `project.json`, manifests Codex, Claude Code e Hermes.
- Implementação e ajuda local do CLI Hermes.
- Pedido confirmado: “não é pra usar symlink nós instalamos o plugin no hermes”.

#### Documentação consultada

- Skill local `hermes-agent`, referência `references/cli-reference.md`.
- `.specsfy/Spec.md` e fontes persistentes do projeto.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo; toda evidência é reproduzível por fontes e comandos locais.

#### Dúvidas respondidas

- **Q**: O plugin Hermes deve usar symlink? → **A**: Não; instalação gerenciada em cada perfil.
- **Q**: Qual release representa Hermes + HTML-first após 0.5.0? → **A**: 0.6.0, por adicionar funcionalidades compatíveis.
- **Q**: A publicação em `main` está autorizada? → **A**: Sim; o usuário respondeu “bora” à opção recomendada de preparar, validar, instalar e publicar a v0.6.0.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Bump coordenado para v0.6.0 nos manifests, estado do projeto e validação.
- Contrato Hermes exclusivamente gerenciado, sem symlink.
- Instalação e atualização por reinstalação aprovada com `--force --enable`.
- Teste isolado em `HERMES_HOME`, atualização da instalação ativa, commit e push em `main`.

#### Fora de escopo

- Alterações de Brand Packs, identidade de clientes ou estado privado.
- Mudanças no comportamento visual, HTML-first ou PDF opt-in.
- Tag Git/GitHub Release, não usada nas releases anteriores deste repositório.
- Instalação em perfis Hermes de terceiros sem acesso ao host.

#### Atores

- **Time da Checkgrow**: instala e atualiza o plugin publicado.
- **Maintainer smartscaile.**: publica a release e aprova a fonte comunitária interna.
- **Hermes Agent**: instala, valida e carrega as skills portáteis.

### 4. Princípios e restrições do projeto

- **PR-001**: A instalação Hermes deve ser gerenciada e profile-scoped; symlink não é suportado pelo Brand Runtime.
- **PR-002**: O runtime universal não inclui identidade, regras, assets ou segredos de clientes.
- **PR-003**: Brand Packs e estado do projeto consumidor não podem ser alterados durante atualização do Runtime.
- **PR-004**: HTML permanece entrega padrão e PDF continua opt-in explícito.

### 5. Histórias de usuário

#### US-001 — Atualizar o Brand Runtime no Hermes (P1)

Como integrante do time da Checkgrow, quero instalar ou atualizar uma release identificável do Brand Runtime no Hermes, para receber `brand` e `presentation` sem symlink e confirmar objetivamente a versão em uso.

**Por que P1**: o onboarding atual é bloqueado e a versão 0.5.0 não distingue o novo código da release anterior.
**Teste independente**: instalar e reinstalar o repositório público em `HERMES_HOME` temporário, executar Plugin Doctor e carregar as duas skills.
**Requisitos**: FR-001, FR-002, NFR-001

### 6. Cenários BDD de aceite

#### AC-001 — Release v0.6.0 consistente

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-001
Feature: release identificável

  Scenario: manifests e estado declaram a mesma versão
    Given que 0.5.0 já identifica a release anterior
    When a release Hermes e HTML-first é publicada
    Then package, manifests, estado, documentação e validação declaram 0.6.0 de forma consistente
```

#### AC-002 — Instalação e atualização gerenciadas

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-002
Feature: plugin gerenciado no Hermes

  Scenario: instalar e reinstalar a fonte aprovada
    Given um HERMES_HOME limpo ou uma instalação gerenciada anterior
    When o operador executa o comando aprovado com --force --enable
    Then o plugin é um diretório regular habilitado e Plugin Doctor reconhece brand-runtime 0.6.0
```

#### AC-003 — Ausência de symlink e carregamento das skills

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-003
Feature: distribuição portátil sem fonte paralela

  Scenario: carregar as duas skills da instalação gerenciada
    Given o Brand Runtime 0.6.0 instalado pelo Hermes
    When um processo Hermes novo descobre plugins e skills
    Then brand e presentation são carregáveis sob namespace portátil
    And nenhuma documentação ou contrato recomenda symlink
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O pacote deve publicar Brand Runtime 0.6.0 com versões consistentes em package, lockfile, manifests Codex/Claude/Hermes, estado do projeto e validador.
- **FR-002**: O fluxo Hermes deve instalar e atualizar somente como plugin gerenciado por `hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable`, seguido por doctor/show e nova sessão.

#### Não funcionais

- **NFR-001**: A release deve preservar segurança e compatibilidade multi-runtime. **Verificação**: `npm run check`, Plugin Doctor, instalação/reinstalação isolada, descoberta real das duas skills, varredura de segredos e revisão independente.

#### Erros e casos-limite

- Instalação sem `--force` bloqueada pelo scanner comunitário → documentação explica a fonte aprovada e usa o comando executável.
- Diretório instalado como symlink → não é configuração suportada; reinstalar de forma gerenciada sem apagar o alvo externo.
- Reinstalação falha → não declarar atualização concluída; ler estado instalado antes de prosseguir.
- Sessão antiga → solicitar nova sessão antes de afirmar que o índice atualizado foi carregado.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Node.js ESM, test runner nativo, três manifests de runtime e validador próprio.
- Hermes instala subdiretório GitHub sem `.git`; por isso `plugins update` não atende e a atualização usa reinstalação com `--force`.

#### Arquitetura e módulos

- `scripts/validate-hermes-plugin.mjs`: fecha versão e contrato gerenciado.
- `tests/hermes-plugin-integration.test.mjs`: cobre o contrato portátil e o discovery.
- `tests/spec-0002/hermes-managed-release.test.mjs`: isola consistência 0.6.0, comandos gerenciados e ausência de orientação linkada.
- Manifests e estado: promovidos em conjunto para 0.6.0.
- READMEs e `runtime-update.json`: onboarding e atualização executáveis.

#### Migrations

- Não aplicável.

#### Models

- Manifest Agent Plugins v1 e contrato JSON de atualização permanecem compatíveis.

#### Controllers e casos de uso

- Não aplicável.

#### Views e experiência

- Não aplicável.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
plugins/brand-runtime/plugin.json
plugins/brand-runtime/.codex-plugin/plugin.json
plugins/brand-runtime/.claude-plugin/plugin.json
plugins/brand-runtime/skills/brand/references/runtime-update.json
scripts/validate-hermes-plugin.mjs
tests/hermes-plugin-integration.test.mjs
tests/spec-0002/hermes-managed-release.test.mjs
README.md
PROJECT.md
project.json
package.json
package-lock.json
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Release do Runtime | versão semântica | 0.6.0 consistente entre fontes | Publicada pelo repositório e consumida pelos runtimes |
| Instalação Hermes | perfil + nome do plugin | diretório regular, enabled, portable | Contém as duas skills do pacote publicado |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Release | 0.5.0 ambígua | Publicação validada | 0.6.0 | Todos os manifests concordam |
| Plugin Hermes | gerenciado 0.5.0 | Reinstalação aprovada | gerenciado 0.6.0 | Sem symlink; skills carregáveis |

#### Migração e retenção

- Reinstalação do Runtime não altera Brand Packs, configuração de brand root ou conhecimento de projetos.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega altera CLI, manifest e documentação, sem tela de produto.

#### Stack e convenções de interface

- Não aplicável.

#### Telas e responsabilidades

- Não aplicável.

#### Fluxo de informação e navegação

- Não aplicável.

#### Menus e navegação principal

- Não aplicável.

#### Formulários e ações

- Não aplicável.

#### Composição e disposição

- Não aplicável.

#### Blocos React e componentes selecionados

- Não aplicável.

#### Estados e acessibilidade

- Saída CLI textual deve informar versão e falhas; demais itens não se aplicam.

#### APIs expostas

- Nenhuma.

#### APIs externas utilizadas

- GitHub via instalador nativo do Hermes; autenticação e retry pertencem ao host.

#### Documentação das APIs consultadas

- Ajuda local `hermes plugins install --help` e implementação instalada do Hermes.

#### Eventos e outros contratos

- Agent Plugins v1: `plugin.json` raiz e `skills/*/SKILL.md`.

### 11. Estratégia TDD

- **Unidade**: consistência da versão e validação do contrato gerenciado.
- **Integração/contrato**: README, runtime-update e manifests.
- **BDD/aceite**: AC-001 a AC-003 orientam os casos `SPECSFY:` no teste Hermes.
- **Runner TDD**: test runner nativo do Node.js já adotado pelo projeto.
- **E2E**: instalação e reinstalação reais em `HERMES_HOME` temporário, seguidas por Plugin Doctor e discovery.
- **Verificação manual**: nenhuma.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, NFR-001, AC-001 | AC-001 | `SPECSFY: AC-001 US-001 FR-001 FR-002 NFR-001 requires Brand Runtime v0.6.0 across release metadata` | Exit 1: `package.json` retornou 0.5.0 em vez de 0.6.0 | 3/3 focal e `npm run validate` exit 0 | Metadado Codex preserva timestamp variável com base 0.6.0 |
| US-001, FR-001, FR-002, NFR-001, AC-002 | AC-002 | `SPECSFY: AC-002 US-001 FR-001 FR-002 NFR-001 requires the executable managed Hermes install and update command` | Exit 1: seção Install in Hermes não continha `--force --enable` | 3/3 focal e `npm run validate` exit 0 | Seções Install e Update são inspecionadas separadamente |
| US-001, FR-001, FR-002, NFR-001, AC-003 | AC-003 | `SPECSFY: AC-003 US-001 FR-001 FR-002 NFR-001 forbids Hermes symlink installation guidance` | Exit 1: `linkedSource` ainda existia no contrato | 3/3 focal e `npm run validate` exit 0 | Proteções de symlink do Presentation Runtime permanecem fora deste contrato |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Contrato | `node --test tests/spec-0002/hermes-managed-release.test.mjs` | 3/3 |
| FR-001 | AC-002 | Integração | instalação em `HERMES_HOME` temporário | Exit 0, diretório regular 0.6.0 |
| FR-001 | AC-003 | Integração | discovery/skill_view em processo novo | 2/2 skills carregadas |
| FR-002 | AC-001 | Contrato | `npm run validate` | Exit 0 |
| FR-002 | AC-002 | Contrato/E2E | teste focal + reinstalação real | 7/7 e reinstall exit 0 |
| FR-002 | AC-003 | Contrato | busca de orientação de symlink | READMEs/contrato sem orientação linkada |
| NFR-001 | AC-001 | Regressão | `npm run check` | 52/52 |
| NFR-001 | AC-002 | Segurança | Plugin Doctor e varredura estática | Doctor 0; 0 achados; 0 resíduos |
| NFR-001 | AC-003 | Revisão | revisão independente fail-closed | `passed: true`, zero blockers |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0002-release-v060-hermes-gerenciado/spec.md`
- **Achados**: Spec nova estruturalmente válida; ator, resultado, três ACs, requisitos, limites e autorização de publicação estão definidos sem lacunas.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/draft/0002-release-v060-hermes-gerenciado/spec.md`
- **Achados**: Três REDs válidos observados e sete tarefas rastreáveis cobrem implementação, regressão, instalação ativa e publicação.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0002-release-v060-hermes-gerenciado/spec.md tests/spec-0002 --full-chain`
- **Achados**: Pending.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Criar RED de versão 0.6.0 em `tests/spec-0002/hermes-managed-release.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Confirmar baseline 0.5.0 e fontes versionadas.
  - [x] **EXECUTE**: Escrever caso `SPECSFY:` para consistência 0.6.0.
  - [x] **VERIFY**: Observar RED por versão antiga.
  - [x] **EVIDENCE**: `node --test --test-name-pattern='SPECSFY: AC-001' tests/spec-0002/hermes-managed-release.test.mjs` saiu 1 por 0.5.0 !== 0.6.0.
  - [x] **IMPROVE**: O metadado Codex aceita timestamp variável, mas exige base 0.6.0.

- [x] T002 [TEST] [TDD] [US-001] Criar RED do comando gerenciado executável em `tests/spec-0002/hermes-managed-release.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Preservar evidência da instalação sem `--force` bloqueada.
  - [x] **EXECUTE**: Exigir instalação/update com `--force --enable` e doctor/show.
  - [x] **VERIFY**: Observar RED na documentação atual.
  - [x] **EVIDENCE**: `node --test --test-name-pattern='SPECSFY: AC-002' tests/spec-0002/hermes-managed-release.test.mjs` saiu 1 porque Install in Hermes usava somente `--enable`.
  - [x] **IMPROVE**: O helper limita cada asserção à seção Markdown correta e não atravessa headings.

- [x] T003 [TEST] [TDD] [US-001] Criar RED que proíbe symlink Hermes em contrato e READMEs em `tests/spec-0002/hermes-managed-release.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Localizar toda orientação Hermes de symlink.
  - [x] **EXECUTE**: Exigir contrato exclusivamente gerenciado.
  - [x] **VERIFY**: Observar RED por linkedSource/texto legado.
  - [x] **EVIDENCE**: `node --test --test-name-pattern='SPECSFY: AC-003' tests/spec-0002/hermes-managed-release.test.mjs` saiu 1 mostrando o objeto linkedSource existente.
  - [x] **IMPROVE**: A busca fica limitada à integração Hermes e não afeta as proteções de symlink do Presentation Runtime.

#### Fase 2 — Implementação da release

- [x] T004 [CODE] [US-001] Promover metadados e validação para 0.6.0 a partir de `package.json` — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: T001, T002, T003
  - [x] **PREP**: Inventariar package, lockfile, manifests, projeto e docs.
  - [x] **EXECUTE**: Atualizar somente metadados canônicos da release.
  - [x] **VERIFY**: Executar teste focal e `npm run validate`.
  - [x] **EVIDENCE**: Focal da SPEC-0002 3/3 e `npm run validate` exit 0 com Brand Runtime 0.6.0.
  - [x] **IMPROVE**: O validador cruza as bases Codex, Claude e Hermes com package.json.
  <!-- specsfy:evidence {"task":"T004","refs":["US-001","FR-001","NFR-001","AC-001"],"files":["package.json","package-lock.json","plugins/brand-runtime/plugin.json","plugins/brand-runtime/.codex-plugin/plugin.json","plugins/brand-runtime/.claude-plugin/plugin.json","project.json","PROJECT.md","scripts/validate-repository.mjs","tests/spec-0002/hermes-managed-release.test.mjs"],"commands":[{"run":"node --test tests/spec-0002/hermes-managed-release.test.mjs","exit":0},{"run":"npm run validate","exit":0}]} -->

- [x] T005 [CODE] [US-001] Tornar onboarding e atualização Hermes exclusivamente gerenciados em `plugins/brand-runtime/skills/brand/references/runtime-update.json` — Refs: US-001, FR-002, NFR-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar comportamento real do scanner e do instalador.
  - [x] **EXECUTE**: Atualizar runtime-update, validador e READMEs; remover linkedSource.
  - [x] **VERIFY**: Executar teste focal GREEN.
  - [x] **EVIDENCE**: Contrato sem linkedSource; Install/Update usam `--force --enable`; focal da SPEC-0002 3/3.
  - [x] **IMPROVE**: READMEs limitam `--force` à fonte Smartscaile aprovada e alertam contra fontes não confiáveis.
  <!-- specsfy:evidence {"task":"T005","refs":["US-001","FR-002","NFR-001","AC-002","AC-003"],"files":["README.md","plugins/brand-runtime/README.md","plugins/brand-runtime/skills/brand/references/runtime-update.json","scripts/validate-hermes-plugin.mjs","tests/hermes-plugin-integration.test.mjs","tests/spec-0002/hermes-managed-release.test.mjs"],"commands":[{"run":"node --test tests/spec-0002/hermes-managed-release.test.mjs","exit":0},{"run":"npm run validate","exit":0}]} -->

#### Fase final — Qualidade e publicação

- [x] T006 [DOC] Executar regressão, documentação, E2E e segurança com `tests/spec-0002/hermes-managed-release.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003 — Depends: T004, T005
  - [x] **PREP**: Suíte, monitor, Plugin Doctor, segurança e ambiente Git/HERMES_HOME isolado confirmados.
  - [x] **EXECUTE**: Check, documentação, instalação/reinstalação e discovery executados.
  - [x] **VERIFY**: 0.6.0, diretório regular, duas skills, 52/52, rastreabilidade 7/7 e zero resíduos confirmados.
  - [x] **EVIDENCE**: `deleg_cd7ef142` retornou `passed: true`, sem security_concerns, logic_errors ou suggestions.
  - [x] **IMPROVE**: Expectativas históricas de 0.5.0 agora derivam a versão do manifest canônico; reviewer fail-closed despachado.
  <!-- specsfy:evidence {"task":"T006","refs":["US-001","FR-001","FR-002","NFR-001","AC-001","AC-002","AC-003"],"files":["package.json","tests/hermes-plugin-integration.test.mjs","tests/spec-0002/hermes-managed-release.test.mjs","specs/in-progress/0002-release-v060-hermes-gerenciado/spec.md"],"commands":[{"run":"npm run check","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0002-release-v060-hermes-gerenciado/spec.md tests/spec-0002 --full-chain","exit":0},{"run":"hermes plugins doctor plugins/brand-runtime --ci","exit":0}],"review":"deleg_cd7ef142: passed=true; security_concerns=[]; logic_errors=[]"} -->

- [ ] T007 [CODE] Instalar v0.6.0 no Hermes ativo, criar commit de `package.json` e publicar `main` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003 — Depends: T006
  - [ ] **PREP**: Confirmar revisão aprovada e working tree restrito.
  - [ ] **EXECUTE**: Commitar, publicar e reinstalar da fonte remota.
  - [ ] **VERIFY**: Ler `origin/main`, plugin ativo e skill discovery após publicação.
  - [ ] **EVIDENCE**: Registrar commit, versão instalada e verificação remota.
  - [ ] **IMPROVE**: Registrar ausência de tag conforme convenção atual ou criar tarefa futura.

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003 → T004/T005 → T006 → T007.
- Tarefas paralelas: T001, T002 e T003 podem compartilhar um único arquivo, mas são executadas em ciclos RED separados.
- Estratégia de MVP: release 0.6.0 instalável e atualizável por Hermes gerenciado, com duas skills carregáveis.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Repositório público `https://github.com/smartscaile/brand-runtime`.
- CLI Hermes com Portable Agent Plugins v1.

#### Riscos

- `--force` também supera o scanner comunitário → limitar o comando à fonte interna aprovada, executar Plugin Doctor e revisão de segurança antes da publicação.
- Push concorrente em `main` → conferir `origin/main` imediatamente antes de publicar e não reescrever histórico.
- Índice de skills em cache → iniciar nova sessão/processo para verificar a release.

#### Suposições

- 0.6.0 é o bump SemVer adequado para funcionalidades compatíveis novas.
- A convenção atual publica no `main` sem tag Git obrigatória.

### 17. Decisões

- **DEC-001**: Publicar v0.6.0 em vez de reutilizar 0.5.0 — a release anterior já usava 0.5.0 e o novo código precisa ser identificável.
- **DEC-002**: Suportar somente instalação Hermes gerenciada — decisão explícita do usuário e isolamento por perfil.
- **DEC-003**: Atualizar via reinstalação `--force --enable` — o pacote instalado de subdiretório não contém `.git`, portanto `plugins update` não é executável.
- **DEC-004**: Não criar tag nesta fatia — o histórico atual não usa tags; publicação em `main` preserva a convenção observada.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
- [ ] Plugin ativo e remoto declaram 0.6.0 após publicação.
