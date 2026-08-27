# Especificação integrada: Viewer UI do Presentation Runtime

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0003 |
| Slug | 0003-presentation-viewer-ui |
| Status | Complete |
| Effort | 3 |
| Effort updated at | 2026-08-27 |
| Effort rationale | Mudança focal de UI no starter HTML, com navegação, responsividade, acessibilidade, testes e QA visual. |
| ClickUp Task | |
| Milestones | Presentation Viewer UI |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-08-27 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O starter canônico de apresentações oferece navegação funcional, mas usa uma barra superior genérica, mistura tokens do viewer com tokens dos slides, não expõe progresso visual e perde hierarquia em telas pequenas. A interface de tela precisa parecer um viewer deliberado sem impor identidade aos slides ou alterar a impressão.

#### Resultado desejado

A pessoa navega pelo deck com um viewer universal, refinado e acessível: progresso visível, dock como ilha flutuante contida e centralizada logo abaixo do slide, título e contagem atualizados, controles responsivos e Save PDF preservado. O stage não vaza outline ou outra cor nas bordas do canvas; contratos e fluxo HTML-first permanecem inalterados.

#### Métricas de sucesso

- 100% dos três cenários AC passam em teste focal.
- `npm run check` permanece verde.
- Viewer usa somente tokens `--viewer-*`; slides continuam usando tokens de projeto.
- Dock fica em fluxo logo abaixo do stage, com largura máxima contida, sem ancoragem ao rodapé do viewport.
- Nenhum outline ou background do stage fica visível nas bordas do slide escalado.
- Teclado, hash, progresso e Save PDF continuam operacionais.
- Viewer desaparece integralmente em impressão.
- QA visual desktop e mobile não mostra clipping, sobreposição ou perda de foco.

### 2. Research e esclarecimentos

#### Researchs executados

| ID | Criticalidade | Claim | Veredito | Confiança | Evidência | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | critical | O starter canônico já contém navegação, escala e Save PDF | verified | high | `plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html` | 1/2 |
| R-002 | critical | Controles de tela devem ficar fora do canvas e sumir no print | verified | high | `references/html-delivery.md`, seção Screen controls | 1/2 |
| R-003 | high | O starter não pode virar identidade visual de cliente | verified | high | `SKILL.md`, `visual-system.md` e comentário de tokens provisórios | 1/2 |

#### Fontes e contexto consultados

- Pedido e escolha atual do usuário: Viewer UI, navegação, progresso e responsividade; fullscreen foi explicitamente removido em 2026-08-27.
- Feedback visual do usuário em 2026-08-27: “deixa como uma ilha flutuantes em baixo dos slides e mais contida ao centro” e remover “bordas estranhas no slide vazando outra cor”; evidência: `composer_2026-08-27_01-02-38-098_ff7718.png`.
- `plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html`.
- `plugins/brand-runtime/skills/presentation/references/html-delivery.md`.
- `plugins/brand-runtime/skills/presentation/references/visual-system.md`.
- Skill `presentation-delivery-governance`.

#### Documentação consultada

- `html-delivery.md`: contrato do viewer HTML-first e dos controles screen-only.
- `visual-system.md`: separação entre interface repetida, canvas e identidade.

#### Artefatos de pesquisa armazenados

- Nenhum; todas as fontes são locais ou já governam o projeto.

#### Evidência e licenças

- Não há incorporação de design externo, biblioteca, fonte remota ou asset de terceiros.

#### Dúvidas respondidas

- **Q**: Qual camada deve ser redesenhada? → **A**: Viewer UI, não o visual-base dos slides.
- **Q**: Quais capacidades entram? → **A**: navegação, progresso e responsividade; o usuário corrigiu que fullscreen não é necessário.
- **Q**: PDF automático entra? → **A**: Não; Save PDF continua usando `window.print()` no modo HTML-first.

#### Dúvidas abertas

- Nenhuma bloqueante. O default reversível é um viewer neutro escuro, sem identidade cliente.

### 3. Escopo e atores

#### Incluído

- Substituir a barra superior por header leve, progresso e dock inferior.
- Separar tokens de viewer e tokens do deck.
- Atualizar título de slide e contador ao navegar.
- Refinar hover, active, focus-visible e disabled.
- Adaptar dock e escala para mobile.
- Preservar teclado, hash, print e Save PDF.
- Atualizar testes e documentação técnica aplicável.

#### Fora do escopo

- Alterar identidade, composição ou conteúdo dos slides de exemplo.
- Adicionar overview/grid, speaker notes ou edição de slides.
- Introduzir frameworks, bibliotecas, fontes remotas ou ícones externos.
- Alterar contratos v1, aprovação, freeze ou PDF opt-in.
- Simplificar ou remover Specsfy nesta fatia.

#### Atores

- **Pessoa apresentadora ou revisora**: navega e salva PDF pelo diálogo nativo.
- **Agente autor do deck**: substitui tokens e conteúdo dos slides sem modificar o contrato do viewer.
- **Brand Pack**: governa a identidade do canvas, nunca o chrome funcional do viewer.

### 4. Princípios e restrições do projeto

- **PR-001**: Viewer chrome permanece fora de `.slide`.
- **PR-002**: Nenhum token `--viewer-*` pode governar o canvas impresso.
- **PR-003**: Nenhum token de Brand Pack é necessário para o viewer funcionar.
- **PR-004**: HTML continua sendo a entrega padrão; PDF só existe por ação explícita.

### 5. Histórias de usuário

#### US-001 — Navegar pelo deck em um viewer refinado

Como pessoa que apresenta ou revisa um deck HTML, quero controles claros e responsivos com progresso, para navegar com confiança sem afetar o conteúdo ou a impressão.

**Prioridade**: P1
**Teste independente**: scaffold do starter, inspeção de contrato HTML/JS e QA renderizado desktop/mobile.
**Requisitos**: FR-001, FR-002, NFR-001
**Aceite**: AC-001, AC-002, AC-003

### 6. Cenários BDD de aceite

#### AC-001 — Navegação e progresso

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-001
Feature: viewer com contexto de navegação

  Scenario: navegar para outra lâmina
    Given um deck gerado pelo starter
    When a pessoa avança ou volta uma lâmina
    Then o contador, o título ativo e o progresso refletem a lâmina exibida
    And o hash e os estados Previous e Next continuam coerentes
```

#### AC-002 — Navegação por teclado e hash

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-002
Feature: navegação acessível e reconstruível

  Scenario: navegar sem depender do ponteiro
    Given o viewer aberto em uma lâmina válida
    When a pessoa usa setas, Page Up, Page Down, Home ou End
    Then a lâmina ativa e o hash da URL permanecem sincronizados
    And um hash válido reconstrói a mesma lâmina ao carregar
```

#### AC-003 — Responsividade e impressão

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-003
Feature: viewer responsivo sem interferir no deck

  Scenario: usar tela estreita ou imprimir
    Given o viewer em viewport estreito ou mídia print
    When o layout é recalculado
    Then o dock permanece uma ilha contida e centralizada logo abaixo do stage
    And os controles mantêm alvos touch e não sobrepõem o canvas
    And nenhuma borda ou cor do stage vaza ao redor do slide
    And o viewer chrome desaparece por completo na impressão
    And Save PDF continua chamando window.print no modo HTML-first
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O starter deve oferecer viewer chrome externo ao canvas com progresso, título ativo, contador, Previous, Next e Save PDF; o dock deve ser uma ilha de largura contida, em fluxo e centralizada logo abaixo do stage.
- **FR-002**: Navegação por botões, teclado e hash deve atualizar estado visual e manter Save PDF independente.

#### Não funcionais

- **NFR-001**: O viewer deve ser identidade-neutro, offline, self-contained, acessível, responsivo, ausente no print e sem outline/background do stage visível nas bordas escaladas. **Verificação**: teste focal, `npm run check`, browser desktop/mobile e inspeção de print CSS.

#### Erros e casos-limite

- Uma única lâmina → Previous/Next desabilitados e progresso em 100%.
- Título ausente → fallback para `Slide N`.
- Viewport pequena → ilha reduz até o limite seguro sem virar barra full-width nem reduzir alvos abaixo de 44 px.
- Hash inválido ou fora do intervalo → fallback seguro para a primeira lâmina.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Starter HTML self-contained, CSS/JS inline e canvas fixo 1280×720.
- Navegação atual usa `hidden`, hash, teclado e escala por viewport.
- Print expõe todas as lâminas e oculta a toolbar atual.
- Save PDF usa `window.print()` sem payload e download Blob somente com PDF explícito.

#### Arquitetura e módulos

- `presentation.html`: estrutura, tokens, CSS e JS do viewer.
- `tests/spec-0003/presentation-viewer-ui.test.mjs`: contratos focais isolados.
- `package.json`: inclui teste focal no `test` e `check`.
- `html-delivery.md`: descreve controles e responsividade.

#### Migrations

- Não aplicável; arquivos scaffoldados anteriormente não são alterados automaticamente.

#### Models

- Estado local: índice, total, título ativo e progresso.

#### Controllers e casos de uso

- `showPresentationSlide`: sincroniza lâmina e viewer.
- `fitPresentationDeck`: usa espaço real da shell.

#### Services

- Não aplicável.

#### Validações

- IDs de controle únicos.
- ARIA e estados atualizados.
- Tokens de viewer separados.
- Print CSS sem viewer chrome.
- Sem dependência ou asset remoto.

#### Observabilidade e falhas

- QA existente continua detectando overflow e efeitos proibidos dentro do canvas.

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Viewer | documento atual | índice, total, título ativo e progresso | lê metadata ordenada de Slide |
| Slide | `data-slide-id` | título e ordem válidos | pertence ao deck atual |

- Não há persistência. O estado do viewer vive em memória e no hash da URL.

#### Regras de negócio

- O viewer nunca altera contratos, conteúdo ou identidade do deck.

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Slide | índice N | Previous/Next/teclado/hash | índice válido | 0 ≤ índice < total |
| Progresso | N/total | mudança de slide | razão atualizada | 0 < razão ≤ 1 |

#### Migração e retenção

- Não aplicável.

#### Segurança, autorização e privacidade

- Nenhuma rede, storage ou coleta de dados.


### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. O viewer é usado diretamente por quem apresenta ou revisa o deck no navegador.

#### Stack e convenções de interface

- HTML, CSS e JavaScript nativos inline; sem dependências.
- Canvas fixo, viewer screen-only e print CSS existente.
- Ícones SVG inline com `aria-hidden`; rótulos permanecem acessíveis.

#### Telas e responsabilidades

- **Viewer HTML**: uma única tela usada por quem apresenta ou revisa; em desktop mostra progresso superior, título discreto e ilha central imediatamente abaixo do stage; no estado mobile reduz a largura da ilha e preserva alvos touch; no estado print remove o chrome e exibe somente slides.

#### Fluxo de informação e navegação

1. Ler slides e metadata.
2. Resolver índice/hash.
3. Exibir slide.
4. Atualizar título, contador, progresso e estados.
5. Recalcular escala em resize.

#### Menus e navegação principal

- Previous e Next permanecem os controles primários.
- Home/End, setas, PageUp/PageDown e espaço continuam suportados.
- Save PDF fica separado das ações de navegação por divisor funcional.
- Não há menu de aplicação: a pessoa chega diretamente ao arquivo HTML e navega no dock screen-only.

#### Formulários e ações

- Não há formulário.
- Ações têm `aria-label`, `title`, feedback de foco e estado disabled/pressed.

#### Composição e disposição

- Fundo de viewer grafite neutro.
- Progresso fino no topo.
- Header leve com título do deck.
- Dock sólido como ilha em fluxo, centralizada abaixo do stage, com largura máxima contida, borda, sombra, raios moderados e hierarquia de ações.
- Stage transparente, sem outline claro e com clipping próprio para impedir bleed de subpixel nas bordas escaladas.
- Tokens `--viewer-*` não são compartilhados com `.slide`.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Viewer HTML | Não aplicável | Chrome, navegação e progresso | `assets/html-starter/presentation.html` | HTML/CSS/JS nativos | Próprio | Extensão do starter existente |

- Não há React, shadcn/ui ou ReUI; a superfície é HTML nativo deliberadamente sem framework.

#### Estados e acessibilidade

- Default, hover, active, focus-visible e disabled.
- Fallback de título `Slide N`.
- Alvos mínimos 44×44 px.
- Contador/título com `aria-live="polite"` sem anunciar cada pixel de progresso.

- Contraste do viewer independente do Brand Pack.
- `prefers-reduced-motion` remove transições não essenciais.

#### APIs expostas

- Nenhuma API de rede. O contrato público é o HTML scaffoldado e seus IDs/atributos estáveis.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Nenhuma documentação externa foi necessária; o comportamento segue APIs web já usadas pelo starter.

#### Eventos e outros contratos

- `resize`, `keydown` e hash da URL são contratos locais do viewer.

### 11. Estratégia TDD

- **Unidade**: contrato textual do starter scaffoldado e estados declarados no JavaScript.
- **Integração/contrato**: scaffold real produzido pelo Runtime.
- **BDD/aceite**: AC-001, AC-002 e AC-003 orientam os testes com marcadores `SPECSFY:`.
- **Runner TDD**: Node.js `node:test`, materializado no script `test:tdd` existente.
- **E2E**: preview desktop/mobile e interação real de navegação.
- **Verificação manual**: somente aprovação visual humana do refinamento.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, NFR-001, AC-001 | AC-001 | `SPECSFY: AC-001 ... provides synchronized viewer navigation and progress` | Failed as expected: `node --test --test-name-pattern="AC-001" tests/spec-0003/presentation-viewer-ui.test.mjs`; missing `--viewer-bg` and synchronized viewer contract | Passed: `npm run test:tdd`; viewer tokens, progressbar, active title/count and hash synchronized | RED scoped to public scaffold output; brittle variable-name assertion replaced by observable hash contract |
| US-001, FR-001, FR-002, NFR-001, AC-002 | AC-002 | `SPECSFY: AC-002 ... preserves keyboard and hash navigation` | Failed inicialmente pela ausência de `hashchange`; após review, segundo RED falhou por ausência de parser inteiro/no intervalo para `#slide-1.5` e `#slide-99` | Passed: `npm test` e `npm run check` 55/55; CDP confirmou fallback seguro de ambos os hashes para `#slide-1` | Prior fullscreen RED invalidado; parser único `presentationIndexFromHash()` evita divergência entre carga inicial e `hashchange` |
| US-001, FR-001, FR-002, NFR-001, AC-003 | AC-003 | `SPECSFY: AC-003 ... keeps responsive chrome outside print` | RED inicial por toolbar legada; após feedback visual, novo RED falhou porque o dock ainda estava fora do shell, absoluto/full-width e o stage mantinha outline/background visível | Passed: `npm run test:tdd` 38/38; capturas CDP confirmaram ilha 520/340 px, gap 12 px e stage transparente/clipped | Novo contrato moveu o dock ao fluxo do shell, incluiu sua altura na escala e removeu outline/background intermediário |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Contrato | `node --test tests/spec-0003/presentation-viewer-ui.test.mjs` | Passed 3/3; `npm test` e `npm run check` passaram 55/55 |
| FR-001 | AC-002 | Contrato/browser | teste focal + teclado/hash no browser | Passed; CDP confirmou `#slide-1 → #slide-2 → #slide-1` com título, contador e progressbar sincronizados |
| FR-001 | AC-003 | CSS/browser | teste focal + viewport mobile | Passed; capturas 1440×900 e 390×844 confirmam ilha 520/340 px, gap 12 px, stage transparente/clipped e ausência de bleed |
| FR-002 | AC-001 | Integração | navegação real no preview | Passed por CDP real com Previous/Next e estados disabled nos limites |
| FR-002 | AC-002 | Integração | teclado e hash | Passed por teste focal e reconstrução real de estado no browser |
| FR-002 | AC-003 | Regressão | `npm run check` | Passed; estrutura válida e 55/55 testes |
| NFR-001 | AC-001 | Visual | screenshot desktop | QA técnico visual sem blocker; aprovação humana separada e pendente |
| NFR-001 | AC-002 | Acessibilidade | ARIA/focus | Progressbar ARIA, `aria-live`, labels, foco visível e alvos mínimos cobertos |
| NFR-001 | AC-003 | Visual/print | screenshot mobile + CSS | QA técnico visual e print contract passaram; aprovação humana separada e pendente |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — Passed em 2026-08-27 após incorporar feedback visual da ilha e das bordas
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0003-presentation-viewer-ui/spec.md`
- **Achados**: AC-003, FR-001 e NFR-001 cobrem ilha em fluxo, largura contida e stage sem bleed; nenhum BLOCKER.

#### Gate do Ato II — Plano

- **Resultado**: READY — Passed em 2026-08-27 após novo RED de AC-003
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0003-presentation-viewer-ui/spec.md`
- **Achados**: Plano preserva os três predecessores TDD; novo RED reproduz dock absoluto/full-width e stage com bleed; T004/T005/T006 reabertas.

#### Gate do Ato III — Entrega

- **Resultado**: PASSED — aprovado técnica e visualmente em 2026-08-27
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0003-presentation-viewer-ui/spec.md tests/spec-0003 --full-chain`
- **Achados**: `npm test` e `npm run check` 55/55, rastreabilidade 7/7, diff-check, interação/hash CDP, capturas desktop/mobile, scan estático e monitor passaram; review independente sem achados de segurança ou lógica; usuário aprovou visualmente com “perfeito” em 2026-08-27.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Criar RED de navegação e progresso em `tests/spec-0003/presentation-viewer-ui.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Scaffoldar fixture e inventariar controles atuais.
  - [x] **EXECUTE**: Exigir tokens, progresso, título ativo e sincronização.
  - [x] **VERIFY**: Observar RED por elementos ausentes.
  - [x] **EVIDENCE**: `node --test --test-name-pattern="AC-001" tests/spec-0003/presentation-viewer-ui.test.mjs` saiu 1 por ausência de `--viewer-bg` no scaffold atual.
  - [x] **IMPROVE**: O teste foi limitado ao HTML público produzido pelo scaffold, sem acoplar geometria cosmética.

- [x] T002 [TEST] [TDD] [US-001] Criar RED de navegação por teclado e hash em `tests/spec-0003/presentation-viewer-ui.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Definir teclas, reconstrução por hash e fallback.
  - [x] **EXECUTE**: Exigir sincronização por `keydown` e `hashchange`.
  - [x] **VERIFY**: Observar RED pelo contrato de hash incompleto.
  - [x] **EVIDENCE**: `node --test --test-name-pattern="AC-002" tests/spec-0003/presentation-viewer-ui.test.mjs` saiu 1 por ausência de listener `hashchange`.
  - [x] **IMPROVE**: O teste preserva o teclado existente e exige somente reconstrução de estado por URL.

- [x] T003 [TEST] [TDD] [US-001] Criar RED de responsividade/print em `tests/spec-0003/presentation-viewer-ui.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Preservar Save PDF e mídia print.
  - [x] **EXECUTE**: Exigir dock mobile, alvos touch e chrome oculto no print.
  - [x] **VERIFY**: Observar RED por toolbar legada.
  - [x] **EVIDENCE**: RED inicial por ausência de `.presentation-viewer`; RED adicional de 2026-08-27 por dock fora do shell e stage com bleed.
  - [x] **IMPROVE**: O teste exige ilha em fluxo 520/340 px, stage transparente sem outline, ajuste de escala pela altura do dock e preserva `window.print()`.

#### Fase de interface

- [x] T004 [CODE] [US-001] Implementar a tela e as interações do Viewer UI em `plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Preservados contratos, IDs de slide, canvas fixo e fluxo PDF opt-in/native print.
  - [x] **EXECUTE**: Dock movido ao fluxo do shell, limitado a 520/340 px e stage tornado transparente/clipped sem outline claro.
  - [x] **VERIFY**: Focal AC-003 e suíte spec passaram 1/1 e 3/3; `npm run test:tdd` passou 38/38.
  - [x] **EVIDENCE**: CDP 1440×900 e 390×844 mediu gap 12 px, stage/dock alinhados e screenshots sem bleed nas bordas.
  - [x] **IMPROVE**: Altura real do dock e gap agora entram no cálculo da escala; nenhum fullscreen, identidade ou dependência foi adicionado.
  <!-- specsfy:evidence {"task":"T004","refs":["US-001","FR-001","FR-002","NFR-001","AC-001","AC-002","AC-003"],"files":["plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html","tests/spec-0003/presentation-viewer-ui.test.mjs"],"commands":[{"run":"node --test tests/spec-0003/presentation-viewer-ui.test.mjs","exit":0},{"run":"npm run test:tdd","exit":0},{"run":"node /tmp/capture-presentation-viewer-final.mjs","exit":0}]} -->

- [x] T005 [DOC] [US-001] Documentar o bloco Viewer UI em `INTERFACE.md` e `plugins/brand-runtime/skills/presentation/references/html-delivery.md` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003 — Depends: T004
  - [x] **PREP**: Confirmados finalidade, arquivo, estados, consumidores e regra de reuso da ilha.
  - [x] **EXECUTE**: Documentados dock em fluxo, limites 520/340 px, gap de 12 px, escala reservada e stage sem bleed.
  - [x] **VERIFY**: `INTERFACE.md`, referência HTML, starter e spec descrevem a mesma geometria e regras de print.
  - [x] **EVIDENCE**: Documentator reconstruiu `docs/`/`PACKAGES.md` e monitor retornou CURRENT.
  - [x] **IMPROVE**: Separação entre tokens do viewer e autoridade do Brand Pack preservada.
  <!-- specsfy:evidence {"task":"T005","refs":["US-001","FR-001","FR-002","NFR-001","AC-001","AC-002","AC-003"],"files":["INTERFACE.md","plugins/brand-runtime/skills/presentation/references/html-delivery.md"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project .","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --paths package.json INTERFACE.md plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html plugins/brand-runtime/skills/presentation/references/html-delivery.md tests/spec-0003/presentation-viewer-ui.test.mjs specs/in-progress/0003-presentation-viewer-ui/spec.md .specsfy/STACK.md .specsfy/PACKAGES.md docs/architecture.md docs/testing.md PROJECT.md --check","exit":0}]} -->

#### Fase final — Qualidade

- [x] T006 [TEST] [US-001] Validar Viewer UI em desktop, mobile e regressão do Runtime a partir de `tests/spec-0003/presentation-viewer-ui.test.mjs` — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003 — Depends: T005
  - [x] **PREP**: Desktop 1440×900 e mobile 390×844 capturados; suites, checks, rastreabilidade, scan e review identificados.
  - [x] **EXECUTE**: `npm test`, `npm run check`, rastreabilidade, interação/hash CDP, documentator, monitor, screenshots, scan estático e revisão independente executados/acionados.
  - [x] **VERIFY**: Suite completa, QA visual, review independente e ausência de resíduos confirmados; usuário aprovou a direção visual explicitamente.
  - [x] **EVIDENCE**: Gates 55/55, rastreabilidade 7/7, geometria CDP 520/340 px com gap 12 px, scan limpo, monitor CURRENT e review independente `passed: true` registrados.
  - [x] **IMPROVE**: Corrigidos dock absoluto/full-width, gap excessivo e outline/background vazando; preview reaberto para aprovação humana.

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003 → T004 → T005 → T006.
- Os três REDs são executados separadamente no mesmo arquivo focal.
- MVP: viewer neutro com progresso, dock e mobile, sem alterar slides.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Browser moderno com APIs padrão de DOM.
- Node.js e test runner existentes.

#### Riscos

- Chrome sobrepor canvas → shell reserva inset inferior e escala pelo espaço real.
- Viewer parecer identidade de cliente → paleta e tokens próprios, neutros e screen-only.
- Hash mudar por navegação do browser → sincronização por `hashchange`.
- Regressão de impressão → regra print explícita e testes.

#### Suposições

- Um único visual neutro dark é suficiente; temas do viewer ficam fora desta fatia.

### 17. Decisões

- **DEC-001**: Melhorar apenas viewer chrome; slides permanecem mechanics-only e tokenizados pelo projeto.
- **DEC-002**: Usar dock inferior e progresso superior para separar contexto de apresentação do canvas.
- **DEC-003**: Separar tokens `--viewer-*` de tokens de slide.
- **DEC-004**: Não incluir fullscreen, conforme correção explícita do usuário em 2026-08-27; manter o viewer mais enxuto.
- **DEC-005**: Preservar Save PDF com `window.print()` por padrão.
- **DEC-006**: Após feedback visual de 2026-08-27, posicionar o dock em fluxo logo abaixo do stage, limitar sua largura e remover outline/background visível nas bordas escaladas.
- **DEC-007**: Usuário aprovou visualmente o Viewer UI com “perfeito” em 2026-08-27, autorizando commit, push e atualização do plugin gerenciado.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] AC-001, AC-002 e AC-003 passam.
- [x] Todas as tarefas estão concluídas.
- [x] `npm run check` passa.
- [x] Viewer desktop e mobile foram inspecionados visualmente.
- [x] O starter continua identidade-neutro, offline e HTML-first.
