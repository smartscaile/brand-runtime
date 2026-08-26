# Especificação integrada: Contrato v1 e diagnósticos de qualidade para apresentações

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0001 |
| Slug | 0001-contrato-v1-diagnosticos-apresentacoes |
| Status | Complete |
| Effort | 7 |
| Effort updated at | 2026-08-26 |
| Effort rationale | Mudança transversal no scaffold, contratos, inspeção de browser, relatórios, compatibilidade legada e documentação; a atualização HTML-first reabre export, viewer e testes sem dependência externa nova. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim — a atualização HTML-first altera a ação de PDF no viewer: sem PDF empacotado, o controle abre o diálogo nativo de impressão/salvamento. |
| Atualizada em | 2026-08-26 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O Runtime atual consegue aprovar integridade técnica de HTML e PDF com um estado genérico `passed`, mesmo quando o deck continua sem contrato composicional, repetitivo, sem aprovação visual ou sem freeze. Como slides não declaram papel narrativo nem família, o sistema também não consegue produzir diagnósticos objetivos de monotonia sem inferir intenção a partir de classes CSS. Além disso, `export` exige gerar PDF mesmo quando o autor quer entregar somente o HTML e produzir o PDF manualmente no viewer.

#### Resultado desejado

Novos scaffolds devem carregar contratos v1 project-local, cada slide deve declarar identidade operacional, papel narrativo e família, e o Runtime deve separar QA técnico, diagnóstico sistêmico, aprovação de conteúdo, aprovação visual e freeze. `export` deve produzir HTML standalone por padrão e gerar/embutir PDF somente quando `--pdf` for informado explicitamente. Decks legados continuam operacionais, mas permanecem explicitamente `legacy-unverified`.

#### Métricas de sucesso

- 100% dos slides de um scaffold v1 possuem correspondência ordenada entre HTML e `presentation.spec.json`.
- 100% dos findings v1 informam regra, severidade, slides e evidência mensurável, sem score de beleza.
- Nenhum relatório v1 usa `passed` como sinônimo de entrega visualmente aprovada.
- 100% dos testes existentes de exportação legada continuam passando.
- 100% das exportações sem `--pdf` produzem HTML standalone sem chamar `Page.printToPDF` nem criar arquivo PDF.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [non-critical] Heurísticas do taste-skill podem ser adaptadas sem instalar o projeto — Verdict: verified — Confidence: high — Evidence: research/taste-skill-audit.md#conclusão-aplicada — Budget: 1/2.
- A auditoria do Runtime existente confirmou que o QA técnico é determinístico, mas não possui contrato de família nem estados independentes de aprovação.

#### Fontes e contexto consultados

- `specs/backlog/0002-contrato-v1-diagnosticos-apresentacoes.md` — brief promovido.
- `specs/backlog/0001-sistema-de-qualidade-visual-para-apresentacoes.md` — épico pai.
- `plugins/brand-runtime/skills/presentation/SKILL.md` e referências da skill.
- `plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs`.
- `plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html`.
- `tests/presentation-runtime.test.mjs`.
- `DESIGNSYSTEM.MD` e `INTERFACE.md`.

#### Documentação consultada

- Taste Skill, snapshot `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`, https://github.com/Leonxlnx/taste-skill, heurísticas de preflight e refinamento.
- Node.js `node:test`, versão fornecida pelo ambiente do projeto, para manter o runner existente.

#### Artefatos de pesquisa armazenados

- `research/taste-skill-audit.md`: metadados, snapshot, licença MIT e impacto da auditoria externa; nenhum texto externo foi copiado.

#### Dúvidas respondidas

- **Q**: O taste-skill deve ser instalado como dependência? → **A**: Não; apenas heurísticas explicáveis serão adaptadas.
- **Q**: Diagnóstico automático pode aprovar qualidade visual? → **A**: Não; aprovação visual e freeze continuam humanos.
- **Q**: O contrato quebra decks existentes? → **A**: Não; ausência de spec ativa compatibilidade `legacy-unverified`.
- **Q**: Famílias devem ser um catálogo universal? → **A**: Não; são identificadores project-local com significado registrado na spec da apresentação.
- **Q**: O Runtime deve gerar PDF em toda exportação? → **A**: Não; HTML standalone é o padrão e `--pdf` é opt-in explícito. Sem PDF empacotado, o autor usa o diálogo nativo do viewer para salvar o PDF.

#### Dúvidas abertas

- Nenhuma lacuna aplicável a esta fatia.

### 3. Escopo e atores

#### Incluído

- Schemas JSON v1 para spec e aprovações da apresentação.
- Templates project-local gerados pelo scaffold.
- Metadados `data-slide-id`, `data-slide-job` e `data-slide-family` no HTML.
- Validação de schema, paridade, ordem e unicidade.
- Diagnósticos `consecutive-family-overuse` e `eyebrow-saturation` com política explícita.
- Estados independentes e `deliveryState` derivado.
- Descoberta automática de contratos irmãos do HTML e opções explícitas de caminho.
- Exportação HTML-first; geração, inspeção e embedding de PDF somente com `--pdf` explícito.
- Fallback do controle de PDF para `window.print()` quando o HTML não contém payload PDF validado.
- Compatibilidade legada, testes, documentação da skill e projeções técnicas.

#### Fora de escopo

- Score de beleza, modelo de visão ou aprovação estética automática.
- Golden decks, geração de imagens e comparação perceptual.
- Adapters `DESIGN.md`, Tailwind, CSS Variables ou DTCG.
- Catálogo universal de layouts ou presets `minimalist`, `soft`, `premium` ou `Awwwards`.
- Comando interativo para coletar aprovações humanas.
- Migração ou reescrita automática de decks legados.

#### Atores

- **Autor da apresentação**: cria e refina o deck, declara papel e família e ajusta política local antes da produção.
- **Aprovador humano**: aprova conteúdo, direção visual e freeze com ator, instante, escopo, evidência e hashes aplicáveis.
- **Presentation Runtime**: valida entradas, inspeciona o render, produz findings e deriva estados sem reivindicar julgamento estético.
- **Destinatário**: recebe somente a entrega cujo estado e evidências correspondem ao nível de aprovação declarado.

### 4. Princípios e restrições do projeto

- **PR-001**: Brand Pack, regras ativas e direção local continuam sendo as autoridades; o contrato de apresentação não define identidade.
- **PR-002**: Invariantes estruturais podem bloquear, heurísticas produzem findings explicáveis e julgamento visual permanece humano.
- **PR-003**: `presentation.spec.json` e `presentation.approvals.json` são fontes project-local; `qa-report.json` é projeção gerada.
- **PR-004**: O Runtime opera offline e deterministicamente com Node.js e dependências já existentes.
- **PR-005**: Codex e Claude Code consomem os mesmos arquivos e estados.
- **PR-006**: Deck legado não recebe equivalência silenciosa ao contrato v1.
- **PR-007**: Timestamps de execução não participam de findings, estados normativos ou bytes exportados; metadados variáveis do PDF são normalizados antes de hash e embedding.
- **PR-008**: HTML standalone é o artefato padrão. PDF é derivado opcional e nunca é gerado implicitamente pelo Runtime.

### 5. Histórias de usuário

#### US-001 — Governar a qualidade sistêmica de um deck (P1)

Como autor ou aprovador de apresentações, quero contratos e estados verificáveis para cada deck, para detectar repetição antes da entrega e distinguir integridade técnica de aprovação visual humana.

**Por que P1**: apresentações são a principal superfície de uso e o estado atual permite falso positivo de qualidade final.
**Teste independente**: executar scaffold, validar um deck contratual, provocar cada finding, executar um deck legado e inspecionar os estados JSON emitidos.
**Requisitos**: FR-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003

### 6. Cenários BDD de aceite

#### AC-001 — Scaffold contratual coerente

**Cobre**: US-001, FR-001, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-002 @NFR-003 @AC-001
Feature: Contrato de apresentação v1

  Scenario: Criar um scaffold novo
    Given um diretório vazio e um título de apresentação
    When o autor executa o comando scaffold
    Then HTML, presentation.spec.json e presentation.approvals.json são criados
    And os slides aparecem na mesma ordem e com os mesmos metadados nos contratos e no HTML
```

#### AC-002 — Contrato divergente bloqueado

**Cobre**: US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-003 @NFR-001 @NFR-002 @NFR-003 @AC-002
Feature: Paridade contratual

  Scenario: HTML contradiz a spec
    Given uma apresentação v1 cujo HTML omite ou altera id, papel ou família de um slide
    When o Runtime avalia o gate sistêmico
    Then o gate falha com finding localizado e evidência do valor esperado e observado
    And a entrega permanece bloqueada
```

#### AC-003 — Sequência excessiva da mesma família

**Cobre**: US-001, FR-001, FR-002, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @NFR-002 @NFR-003 @AC-003
Feature: Diagnóstico de ritmo composicional

  Scenario: Três slides consecutivos excedem limite dois
    Given uma spec com maxConsecutiveFamily igual a 2
    And três slides consecutivos da mesma família
    When o Runtime avalia a política v1
    Then consecutive-family-overuse aponta os três ids, a contagem e o limite
    And o gate sistêmico falha sem emitir score de beleza
```

#### AC-004 — Saturação de eyebrow

**Cobre**: US-001, FR-002, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-002 @NFR-001 @NFR-002 @NFR-003 @AC-004
Feature: Diagnóstico de recursos recorrentes

  Scenario: Proporção de eyebrow excede a política local
    Given um limite maxEyebrowRatio explícito na spec
    And o render possui eyebrow em uma proporção maior de slides
    When o Runtime avalia a política v1
    Then eyebrow-saturation informa quantidade, total, proporção observada e limite
    And o gate sistêmico falha de forma explicável
```

#### AC-005 — Aprovações separadas do QA

**Cobre**: US-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @NFR-003 @AC-005
Feature: Ciclo de entrega governado

  Scenario: QA aprovado sem freeze
    Given QA técnico e diagnóstico sistêmico aprovados
    And conteúdo e visual aprovados por humanos
    But freeze permanece pendente
    When o Runtime deriva deliveryState
    Then o estado é awaiting-freeze
    And nenhum campo genérico declara a entrega como final
```

#### AC-006 — Compatibilidade legada explícita

**Cobre**: US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-003 @NFR-001 @NFR-002 @NFR-003 @AC-006
Feature: Compatibilidade sem falso selo

  Scenario: Exportar deck sem contratos v1
    Given um HTML legado válido sem presentation.spec.json
    When o Runtime executa QA ou exportação
    Then o fluxo técnico continua compatível
    And compatibilityMode é legacy-unverified
    And deliveryState não é frozen nem final
```

#### AC-007 — Exportação HTML-first com PDF opt-in

**Cobre**: US-001, FR-003, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @FR-003 @NFR-001 @NFR-002 @NFR-003 @AC-007
Feature: Escolha explícita do artefato derivado

  Scenario: Exportar somente HTML por padrão
    Given uma apresentação pronta para QA técnico de browser
    When o autor executa export com --html e sem --pdf
    Then o Runtime produz HTML standalone sem chamar Page.printToPDF nem criar PDF
    And o relatório não declara caminho ou hash de PDF
    And o controle de PDF abre o diálogo nativo de impressão e salvamento

  Scenario: Gerar PDF somente quando solicitado
    Given a mesma apresentação pronta
    When o autor executa export com --html e --pdf explícito
    Then o Runtime preserva a geração, inspeção, embedding e hashes determinísticos do PDF
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O Runtime deve criar, descobrir e validar os contratos v1 e verificar unicidade, ordem e paridade de id, papel e família para cada slide.
- **FR-002**: O Runtime deve aplicar limites explícitos de repetição consecutiva de família e proporção de eyebrow, emitindo findings estruturados sem score agregado de beleza.
- **FR-003**: O Runtime deve separar QA técnico, diagnóstico sistêmico, conteúdo, visual e freeze, derivar `deliveryState`, preservar decks sem spec em `legacy-unverified` e exportar HTML standalone por padrão, tornando geração e embedding de PDF opt-in por `--pdf` explícito.

#### Não funcionais

- **NFR-001**: Entradas idênticas devem produzir os mesmos findings e estados normativos, sem rede e em tempo linear no número de slides. **Verificação**: executar o mesmo fixture duas vezes, comparar a projeção normativa e revisar ausência de I/O de rede na avaliação.
- **NFR-002**: Schemas, templates, código e documentação não devem incorporar identidade, assets ou preferências de cliente. **Verificação**: validação do repositório e busca por termos de clientes conhecidos nos artefatos novos.
- **NFR-003**: Decks legados tecnicamente válidos devem manter exportação e QA sem migração automática, mas o relatório deve declarar a ausência do contrato. **Verificação**: suite de regressão com fixture sem spec.

#### Erros e casos-limite

- JSON inválido ou schema incompatível → gate sistêmico bloqueado com caminho e mensagem acionável.
- `briefStatus: draft` → finding `brief-not-ready`; o scaffold nasce editável, mas não é exportável como entrega contratual até o autor declarar `ready`.
- ID duplicado, slide ausente, ordem divergente ou metadado contraditório → finding `contract-mismatch` localizado.
- Política fora dos limites aceitos → contrato inválido, sem coerção silenciosa.
- Aprovação marcada como aprovada sem ator, instante, escopo ou evidência → estado de aprovação `invalid` e entrega bloqueada.
- Hash aprovado diferente do artefato atual → freeze `invalidated`.
- Arquivo irmão de approvals ausente → conteúdo, visual e freeze permanecem `pending`; um caminho passado explicitamente por `--approvals` e inexistente é erro de entrada.
- HTML sem spec irmã e sem `--spec` → modo `legacy-unverified`, sem criar ou alterar arquivos do deck.
- Diretório de scaffold com qualquer um dos três arquivos existentes → falha sem `--force`; `--force` substitui o conjunto completo de forma intencional.
- Opção CLI desconhecida ou repetida → erro de entrada; arquivo de destino que seja symlink → rejeição mesmo com `--force`.
- Symlink criado no destino depois do preflight → promoção atômica substitui o link sem escrever no alvo externo.
- Falha de print, normalização, inspeção ou packaging sob `--force` → staging incompleto é removido e a entrega HTML/PDF válida anterior permanece byte a byte inalterada.
- `export` sem `--pdf` → produz somente HTML standalone e QA de browser; nenhuma ferramenta PDF é chamada e nenhum campo PDF aparece no relatório.
- `export` com `--pdf` → preserva o pipeline determinístico de PDF, Poppler, embedding, hashes e rollback transacional existente.
- Falha de QA técnico → `deliveryState: blocked`, inclusive em modo legado; somente legado sem falha técnica permanece `legacy-unverified`.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Runtime ESM em Node.js, sem dependências de produção, usando `node:fs`, Chrome DevTools Protocol e Poppler.
- Runner `node:test` em `tests/presentation-runtime.test.mjs`.
- O scaffold gera apenas `presentation.html`; QA e export produzem `qa-report.json` com `status: passed`.
- O browser inspection já percorre `.slide`, mede overflow, efeitos e assets remotos.

#### Arquitetura e módulos

- Contratos JSON Schema estáveis em `plugins/brand-runtime/skills/presentation/references/contracts/` documentam formatos públicos v1.
- Templates editáveis em `plugins/brand-runtime/skills/presentation/assets/html-starter/` alimentam o scaffold sem introduzir identidade.
- `presentation-runtime.mjs` descobre `presentation.spec.json` e `presentation.approvals.json` ao lado do HTML, com override por `--spec` e `--approvals`.
- A inspeção de browser passa a retornar metadados de slide e presença semântica de eyebrow.
- Um avaliador puro valida contratos, aplica política e deriva estados; QA e export apenas combinam esse resultado com evidência técnica.
- O relatório mantém caminhos e hashes técnicos, mas substitui o estado genérico por `technicalQa`, `systemDiagnostics`, `approvals`, `freeze`, `compatibilityMode` e `deliveryState`.
- `export` sempre empacota o HTML standalone; somente a presença explícita de `--pdf` ativa `Page.printToPDF`, Poppler, embedding e hashes PDF.
- HTML-only preserva `technicalQa: not-run` e `deliveryState: awaiting-technical-qa`, pois o PDF manual ainda não foi submetido ao QA completo.

#### Migrations

- Não aplicável. Decks existentes não são reescritos; ausência de contratos ativa o seam de compatibilidade.

#### Models

- **PresentationSpecV1**: schema, título, estado do brief, política e slides ordenados.
- **PresentationApprovalV1**: conteúdo, visual e freeze com status e evidência humana.
- **SlideContractV1**: id único, papel narrativo permitido e família project-local não vazia.
- **QualityFindingV1**: regra, severidade, slides, mensagem e evidência.
- **PresentationQualityStateV1**: compatibilidade, gates independentes e estado derivado.

#### Controllers e casos de uso

- `scaffold`: gera os três arquivos como uma unidade e preserva proteção contra overwrite.
- `quality`: abre o HTML, valida contratos e metadados, aplica a política e emite o estado sistêmico antes de qualquer PDF; `technicalQa` permanece `not-run`.
- `qa`: valida contrato quando presente, executa QA de browser e PDF e escreve estado de revisão.
- `export`: valida contrato quando presente e produz HTML standalone; com `--pdf` explícito, também produz PDF, executa Poppler, embute o payload, verifica hashes e escreve o estado técnico completo.
- Não será criado comando de aprovação humana nesta fatia.

#### Views e experiência

- Previous, Next, teclado e contagem permanecem iguais.
- O controle de PDF baixa bytes embutidos quando `--pdf` foi solicitado; no HTML-only, o mesmo controle abre `window.print()` para o autor salvar o PDF manualmente.

#### Queries e repositórios

- Não aplicável. Arquivos locais são lidos diretamente e não há persistência externa.

#### Jobs e processamento assíncrono

- Não aplicável. Browser e ferramentas PDF continuam síncronos do ponto de vista do comando.

#### Estrutura de arquivos

```text
specs/completed/0001-contrato-v1-diagnosticos-apresentacoes/
  spec.md
  research/
    taste-skill-audit.md
plugins/brand-runtime/skills/presentation/
  SKILL.md
  assets/html-starter/
    presentation.html
    presentation.spec.json
    presentation.approvals.json
  assets/contracts/
    presentation-spec.v1.schema.json
    presentation-approvals.v1.schema.json
  references/
    quality-policy.md
  scripts/presentation-runtime.mjs
tests/presentation-runtime.test.mjs
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| PresentationSpecV1 | `schema` + arquivo do deck | título, briefStatus, qualityPolicy, slides ordenados | um para muitos SlideContractV1 |
| SlideContractV1 | `id` único no deck | job permitido, family não vazia | pertence a uma PresentationSpecV1 e corresponde a um `.slide` |
| PresentationApprovalsV1 | `schema` + arquivo do deck | content, visual e freeze; decisões humanas auditáveis | o registro de freeze referencia hashes da spec e dos artefatos |
| QualityFindingV1 | `rule` + slides + evidência | severity, message e evidence determinísticos | produzido da spec e inspeção |
| PresentationQualityStateV1 | execução do relatório | gates independentes, compatibilityMode e deliveryState | projeta contratos, inspeção e hashes |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| technicalQa | not-run | export HTML-only passa inspeção de browser | not-run | QA completo permanece pendente até um PDF manual ser validado |
| technicalQa | not-run | QA técnico com PDF passa | passed | PDF e render entram somente após checks existentes |
| technicalQa | not-run | QA técnico falha | failed | não produz selo final |
| systemDiagnostics | not-run | contrato e política passam | passed | findings bloqueantes vazios |
| systemDiagnostics | not-run | finding bloqueante | failed | finding possui evidência |
| systemDiagnostics | not-run | deck sem spec | legacy-unverified | não equivale a passed |
| contentApproval | pending | humano aprova registro válido | approved | ator, instante, escopo e evidência presentes |
| visualApproval | pending | humano aprova registro válido | approved | aprovação não é produzida pelo Runtime |
| freeze | pending | hashes atuais correspondem ao registro humano | frozen | QA e aprovações anteriores aprovados |
| freeze | frozen | hash normativo muda | invalidated | exige novo freeze humano |
| deliveryState | qualquer | gates são recomputados | blocked, legacy-unverified, awaiting-technical-qa, awaiting-content-approval, awaiting-visual-approval, awaiting-freeze ou frozen | nunca usa `final` |

A precedência de `deliveryState` é: contrato ou diagnóstico inválido, QA técnico `failed`, aprovação rejeitada/inválida ou freeze invalidado → `blocked`; modo legado sem falha técnica → `legacy-unverified`; QA técnico `not-run` → `awaiting-technical-qa`; conteúdo pendente → `awaiting-content-approval`; visual pendente → `awaiting-visual-approval`; freeze pendente → `awaiting-freeze`; somente o conjunto integral válido → `frozen`.

#### Migração e retenção

- Não há migração. Contratos vivem com a fonte do deck; relatórios permanecem no diretório de QA conforme fluxo atual.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. O viewer HTML mantém navegação e altera somente a ação do controle de PDF conforme a presença de payload embutido.

#### Stack e convenções de interface

- Não aplicável; HTML/CSS/JavaScript existentes são preservados sem nova biblioteca.

#### Telas e responsabilidades

- Não aplicável; nenhum novo viewer, tela ou painel é criado.

#### Fluxo de informação e navegação

- Previous, Next, teclado e contagem permanecem como hoje.
- O autor abre o HTML, revisa o deck e aciona `Save PDF`; sem payload embutido, o browser abre o diálogo nativo de impressão para salvar o PDF.

#### Menus e navegação principal

- Não há menu: o viewer é um arquivo HTML standalone sem navegação global. Seus únicos destinos são slide anterior, próximo slide e a ação `Save PDF`; o acesso ao viewer continua direto pelo arquivo gerado e pela CLI.

#### Formulários e ações

- Aprovações continuam como registros JSON sem formulário.
- `Save PDF` é um botão screen-only, acessível por teclado, que baixa o payload validado quando presente ou chama `window.print()` no modo HTML-only.

#### Composição e disposição

- A geometria 1280 × 720 e o comportamento de print permanecem inalterados; apenas metadados não visuais são adicionados aos slides.

#### Blocos React e componentes selecionados

- Não aplicável; o projeto não usa React, shadcn/ui ou ReUI nesta superfície.

#### Estados e acessibilidade

- Estados de QA são representados em JSON.
- O controle preserva foco e ativação nativos de `<button>`; seu rótulo não promete download direto quando o HTML não contém PDF.

#### APIs expostas

- CLI `scaffold`, `qa` e `export` mantém nomes; em `export`, `--html` e `--qa-dir` permanecem obrigatórios e `--pdf` passa a ser opt-in explícito. `quality --input <authoring.html>` executa o preflight rápido.
- `quality`, `qa` e `export` aceitam `--spec` e `--approvals` como overrides opcionais dos arquivos irmãos.
- `quality` sempre imprime o relatório JSON; retorna código 1 depois de imprimi-lo quando `systemDiagnostics` é `failed`, e código 0 para `passed` ou `legacy-unverified`.
- `qa` e `export` executam a mesma avaliação antes de qualquer PDF; em modo contratual, não produzem artefato de entrega quando o gate sistêmico falha. Aprovações pendentes não bloqueiam a geração de artefatos de revisão.
- `export --input <authoring.html> --html <shareable.html> --qa-dir <qa-dir>` é o caminho padrão e não usa ferramentas PDF.
- Acrescentar `--pdf <deck.pdf>` ativa explicitamente o pipeline PDF existente.
- Arquivos irmãos padrão: `presentation.spec.json` e `presentation.approvals.json`.
- Schemas públicos: `smartscaile.presentation-spec.v1` e `smartscaile.presentation-approvals.v1`.

#### APIs externas utilizadas

- Nenhuma nova. Chrome/Chromium e Poppler continuam dependências operacionais já existentes.

#### Documentação das APIs consultadas

- Não foi necessária consulta externa de API para a fatia; a implementação usa padrões já presentes no Runtime.

#### Eventos e outros contratos

- Papéis narrativos permitidos: `context`, `tension`, `proof`, `mechanism`, `comparison`, `decision`, `transition`, `close`.
- Política padrão do scaffold: `maxConsecutiveFamily: 2` e `maxEyebrowRatio: 0.5`; o valor é explícito e project-local.
- `family` aceita slug project-local não vazio e não carrega estética universal.
- `PresentationSpecV1` contém exatamente `schema`, `title`, `briefStatus`, `qualityPolicy` e `slides`; `briefStatus` aceita `draft` ou `ready`, `maxConsecutiveFamily` aceita inteiro de 1 a 10, `maxEyebrowRatio` aceita número de 0 a 1 e cada slide contém `id`, `job` e `family` em slug.
- `briefStatus: draft` é schema-válido para permitir autoria, mas produz o finding bloqueante `brief-not-ready` no gate sistêmico.
- `PresentationApprovalsV1` contém exatamente `schema`, `content`, `visual` e `freeze`. Conteúdo e visual aceitam `pending`, `approved`, `rejected` ou `invalidated`; quando diferentes de `pending`, exigem `actor`, `decidedAt` ISO-8601, `scope` e `evidence` não vazios.
- Freeze aceita `pending`, `frozen` ou `invalidated`; quando `frozen`, exige `actor`, `decidedAt`, `scope`, `evidence` e os hashes SHA-256 `htmlSha256`, `pdfSha256` e `specSha256`. O arquivo de approvals não referencia o próprio hash.
- O relatório inclui `reportSchema`, `compatibilityMode`, `technicalQa`, `systemDiagnostics`, `approvals`, `freeze`, `deliveryState`, `findings`, caminhos e hashes aplicáveis; quando o QA técnico falha, `technicalFindings` mantém as causas técnicas separadas dos diagnósticos sistêmicos. Ele não contém o campo genérico `status`.

### 11. Estratégia TDD

- **Unidade**: avaliação de paridade, repetição, eyebrow e estados por meio de comandos com fixtures reais.
- **Integração/contrato**: scaffold de três arquivos; descoberta automática; export HTML-only; QA/export PDF explícito; compatibilidade legada.
- **BDD/aceite**: AC-001 a AC-007 orientam testes TDD com marcadores `SPECSFY:` em `tests/presentation-runtime.test.mjs`.
- **Runner TDD**: `node:test`, materializado por `npm run test:tdd -- --test-name-pattern <padrão>`.
- **E2E**: exportação HTML-only real com Chrome; PDF opt-in com Chrome e Poppler para deck contratual e legado.
- **Verificação manual**: inspeção do schema e do relatório final; julgamento visual permanece fora da automação.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, NFR-002, NFR-003, AC-001 | AC-001 na seção 6 | `SPECSFY: AC-001` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-001' tests/presentation-runtime.test.mjs` → exit 1; `presentation.spec.json` ausente | `node --test --test-name-pattern='SPECSFY: AC-001\|scaffolds an identity-neutral' tests/presentation-runtime.test.mjs` → 2/2 passed | Templates JSON canônicos; runtime aplica somente título e cópia protegida |
| US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003, AC-002 | AC-002 na seção 6 | `SPECSFY: AC-002` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-002' tests/presentation-runtime.test.mjs` → exit 1; comando `quality` sem relatório JSON | Testes AC-002–AC-004 → 3/3 passed; mismatch inclui campo, esperado e observado | Avaliação pura separada de inspeção e escrita |
| US-001, FR-001, FR-002, NFR-001, NFR-002, NFR-003, AC-003 | AC-003 na seção 6 | `SPECSFY: AC-003` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-003' tests/presentation-runtime.test.mjs` → exit 1; comando `quality` sem relatório JSON | Testes AC-002–AC-004 → 3/3 passed; sequência reporta ids, família, contagem e limite | Nenhum score agregado foi introduzido |
| US-001, FR-002, NFR-001, NFR-002, NFR-003, AC-004 | AC-004 na seção 6 | `SPECSFY: AC-004` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-004' tests/presentation-runtime.test.mjs` → exit 1; comando `quality` sem finding de eyebrow | Testes AC-002–AC-004 → 3/3 passed; razão `0.666667` contra limite `0.5` | Eyebrow observado por papel explícito ou classe legada documentada |
| US-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-005 | AC-005 na seção 6 | `SPECSFY: AC-005` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-005' tests/presentation-runtime.test.mjs` → exit 1; export real ainda retorna `status: passed` | Export/QA → `awaiting-freeze`; hashes exatos → `frozen`; hash alterado → `invalidated` + exit 1 | Lifecycle e emissão de relatório compartilhados |
| US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003, AC-006 | AC-006 na seção 6 | `SPECSFY: AC-006` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-006' tests/presentation-runtime.test.mjs` → exit 1; legado ainda retorna `status: passed` | Export legado mantém PDF/payload e reporta `legacy-unverified` | Nenhum contrato é criado ou inferido para legado |
| US-001, FR-003, NFR-001, NFR-002, NFR-003, AC-007 | AC-007 na seção 6 | `SPECSFY: AC-007` em `tests/presentation-runtime.test.mjs` | `node --test --test-name-pattern='SPECSFY: AC-007' tests/presentation-runtime.test.mjs` → exit 1; `Presentation Runtime: --pdf is required` | Regressão focal → 5/5 passed; HTML-only não cria PDF e PDF explícito preserva payload validado | `packageShareableHtml` e `promoteOutputFiles` compartilhados sem duplicar containment/offline |
| US-001, FR-003, NFR-001, NFR-003, AC-007 | LE-001: relatório deve participar do commit | `preserves previous delivery when QA report publication is rejected` | Teste focal → exit 1; `delivery.html` anterior substituído antes de `qa-report.json` symlinkado ser recusado | Matriz focal → 5/5; report preflight + staging + promoção conjunta preservam entrega anterior | `promoteOutputFiles` suporta overwrite por entrada e rollback único |
| US-001, FR-003, NFR-001, NFR-003, AC-007 | LE-002: cleanup de Chrome deve ter deadline | `forces bounded cleanup when the Chrome launcher ignores SIGTERM` | Teste focal → exit 1 em 6,1 s; `ETIMEDOUT` porque `chrome.close()` não aguarda nem força exit | Regressão focal → 7/7; launcher resistente termina em ~1,96 s sem profile/processo rastreado | Grupo isolado, SIGTERM/SIGKILL limitado e `close()` idempotente/aguardável |
| US-001, FR-003, NFR-001, NFR-003, AC-007 | LE-003: destino de relatório incompatível não pode chegar ao commit | `rejects a non-file QA report destination before publishing delivery`; `rolls back a non-file QA report destination introduced after preflight` | Preflight RED → `ERR_FS_EISDIR` após promoção; race RED → exit 0, nova entrega e backup diretório residual | Preflight e race GREEN; matriz de rollback/symlink → 5/5 | Tipo é validado no preflight e na entrada já movida para backup; cleanup pós-commit é não fatal |
| US-001, FR-003, NFR-001, NFR-003, AC-007 | LE-004: startup DevTools deve obedecer deadline | `times out a stalled DevTools handshake and cleans up startup resources` | Teste focal → controlador externo `ETIMEDOUT` em ~5,06 s; launcher/profile persistiriam sem cleanup próprio | Teste permanente → ~1,85 s; revisão independente `/json`, WebSocket e CDP → 1,30–1,40 s, sem resíduos | `--ready-timeout-ms` envolve descoberta, fetch, WebSocket, CDP enable e navigate |
| US-001, FR-003, NFR-001, NFR-003, AC-007 | LE-005: cleanup failure deve gerar diagnóstico estruturado | `reports aggregate Chrome cleanup failures as structured technical evidence` | Teste focal → exit 1 com stdout vazio, stack de AggregateError e `EACCES` interno; relatório ausente | Matriz de call sites → 10/10; finding `browser-cleanup-failed`, causas serializadas e nenhuma entrega final | `closeChromeOrReport` centraliza close, stages e relatório; catches preservam falha original |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | `node --test --test-name-pattern='SPECSFY: AC-001' tests/presentation-runtime.test.mjs` | Passed — scaffold cria HTML/spec/approvals coerentes; proteção parcial validada |
| FR-001, FR-003 | AC-002 | Integração | `node --test --test-name-pattern='SPECSFY: AC-002' tests/presentation-runtime.test.mjs` | Passed — paridade divergente bloqueada com evidência localizada |
| FR-001, FR-002 | AC-003 | Integração | `node --test --test-name-pattern='SPECSFY: AC-003' tests/presentation-runtime.test.mjs` | Passed — repetição consecutiva bloqueada sem score |
| FR-002 | AC-004 | Integração | `node --test --test-name-pattern='SPECSFY: AC-004' tests/presentation-runtime.test.mjs` | Passed — saturação de eyebrow bloqueada com evidência numérica |
| FR-002, FR-003 | AC-005 | Integração | `node --test --test-name-pattern='SPECSFY: AC-005' tests/presentation-runtime.test.mjs` | Passed — aprovações, freeze e invalidação por hash separados do QA |
| FR-001, FR-003 | AC-006 | E2E | `node --test --test-name-pattern='SPECSFY: AC-006' tests/presentation-runtime.test.mjs` | Passed — exportação legada preservada com estado explícito |
| FR-003 | AC-007 | E2E | `node --test --test-name-pattern='SPECSFY: AC-007' tests/presentation-runtime.test.mjs` | Passed — HTML-only sem PDF e fallback `window.print()`; modo explícito preservado na regressão focal 5/5 |
| NFR-001, NFR-002, NFR-003 | AC-001 a AC-007 | Regressão | `npm run check` | Pending — baseline histórica preservada em 38/38; nova versão ainda não implementada |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — Passed em 2026-08-26 para a atualização HTML-first
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0001-contrato-v1-diagnosticos-apresentacoes/spec.md`
- **Achados**: 1 US, 3 FR, 3 NFR e 7 AC; FR-003 possui quatro cenários distintos, a interface humana está mapeada e não há BLOCKER aberto. `analyze_change --base HEAD` ficou indisponível porque a spec inteira ainda não existe em `HEAD`; classificação e impacto foram verificados semanticamente contra o pedido e a fonte atual.

#### Gate do Ato II — Plano

- **Resultado**: Passed — revalidado após materializar os REDs de LE-001 e LE-002
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0001-contrato-v1-diagnosticos-apresentacoes/spec.md`
- **Achados**: 20 tarefas, 17 concluídas, 11 de teste, 6 de código, 100 checklist items, 85 concluídos e 14/14 IDs cobertos; T016/T018 possuem RED válido e T017/T019/T020 formam a cadeia restante. Interface nas tarefas: OK.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — terceira revisão independente aprovou o estado final
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0001-contrato-v1-diagnosticos-apresentacoes/spec.md .`
- **Achados**: `deleg_08c106d9` verificou os hashes finais, repetiu LE-003/LE-004/LE-005 em HTML/PDF e aprovou fail-closed com zero `security_concerns` e zero `logic_errors`. `npm run test` e `npm run check` passam 45/45; S-001 e S-003 permanecem sugestões não bloqueantes.

### 14. Tarefas

#### Fase 0 — Runner TDD

- [x] T001 [OPS] [US-001] Materializar o script node:test em package.json — Refs: US-001, NFR-001 — Depends: none
  - [x] **PREP**: Confirmar que `node:test` já é o runner do projeto e que não há PHP nem necessidade de dependência nova.
  - [x] **EXECUTE**: Adicionar `test:tdd` com o mesmo arquivo de teste focal usado por `test`.
  - [x] **VERIFY**: Executar `npm run test:tdd -- --test-name-pattern='scaffolds'` e confirmar o runner operacional.
  - [x] **EVIDENCE**: Registrar comando, exit code e vínculo com NFR-001 na seção 13.
  - [x] **IMPROVE**: Confirmar que nenhum runner paralelo ou pacote novo foi introduzido.

#### Fase 1 — RED TDD informado pelo BDD

- [x] T002 [TEST] [TDD] [US-001] Derivar AC-001 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-001, NFR-001, NFR-002, NFR-003, AC-001 — Depends: T001
  - [x] **PREP**: Ler AC-001 e confirmar os três arquivos, schemas e metadados esperados.
  - [x] **EXECUTE**: Escrever um caso `SPECSFY: AC-001` que execute scaffold real e verifique paridade.
  - [x] **VERIFY**: Executar o teste focal e observar RED por ausência dos contratos v1.
  - [x] **EVIDENCE**: Registrar comando e causa exata do RED na seção 11.
  - [x] **IMPROVE**: Garantir que o teste observa comportamento público, sem mock do Runtime.

- [x] T003 [TEST] [TDD] [US-001] Derivar AC-002 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003, AC-002 — Depends: T001
  - [x] **PREP**: Ler AC-002 e definir uma divergência única de família entre spec e HTML.
  - [x] **EXECUTE**: Escrever um caso `SPECSFY: AC-002` que execute `quality` e parseie o relatório bloqueado.
  - [x] **VERIFY**: Executar o teste focal e observar RED porque o comando ou finding ainda não existe.
  - [x] **EVIDENCE**: Registrar comando, exit code e causa exata do RED na seção 11.
  - [x] **IMPROVE**: Confirmar que o teste exige valor esperado e observado no finding.

- [x] T004 [TEST] [TDD] [US-001] Derivar AC-003 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-001, FR-002, NFR-001, NFR-002, NFR-003, AC-003 — Depends: T001
  - [x] **PREP**: Ler AC-003 e preparar três slides consecutivos da mesma família com limite dois.
  - [x] **EXECUTE**: Escrever um caso `SPECSFY: AC-003` que exige `consecutive-family-overuse` sem score.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela ausência do diagnóstico.
  - [x] **EVIDENCE**: Registrar comando, exit code e causa exata do RED na seção 11.
  - [x] **IMPROVE**: Verificar ids, contagem e limite em vez de texto frágil.

- [x] T005 [TEST] [TDD] [US-001] Derivar AC-004 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-002, NFR-001, NFR-002, NFR-003, AC-004 — Depends: T001
  - [x] **PREP**: Ler AC-004 e preparar proporção de eyebrow acima do limite local.
  - [x] **EXECUTE**: Escrever um caso `SPECSFY: AC-004` que exige `eyebrow-saturation` com evidência numérica.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela ausência do diagnóstico.
  - [x] **EVIDENCE**: Registrar comando, exit code e causa exata do RED na seção 11.
  - [x] **IMPROVE**: Confirmar que o teste não codifica julgamento estético ou marca.

- [x] T006 [TEST] [TDD] [US-001] Derivar AC-005 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-005 — Depends: T001
  - [x] **PREP**: Ler AC-005 e preparar aprovações humanas válidas com freeze pendente.
  - [x] **EXECUTE**: Escrever um caso `SPECSFY: AC-005` que exige `awaiting-freeze` e ausência do campo genérico `status`.
  - [x] **VERIFY**: Executar o teste focal e observar RED pela ausência dos estados separados.
  - [x] **EVIDENCE**: Registrar comando, exit code e causa exata do RED na seção 11.
  - [x] **IMPROVE**: Cobrir a precedência do lifecycle sem depender do horário da execução.

- [x] T007 [TEST] [TDD] [US-001] Derivar AC-006 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003, AC-006 — Depends: T001
  - [x] **PREP**: Ler AC-006 e preparar fixture legado sem os dois arquivos de contrato.
  - [x] **EXECUTE**: Escrever um caso `SPECSFY: AC-006` que exporte o deck e exija `legacy-unverified`.
  - [x] **VERIFY**: Executar o teste focal e observar RED porque o relatório atual ainda declara `passed`.
  - [x] **EVIDENCE**: Registrar comando, exit code e causa exata do RED na seção 11.
  - [x] **IMPROVE**: Preservar a verificação existente de PDF e payload exatos no mesmo cenário.

#### Fase 2 — US-001 Governar a qualidade sistêmica (P1)

**Objetivo**: gerar contratos v1, produzir diagnósticos explicáveis e derivar estados sem quebrar decks legados.
**Teste independente**: `npm run test:tdd` deve passar AC-001 a AC-006 com Chrome e Poppler reais.

- [x] T008 [CODE] [US-001] Implementar scaffold e schemas em plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.spec.json — Refs: US-001, FR-001, FR-003, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-006 — Depends: T002, T003, T007
  - [x] **PREP**: Confirmar RED de T002, T003 e T007 e reconstruir a documentação técnica baseline com `$specsfy-documentator`.
  - [x] **EXECUTE**: Criar templates, schemas e metadados HTML e tornar scaffold uma escrita protegida dos três arquivos.
  - [x] **VERIFY**: Executar AC-001, validação JSON, proteção contra overwrite e regressão de scaffold.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos, comandos e hashes relevantes na seção 11 e no comentário de evidência.
  - [x] **IMPROVE**: Templates JSON são canônicos; o Runtime aplica somente título e cópia protegida, sem duplicar os objetos em código.
  <!-- specsfy:evidence {"task":"T008","refs":["US-001","FR-001","FR-003","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-006"],"files":["plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html","plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.spec.json","plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.approvals.json","plugins/brand-runtime/skills/presentation/assets/contracts/presentation-spec.v1.schema.json","plugins/brand-runtime/skills/presentation/assets/contracts/presentation-approvals.v1.schema.json","plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs"],"commands":[{"run":"node --test --test-name-pattern='SPECSFY: AC-001|scaffolds an identity-neutral' tests/presentation-runtime.test.mjs","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T009 [CODE] [US-001] Implementar quality e findings em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-002, AC-003, AC-004 — Depends: T003, T004, T005
  - [x] **PREP**: Confirmar RED de T003 a T005 e reconstruir a documentação técnica baseline com `$specsfy-documentator`.
  - [x] **EXECUTE**: Implementar descoberta, validação, inspeção de metadados, findings, approvals e derivação determinística de estados.
  - [x] **VERIFY**: Executar AC-002 a AC-004, verificar precedência `awaiting-technical-qa` e comparar duas execuções normativas idênticas.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e comandos na seção 11 e no comentário de evidência.
  - [x] **IMPROVE**: Avaliação pura ficou separada de browser, PDF e escrita; o comando apenas orquestra e emite JSON.
  <!-- specsfy:evidence {"task":"T009","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","NFR-002","NFR-003","AC-002","AC-003","AC-004"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs"],"commands":[{"run":"node --test --test-name-pattern='SPECSFY: AC-002|SPECSFY: AC-003|SPECSFY: AC-004' tests/presentation-runtime.test.mjs","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T010 [CODE] [US-001] Integrar lifecycle em QA e export em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-002, AC-005, AC-006 — Depends: T003, T006, T007, T008, T009
  - [x] **PREP**: Confirmar GREEN de T008/T009, RED de AC-006 e reconstruir a documentação técnica baseline com `$specsfy-documentator`.
  - [x] **EXECUTE**: Aplicar o gate antes do PDF, substituir `status: passed`, preservar modo legado e validar freeze contra hashes atuais.
  - [x] **VERIFY**: Executar AC-005, AC-006 e a exportação real para HTML/PDF com payload idêntico.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e comandos na seção 11 e no comentário de evidência.
  - [x] **IMPROVE**: `buildQualityReport` e `emitQaReport` consolidam lifecycle e emissão para quality, QA e export.
  <!-- specsfy:evidence {"task":"T010","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","NFR-002","NFR-003","AC-002","AC-005","AC-006"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs"],"commands":[{"run":"node --test --test-name-pattern='SPECSFY: AC-005|SPECSFY: AC-006|exports and validates a standalone' tests/presentation-runtime.test.mjs","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

#### Fase 3 — Documentação e fechamento

- [x] T011 [DOC] [US-001] Documentar política e fluxo em plugins/brand-runtime/skills/presentation/references/quality-policy.md — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T008, T009, T010
  - [x] **PREP**: Ler a implementação final e identificar mudanças necessárias em SKILL.md, qa.md, html-delivery.md e INTERFACE.md.
  - [x] **EXECUTE**: Documentar autoridade, contratos, comandos, findings, lifecycle, compatibilidade e atribuição da pesquisa externa sem copiar presets.
  - [x] **VERIFY**: Executar validação do repositório e conferir que caminhos e exemplos correspondem ao CLI real.
  - [x] **EVIDENCE**: Registrar arquivos documentados e comandos na seção 13.
  - [x] **IMPROVE**: `quality-policy.md` concentra o contrato normativo; SKILL.md, QA e HTML apenas roteiam e aplicam.
  <!-- specsfy:evidence {"task":"T011","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":["plugins/brand-runtime/skills/presentation/SKILL.md","plugins/brand-runtime/skills/presentation/references/quality-policy.md","plugins/brand-runtime/skills/presentation/references/qa.md","plugins/brand-runtime/skills/presentation/references/html-delivery.md","INTERFACE.md"],"commands":[{"run":"npm run check","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T012 [TEST] [US-001] Fechar regressão e rastreabilidade em tests/presentation-runtime.test.mjs — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T008, T009, T010, T011
  - [x] **PREP**: Conferir todos os IDs, findings, schemas, estados e comandos alterados.
  - [x] **EXECUTE**: Executar testes focais, suite completa, `npm run check`, monitor e verificador de rastreabilidade.
  - [x] **VERIFY**: Confirmar zero regressões, zero gaps de IDs e compatibilidade Codex/Claude Code.
  - [x] **EVIDENCE**: Registrar contagens, comandos e resultados finais nas seções 11 a 13.
  - [x] **IMPROVE**: Revisão independente levou a containment de assets, staging e promoção transacional de outputs contra symlink/TOCTOU e rollback destrutivo, enum estrito de job e opções CLI, ISO-8601, fail-closed de approvals explícito, mensagens determinísticas, precedência correta de falha técnica no legado, deferimento do freeze pré-PDF, normalização determinística do PDF, limpeza de capturas gerenciadas, sandbox de rede antes da navegação, deadline/cleanup do Chrome e packaging transacional com relatório.
  <!-- specsfy:evidence {"task":"T012","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","plugins/brand-runtime/skills/presentation/assets/contracts/presentation-spec.v1.schema.json","plugins/brand-runtime/skills/presentation/assets/contracts/presentation-approvals.v1.schema.json","plugins/brand-runtime/skills/presentation/references/quality-policy.md","plugins/brand-runtime/skills/presentation/references/html-delivery.md","tests/presentation-runtime.test.mjs","specs/completed/0001-contrato-v1-diagnosticos-apresentacoes/spec.md"],"commands":[{"run":"npm run check","exit":0},{"run":"npm run test:tdd","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0001-contrato-v1-diagnosticos-apresentacoes/spec.md .","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/verify_acceptance.mjs specs/completed/0001-contrato-v1-diagnosticos-apresentacoes/spec.md .","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

#### Fase de interface

- [x] T013 [TEST] [TDD] [US-001] Derivar AC-007 em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-002, NFR-003, AC-007 — Depends: T012
  - [x] **PREP**: Preparar deck `ready`, output HTML e QA dir sem informar `--pdf`.
  - [x] **EXECUTE**: Exigir HTML standalone, ausência de PDF no filesystem/relatório, `technicalQa: not-run`, `deliveryState: awaiting-technical-qa` e fallback `window.print()`.
  - [x] **VERIFY**: Observar RED porque `export` ainda exige `--pdf`.
  - [x] **EVIDENCE**: Registrar comando, exit code e causa do RED na seção 11.
  - [x] **IMPROVE**: Preservar um caso explícito com `--pdf` que prove o pipeline PDF existente.

- [x] T014 [CODE] [US-001] Implementar a interação Save PDF HTML-first em plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html e tornar PDF opt-in em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-003, NFR-001, NFR-002, NFR-003, AC-007 — Depends: T013
  - [x] **PREP**: Confirmar o RED de AC-007 e o baseline histórico de 38/38; no arquivo focal, 28 testes existentes passaram e apenas AC-007 permaneceu RED.
  - [x] **EXECUTE**: Empacotar HTML standalone após preflight de browser; executar print, Poppler, embedding e hashes somente quando `--pdf` existir.
  - [x] **VERIFY**: Regressão focal 5/5 cobre AC-007, export PDF explícito, compatibilidade legada, freeze e rollback transacional.
  - [x] **EVIDENCE**: GREEN, arquivos e comandos registrados na seção 11 e no comentário de evidência.
  - [x] **IMPROVE**: `packageShareableHtml` e `promoteOutputFiles` compartilham inlining, containment, staging e promoção sem duplicar política ou afrouxar offline.
  <!-- specsfy:evidence {"task":"T014","refs":["US-001","FR-003","NFR-001","NFR-002","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html","tests/presentation-runtime.test.mjs","docs/application.md",".specsfy/PACKAGES.md"],"commands":[{"run":"node --test --test-name-pattern='SPECSFY: AC-005|SPECSFY: AC-006|SPECSFY: AC-007|exports and validates a standalone|preserves previous delivery artifacts' tests/presentation-runtime.test.mjs","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T015 [DOC] [US-001] Atualizar o mapa do viewer HTML-first em INTERFACE.md e documentar plugins/brand-runtime/skills/presentation/SKILL.md — Refs: US-001, FR-003, NFR-001, NFR-002, NFR-003, AC-007 — Depends: T014
  - [x] **PREP**: Conferir CLI, starter, lifecycle, relatórios e comandos finais; identificar e observar o RED da expectativa antiga no validador do repositório.
  - [x] **EXECUTE**: Atualizar SKILL.md, html-delivery.md, qa.md, quality-policy.md, INTERFACE.md, PROJECT.md, STACK.md, validador e projeções técnicas aplicáveis.
  - [x] **VERIFY**: `npm run check` passou 39/39; spec, tarefas, interface, rastreabilidade, aceitação, documentator, monitor e `git diff --check` passaram antes da revisão.
  - [x] **EVIDENCE**: Seções 11–13 atualizadas; DATABASE e RULES não mudam porque a decisão altera somente entrega e lifecycle operacional.
  - [x] **IMPROVE**: Revisão independente `deleg_422b47eb` executou probes fail-closed, encontrou LE-001/LE-002 e originou T016–T020; zero preocupações de segurança.

- [x] T016 [TEST] [TDD] [US-001] Reproduzir rollback quando qa-report.json impede publicação em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T015
  - [x] **PREP**: Criar entregas HTML-only e PDF explícita anteriores, sentinel externo e `qa-report.json` symlinkado.
  - [x] **EXECUTE**: Exigir exit não zero, sentinel intacto, artefatos anteriores byte-idênticos e zero staging/backup/tmp residual.
  - [x] **VERIFY**: Observar RED porque o relatório é emitido depois da promoção dos artefatos.
  - [x] **EVIDENCE**: Teste focal saiu 1 e mostrou `delivery.html` anterior substituído antes da recusa do relatório.
  - [x] **IMPROVE**: HTML-only e PDF explícito compartilham a mesma fixture iterada sem duplicação.

- [x] T017 [CODE] [US-001] Incluir qa-report.json na promoção transacional em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T016
  - [x] **PREP**: RED T016 confirmado; HTML/PDF preservam no-clobber sem `--force`, enquanto o relatório corrente usa substituição atômica.
  - [x] **EXECUTE**: Relatório final é stageado e promovido com HTML/PDF pela mesma transação e rollback conjunto.
  - [x] **VERIFY**: Matriz focal 5/5 cobre T016, rollback anterior, TOCTOU, PDF explícito e HTML-only.
  - [x] **EVIDENCE**: GREEN e comando registrados na seção 11 e no comentário abaixo.
  - [x] **IMPROVE**: `emitQaReport` permanece no fluxo de falha; `emitQaReportOutput` compartilha apenas stdout/lifecycle.
  <!-- specsfy:evidence {"task":"T017","refs":["US-001","FR-003","NFR-001","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs"],"commands":[{"run":"node --test --test-name-pattern='preserves previous delivery when QA report publication is rejected|preserves previous delivery artifacts when forced replacement fails|does not follow an output symlink introduced during export|SPECSFY: AC-007|exports and validates a standalone' tests/presentation-runtime.test.mjs","exit":0}]} -->

- [x] T018 [TEST] [TDD] [US-001] Reproduzir Chrome que ignora SIGTERM em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T015
  - [x] **PREP**: Criar launcher temporário em grupo de processo que ignore SIGTERM e inicie o Chrome real.
  - [x] **EXECUTE**: Exigir término limitado, ausência de timeout, launcher/Chrome encerrados e profile temporário removido.
  - [x] **VERIFY**: Observar RED porque `chrome.close()` não aguarda exit nem força encerramento.
  - [x] **EVIDENCE**: Teste focal saiu 1 em 6,1 s com `ETIMEDOUT`; o `finally` removeu processos do harness.
  - [x] **IMPROVE**: O teste reutiliza export HTML-only mínimo e restringe cleanup à raiz temporária.

- [x] T019 [CODE] [US-001] Implementar fechamento assíncrono e limitado do Chrome em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T017, T018
  - [x] **PREP**: RED T018 confirmado e todos os call sites de `chrome.close()` inventariados.
  - [x] **EXECUTE**: CDP, grupo de processo, SIGTERM/SIGKILL, sink e profile usam cleanup aguardável, limitado e idempotente.
  - [x] **VERIFY**: Regressão focal 7/7 cobre T018, readiness, WebSocket, packaging, quality e ambos os modos de export.
  - [x] **EVIDENCE**: GREEN e comando registrados na seção 11 e no comentário abaixo.
  - [x] **IMPROVE**: `closeChrome()` é compartilhado por sucesso e falhas de startup; erros de cleanup são agregados depois de tentar todos os recursos.
  <!-- specsfy:evidence {"task":"T019","refs":["US-001","FR-003","NFR-001","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs"],"commands":[{"run":"node --test --test-name-pattern='forces bounded cleanup|times out unresolved|reports packaging failures|SPECSFY: AC-005|SPECSFY: AC-007|exports and validates a standalone|blocks WebSocket access' tests/presentation-runtime.test.mjs","exit":0}]} -->

- [x] T020 [TEST] [US-001] Executar regressão e revisão independente em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-002, NFR-003, AC-007 — Depends: T017, T019
  - [x] **PREP**: T016–T019, transação, lifecycle, docs e resíduos de processos/profiles conferidos.
  - [x] **EXECUTE**: Referências atualizadas, docs reconstruídos e suíte/gates completos executados com 41/41.
  - [x] **VERIFY**: `deleg_c869b346` repetiu probes fail-closed, confirmou LE-001/LE-002 e encontrou LE-003/LE-004/LE-005.
  - [x] **EVIDENCE**: Parecer vinculado aos hashes atuais registrou 41/41, gates aprovados e três blockers reproduzíveis.
  - [x] **IMPROVE**: S-002 aplicada para distinguir token removido de script vazio; S-001 não criou hook de produção porque a prova existente já cobre retorno antes de PDF sem ampliar API.

- [x] T021 [TEST] [TDD] [US-001] Reproduzir destino de relatório incompatível em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T020
  - [x] **PREP**: Entregas anteriores e `qa-report.json` diretório criados nos modos HTML-only e PDF explícito.
  - [x] **EXECUTE**: Teste exige falha pré-render, bytes anteriores e zero stage/backup residual.
  - [x] **VERIFY**: RED observado com `ERR_FS_EISDIR` após promoção e cleanup do backup diretório.
  - [x] **EVIDENCE**: Exit 1 e erro pós-commit registrados na seção 11.
  - [x] **IMPROVE**: Os dois modos compartilham uma fixture iterada sem hook de produção.

- [x] T022 [CODE] [US-001] Validar tipos de destino e fechar ponto de commit em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T021
  - [x] **PREP**: RED T021 confirmado; promoção é reversível até `committed`, limpeza de backup é pós-commit.
  - [x] **EXECUTE**: Destinos não regulares são rejeitados antes do render; falha pós-commit de cleanup não vira packaging failure.
  - [x] **VERIFY**: Matrizes cobrem T021, diretório tardio, rollback, symlink tardio, no-clobber e ambos os modos.
  - [x] **EVIDENCE**: GREEN e comando registrados na seção 11 e abaixo.
  - [x] **IMPROVE**: Tipo é validado no preflight e novamente após rename para backup, preservando substituição segura de symlink tardio.
  <!-- specsfy:evidence {"task":"T022","refs":["US-001","FR-003","NFR-001","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs"],"commands":[{"run":"node --test --test-name-pattern='rolls back a non-file QA report|rejects a non-file QA report|does not follow an output symlink introduced|preserves previous delivery when QA report|preserves previous delivery artifacts' tests/presentation-runtime.test.mjs","exit":0}]} -->

- [x] T023 [TEST] [TDD] [US-001] Reproduzir handshake DevTools estagnado em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T022
  - [x] **PREP**: Launcher local publica target válido e mantém o upgrade WebSocket sem resposta.
  - [x] **EXECUTE**: Teste exige deadline, finding estruturado e zero launcher/profile/processo.
  - [x] **VERIFY**: RED observado por `ETIMEDOUT` do controlador externo em ~5,06 s.
  - [x] **EVIDENCE**: Elapsed e ausência de deadline interno registrados na seção 11.
  - [x] **IMPROVE**: Servidor local mínimo e cleanup próprio por diretório no `finally`.

- [x] T024 [CODE] [US-001] Aplicar deadline a toda inicialização DevTools em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T023
  - [x] **PREP**: RED T023 confirmou bloqueio no handshake antes do retorno de `openChrome`.
  - [x] **EXECUTE**: Startup completo foi envolvido no timeout e reutiliza cleanup limitado no catch.
  - [x] **VERIFY**: Matriz focal 5/5 cobre T023, readiness, launcher resistente e exports normal/PDF.
  - [x] **EVIDENCE**: GREEN e comando registrados na seção 11 e abaixo.
  - [x] **IMPROVE**: `--ready-timeout-ms` foi reutilizado sem opção ou dependência nova.
  <!-- specsfy:evidence {"task":"T024","refs":["US-001","FR-003","NFR-001","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs"],"commands":[{"run":"node --test --test-name-pattern='times out a stalled DevTools|times out unresolved presentation readiness|forces bounded cleanup when the Chrome launcher ignores SIGTERM|SPECSFY: AC-007|exports and validates a standalone' tests/presentation-runtime.test.mjs","exit":0}]} -->

- [x] T025 [TEST] [TDD] [US-001] Reproduzir falha real de remoção do profile em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T024
  - [x] **PREP**: TMPDIR do profile isolado e pai tornou-se não gravável após criação.
  - [x] **EXECUTE**: Teste exige relatório estruturado, causas agregadas, zero entrega final e processo encerrado.
  - [x] **VERIFY**: RED observado com AggregateError top-level, stdout vazio, qa-report ausente e `EACCES` interno.
  - [x] **EVIDENCE**: Exit, stack e causa registrados na seção 11.
  - [x] **IMPROVE**: Permissões são restauradas e somente diretório/processos próprios são removidos no `finally`.

- [x] T026 [CODE] [US-001] Converter falhas de cleanup em diagnóstico estruturado em plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs — Refs: US-001, FR-003, NFR-001, NFR-003, AC-007 — Depends: T025
  - [x] **PREP**: RED T025 confirmado e sete call sites de close inventariados.
  - [x] **EXECUTE**: Cleanup failure é capturada, causas são serializadas, stages próprios removidos e finding técnico emitido.
  - [x] **VERIFY**: Matriz 10/10 cobre T025, quality, qa, HTML-only, PDF, readiness, startup e falhas técnicas.
  - [x] **EVIDENCE**: GREEN e comando registrados na seção 11 e abaixo.
  - [x] **IMPROVE**: `serializeError` e `closeChromeOrReport` centralizam AggregateError sem esconder falha prévia de browser/PDF.
  <!-- specsfy:evidence {"task":"T026","refs":["US-001","FR-003","NFR-001","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs"],"commands":[{"run":"node --test --test-name-pattern='SPECSFY: AC-002|reports technical browser QA failures|blocks a legacy deck|reports aggregate Chrome cleanup|SPECSFY: AC-005|SPECSFY: AC-006|SPECSFY: AC-007|exports and validates a standalone|times out unresolved|times out a stalled DevTools' tests/presentation-runtime.test.mjs","exit":0}]} -->

- [x] T027 [TEST] [US-001] Fechar gates e revisão independente em tests/presentation-runtime.test.mjs — Refs: US-001, FR-003, NFR-001, NFR-002, NFR-003, AC-007 — Depends: T026
  - [x] **PREP**: T021–T026, referências normativas e resíduos conferidos; profile histórico do RED removido sem processo associado.
  - [x] **EXECUTE**: Docs reconstruídos; `npm run test` e `npm run check` passam 45/45; Specsfy, aceitação e evidência passam.
  - [x] **VERIFY**: `deleg_08c106d9` passou fail-closed nos hashes finais com zero preocupação de segurança e zero erro lógico.
  - [x] **EVIDENCE**: Seções 11–13, DoD e comentário final atualizados com 45/45, gates e probes independentes.
  - [x] **IMPROVE**: S-001 segue sem hook de produção; S-003 permanece sugestão de CI Windows sem alterar o Runtime universal nesta fatia.
  <!-- specsfy:evidence {"task":"T027","refs":["US-001","FR-003","NFR-001","NFR-002","NFR-003","AC-007"],"files":["plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs","tests/presentation-runtime.test.mjs","plugins/brand-runtime/skills/presentation/references/html-delivery.md","plugins/brand-runtime/skills/presentation/references/qa.md","plugins/brand-runtime/skills/presentation/references/quality-policy.md"],"commands":[{"run":"npm run test","exit":0},{"run":"npm run check","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0001-contrato-v1-diagnosticos-apresentacoes/spec.md .","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico histórico: T001 → T002/T003/T004/T005/T006/T007 → T008/T009 → T010 → T011 → T012.
- Retomada HTML-first: T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027.
- Tarefas paralelas: T002 a T007 são independentes após T001; T008 e T009 alteram arquivos distintos na primeira etapa, mas serão executadas sequencialmente para preservar ciclos TDD e documentação.
- Correção de plano em 2026-08-26: AC-005 permanece em T010 porque depende de QA técnico aprovado; T009 prova somente diagnóstico pré-PDF e precedência `awaiting-technical-qa`.
- Estratégia de MVP: AC-001 a AC-007 formam uma única fatia entregável; golden decks, visão e adapters permanecem fora desta execução.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Node.js e Chrome/Chromium são necessários para export e inspeção de browser.
- Poppler é necessário apenas para `qa --pdf` ou `export --pdf` explícito.
- Skill Brand para resolver Brand Pack ou `brand-pending`; a implementação desta spec não altera essa resolução.
- Decisões humanas registradas em `presentation.approvals.json` para avançar além de revisão.

#### Riscos

- Threshold virar estética implícita → política explícita no projeto, findings mensuráveis e ausência de score.
- Contrato manual divergir do HTML → paridade bloqueante e IDs localizados.
- Compatibilidade esconder ausência de governança → estado `legacy-unverified` obrigatório no relatório.
- Freeze ficar obsoleto após mudança → comparação de hashes e estado `invalidated`.
- Runtime monolítico crescer → helpers puros e schemas separados, sem introduzir pacote novo nesta fatia.
- HTML-only ser confundido com QA técnico completo → manter `technicalQa: not-run` e `awaiting-technical-qa` até PDF manual passar por `qa`.
- PDF salvo manualmente divergir entre browsers → preservar print CSS determinístico e disponibilizar `qa --pdf` para validação opcional.
- Relatório falhar depois da promoção → incluir `qa-report.json` na mesma transação dos artefatos finais e restaurar backups em qualquer falha.
- Chrome ou launcher ignorar SIGTERM → usar grupo de processo isolado, deadline de cleanup, SIGKILL de fallback e remoção limitada do profile.

#### Suposições

- Nomes irmãos `presentation.spec.json` e `presentation.approvals.json` são defaults reversíveis; overrides da CLI preservam layouts de projeto diferentes.
- Família é slug project-local e não exige registry universal.
- `maxConsecutiveFamily: 2` e `maxEyebrowRatio: 0.5` são defaults conservadores do scaffold, editáveis antes da produção.
- Aprovações são escritas por humano ou automação autorizada externa; o Runtime apenas valida e projeta.

### 17. Decisões

- **DEC-001**: Evoluir a skill Presentation existente em vez de criar uma skill estética paralela — reduz autoridade concorrente e mantém uma entrada pública.
- **DEC-002**: Usar dois arquivos project-local, spec e approvals — separa intenção de produção de decisões humanas mutáveis.
- **DEC-003**: Detectar contrato por arquivos irmãos, com overrides opcionais — fortalece novos scaffolds sem quebrar estruturas legadas.
- **DEC-004**: Bloquear apenas invariantes e limites explícitos — evita automatizar gosto como nota absoluta.
- **DEC-005**: Manter o modo legado indefinidamente nesta versão — compatibilidade precede migração automática.
- **DEC-006**: Não adicionar dependência JSON Schema — os schemas são públicos e a validação runtime mínima é implementada com Node.js existente.
- **DEC-007**: Tornar HTML standalone o output padrão e interpretar `--pdf <arquivo>` como opt-in explícito — pedido do usuário em 2026-08-26 para concentrar o agente na construção do HTML e permitir que a pessoa gere o PDF no viewer. Impacta FR-003, AC-005, AC-006, AC-007, CLI, interface do controle de PDF, tarefas T013–T015 e os três gates.
- **DEC-008**: Não promover HTML-only a QA técnico completo — sem PDF validado, o relatório permanece `technicalQa: not-run` e `deliveryState: awaiting-technical-qa`; o caminho explícito com PDF preserva freeze e hashes existentes.
- **DEC-009**: Tratar `qa-report.json` como parte do commit de sucesso — um comando não pode publicar novos artefatos finais e depois falhar ao publicar o relatório correspondente.
- **DEC-010**: Tornar cleanup de browser aguardável e limitado em todos os call sites — fechamento cooperativo recebe prazo e processo/grupo resistente recebe SIGKILL antes da remoção do profile.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed` para a atualização HTML-first.
- [x] `Plan Gate` está `Passed` para T013–T020.
- [x] `Delivery Gate` está `Passed` após GREEN e regressão.
- [x] AC-001 a AC-006 passam com evidência RED e GREEN registrada.
- [x] AC-007 passa com evidência RED e GREEN registrada.
- [x] FR-003 possui nova evidência HTML-only; FR-001, FR-002 e NFR-001 a NFR-003 preservam suas evidências válidas.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] `npm run test`, `npm run check` e rastreabilidade Specsfy passam na versão atualizada.
- [x] Documentação técnica e `.specsfy/PACKAGES.md` foram reconstruídos após a implementação.
- [x] Revisão independente não encontrou preocupação de segurança nem erro lógico bloqueante na atualização HTML-first.