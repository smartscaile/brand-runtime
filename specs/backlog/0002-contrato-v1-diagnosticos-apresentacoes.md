# Backlog: Contrato v1 e diagnósticos de qualidade para apresentações

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0002 |
| Status | Promoted |
| Produto | Brand Runtime |
| Épico | Qualidade visual verificável |
| Funcionalidade | Contrato e diagnósticos v1 de apresentação |
| Tipo | Funcionalidade técnica |
| Prioridade | Alta: desbloqueia gates visuais da superfície prioritária |
| Milestones | |
| Criado em | 2026-08-25 |
| Spec promovida | `specs/draft/0001-contrato-v1-diagnosticos-apresentacoes/spec.md` |

## Ideia original

Evoluir a skill Presentation com contrato estruturado, metadados por slide, diagnósticos anti-repetição e estados de aprovação separados.

## Problema percebido

O Runtime aprova integridade técnica sem conseguir distinguir decks profissionais de apresentações repetitivas, formulaicas ou ainda sem aprovação visual.

## Pessoa afetada ou beneficiada

Pessoas que usam Brand Runtime em Codex ou Claude Code para criar e entregar apresentações profissionais.

## Resultado ou valor esperado

Novos decks carregam um contrato verificável, expõem famílias e papéis por slide e não recebem estado de entrega final enquanto qualidade sistêmica, conteúdo, visual e freeze estiverem pendentes.

## Contexto

Primeira fatia do BACKLOG-0001. Mantém Brand Packs como autoridade de identidade, adapta apenas heurísticas explicáveis do taste-skill e preserva decks legados em modo de compatibilidade explícito.

## Referências relacionadas

- `specs/backlog/0001-sistema-de-qualidade-visual-para-apresentacoes.md` — épico pai.
- `INTERFACE.md` — famílias visuais e gates ainda não formalizados.
- `DESIGNSYSTEM.MD` — autoridade e separação entre qualidade técnica e visual.
- `plugins/brand-runtime/skills/presentation/SKILL.md` — workflow atual.
- `plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs` — QA técnico atual.
- `plugins/brand-runtime/skills/presentation/assets/html-starter/presentation.html` — starter atual com anatomia repetitiva.
- `tests/presentation-runtime.test.mjs` — cobertura existente.
- `https://github.com/Leonxlnx/taste-skill` — heurísticas externas adaptáveis; não é dependência de runtime.

## Comportamento esperado

1. O scaffold de uma nova apresentação cria HTML, `presentation.spec.json` e `presentation.approvals.json` compatíveis entre si.
2. Cada slide contratual declara `slideId`, papel narrativo e família de composição, com correspondência verificável entre spec e HTML.
3. O Runtime valida unicidade, ordem, presença e correspondência dos metadados antes de aprovar o gate sistêmico.
4. A política v1 detecta repetição consecutiva de família e saturação de eyebrow usando limites explícitos do projeto.
5. Cada finding informa regra, severidade, slides e evidência mensurável; não existe score absoluto de beleza.
6. O relatório separa QA técnico, diagnóstico sistêmico, aprovação de conteúdo, aprovação visual e freeze.
7. `deliveryState` é derivado desses estados e nunca é `final` enquanto uma aprovação ou o freeze estiver pendente.
8. Decks sem contrato continuam exportáveis em modo `legacy-unverified`, com compatibilidade e ausência de gate visual declaradas explicitamente.

## Regras de negócio

- O Brand Pack continua como única autoridade de identidade; o contrato de apresentação não redefine cores, tipografia, voz ou assets oficiais.
- `presentation.spec.json` é uma fonte project-local da entrega; relatórios de QA são projeções geradas e não podem reescrever a spec.
- Papéis narrativos v1: `context`, `tension`, `proof`, `failure`, `comparison`, `sequence`, `mechanism`, `decision`, `transition` e `handoff`.
- Famílias são identificadores project-local não vazios; o Runtime não fornece um catálogo estético universal.
- O limite padrão de repetição consecutiva é 2 e o limite padrão de slides com eyebrow é 1/3; ambos são explícitos e alteráveis na spec antes da produção.
- Findings acima do limite bloqueiam o gate sistêmico, mas uma alteração explícita da política local pode representar uma direção intencional.
- Aprovação visual e freeze exigem decisão humana registrada com ator, instante, escopo, evidência e hashes aplicáveis.
- A geração de artefatos para revisão pode ocorrer com aprovações pendentes, mas o relatório deve permanecer em estado de revisão e não de entrega final.
- O modo legado não recebe equivalência silenciosa ao contrato v1.

## Critérios de aceitação

- Given um novo scaffold, when seus arquivos são lidos, then HTML, spec e approvals usam o schema v1 e possuem os mesmos slides em ordem.
- Given uma spec contratual válida, when o HTML omite ou contradiz `slideId`, papel ou família, then o gate sistêmico falha com finding localizado.
- Given três slides consecutivos da mesma família e limite 2, when o diagnóstico roda, then `consecutive-family-overuse` aponta os três slides e bloqueia o gate.
- Given proporção de slides com eyebrow acima do limite declarado, when o diagnóstico roda, then `eyebrow-saturation` informa contagem, total e limite.
- Given um deck sem spec, when QA ou exportação roda, then o fluxo legado continua e o relatório declara `compatibilityMode: legacy-unverified`.
- Given QA técnico aprovado e aprovações pendentes, when o relatório é emitido, then ele não usa o estado genérico `passed` como sinônimo de entrega aprovada.
- Given conteúdo e visual aprovados, but freeze pendente, when `deliveryState` é calculado, then o estado permanece `awaiting-freeze`.
- Given QA técnico e sistêmico aprovados, conteúdo e visual aprovados e freeze válido, when `deliveryState` é calculado, then o estado é `frozen` e os hashes aprovados permanecem rastreáveis.
- Given o mesmo HTML, spec e approvals, when o diagnóstico é executado repetidamente, then findings e estados normativos são determinísticos.

## Qualidades e operação

- Segurança: contratos não aceitam scripts, caminhos externos ou segredos; valores são tratados como dados e validados antes do uso.
- Privacidade: spec, approvals e findings não incorporam conteúdo privado do Brand Pack além de identificadores e hashes necessários.
- Desempenho e volume: validação é linear no número de slides, sem rede e sem dependência externa nova.
- Auditoria e observabilidade: cada finding registra regra, severidade, slides e evidência; cada decisão humana registra ator, instante, escopo e evidência.
- Compatibilidade: o mesmo contrato e os mesmos estados normativos operam em Codex e Claude Code.
- Reprodutibilidade: timestamps não participam de findings determinísticos; entradas iguais produzem o mesmo resultado normativo.

## Dependências

- Skill Presentation e `presentation-runtime.mjs` existentes.
- Chrome/Chromium e ferramentas PDF já exigidos pelo QA atual.
- Direção local e Brand Pack ou estado `brand-pending` resolvidos pela skill Brand.
- Aprovação humana para conteúdo, visual e freeze.

## Situações de erro

- JSON ausente, inválido ou com schema incompatível bloqueia apenas o modo contratual e informa o arquivo e a correção esperada.
- IDs duplicados, slides ausentes, ordem divergente ou metadados contraditórios bloqueiam o gate sistêmico.
- Aprovação sem ator, instante, escopo ou evidência aplicável é inválida e permanece pendente.
- Alteração do HTML, PDF, spec ou direção depois de uma aprovação invalida o freeze quando o hash aprovado não corresponder.
- Deck legado permanece identificável como legado; não é migrado nem reescrito automaticamente.

## Escopo

- Dentro: schemas v1 de spec e approvals; metadados por slide; scaffold contratual; validação de paridade; repetição de família; saturação de eyebrow; estados separados; `deliveryState`; compatibilidade legada; testes e documentação.
- Fora: score de beleza; avaliação estética automática; modelo de visão; golden decks; geração de imagens; adapters `DESIGN.md`/Tailwind/CSS/DTCG; catálogo universal de layouts; comando para coletar aprovações; migração automática de decks existentes.

## Dúvidas, decisões e riscos

- **Decidido**: adaptar o método do taste-skill, não instalar seus presets ou dependências no Runtime.
- **Decidido**: ampliar a skill Presentation existente em vez de criar uma skill estética concorrente.
- **Decidido**: thresholds são política project-local explícita; o Runtime fornece defaults conservadores e diagnóstico explicável.
- **Decidido**: QA técnico, diagnóstico sistêmico, conteúdo, visual e freeze são estados independentes.
- **Decidido**: decks legados usam compatibilidade explícita sem receber selo visual.
- **Risco**: thresholds universais virarem estética implícita; mitigação: valores na spec, findings descritivos e aprovação humana.
- **Risco**: o scaffold continuar induzindo uma anatomia; mitigação: exemplos mínimos com famílias diferentes e aviso contratual de conteúdo provisório.
- **Risco**: approvals manuais ficarem obsoletos após mudança; mitigação: hashes e invalidação no cálculo do estado.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Validar e executar `specs/draft/0001-contrato-v1-diagnosticos-apresentacoes/spec.md` como primeira fatia do `BACKLOG-0001`.
