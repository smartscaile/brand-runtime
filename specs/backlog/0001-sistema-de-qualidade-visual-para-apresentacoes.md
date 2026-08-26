# Backlog: Sistema de qualidade visual para apresentações

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0001 |
| Status | Refining |
| Produto | Brand Runtime |
| Épico | Qualidade visual verificável |
| Funcionalidade | Governança de qualidade para apresentações |
| Tipo | Funcionalidade |
| Prioridade | Alta: apresentação é a superfície prioritária |
| Milestones | |
| Criado em | 2026-08-24 |
| Spec promovida | Nenhuma |

## Ideia original

O Brand Runtime gera apresentações tecnicamente corretas, porém formulaicas, amadoras e reconhecíveis como produzidas por IA. Usar o ciclo Specsfy para transformar essa demanda em governança profissional, começando por apresentações.

## Problema percebido

O fluxo atual consegue renderizar e exportar decks corretos, mas não impede narrativa fraca, direção de arte genérica, repetição formulaica, tratamento editorial pobre e uso indevido do estado final.

## Pessoa afetada ou beneficiada

Pessoas que usam o Brand Runtime em Codex ou Claude Code para criar, revisar e aprovar apresentações, além dos públicos que recebem esses decks.

## Resultado ou valor esperado

Um sistema neutro, compatível e verificável que governe narrativa, direção de arte, prova do sistema, QA, aprovações e freeze sem substituir Brand Packs nem automatizar gosto humano.

## Contexto

Primeira fatia centrada em apresentações; Brand Packs seguem como autoridade de identidade; Specsfy governa contratos e gates; presets estéticos ficam fora do core; tracking-os serve apenas como referência e evidência.

## Referências relacionadas

- `specs/inbox/2026-08-24-131309-elevar-a-qualidade-visual-do-brand-runtime.md` — captura de origem preservada.
- `PROJECT.md` — oportunidade e limites do produto.
- `DESIGNSYSTEM.MD` — baseline do modelo de autoridade e dos quatro gates.
- `INTERFACE.md` — lacunas atuais da taxonomia de famílias e dos contratos de apresentação.
- `plugins/brand-runtime/skills/presentation/SKILL.md` e `references/` — fluxo atual, QA técnico e sinais de resultado formulaico.
- `/Users/carloskorber/Projects/smartscaile/tracking-os/.presentation-work/formuse-final-2026-08-24/` — referência auditada: QA técnico aprovado com aprovações de conteúdo, visual e freeze ainda pendentes; evidência, não template normativo.

## Comportamento esperado

1. Antes da produção substancial, a apresentação explicita tese, audiência, ação esperada, sequência, evidência e densidade.
2. A direção de arte local explicita referências, tensões visuais, tipografia, imagem, composição, movimento e proibições sem competir com o Brand Pack.
3. Três slides representativos provam narrativa, direção e sistema antes da expansão do deck.
4. Cada slide declara papel narrativo e família; o deck acompanha distribuição, sequência e repetições para detectar monotonia e abuso de padrões.
5. Screenshots, imagens, diagramas e dados recebem tratamento editorial verificável.
6. A entrega separa QA técnico, QA visual, aprovação de conteúdo e freeze; o estado final depende das aprovações e evidências aplicáveis.
7. A rubrica combina checks determinísticos e julgamento humano explícito sem declarar gosto totalmente automatizável.
8. Golden decks e slides de referência sustentam regressão visual sem virar template visual universal.

## Regras de negócio

- Brand Packs externos continuam como única autoridade de identidade oficial.
- Specsfy governa estados, contratos, rastreabilidade e gates; não funciona como motor estético nem substituto de direção de arte.
- O runtime universal permanece identidade-neutro e equivalente em Codex e Claude Code.
- Presets como `gpt-taste`, `soft`, `minimalist` e `brutalist` não entram no core.
- Brief, redesign, controles de direção, anti-slop contextual, image-to-code opcional e contratos de padrões podem ser adaptados quando preservarem essas fronteiras.
- O tracking-os pode fornecer evidência e contraexemplos, mas não uma gramática visual normativa.
- A palavra `final` não pode aparecer como estado normativo antes das aprovações e do freeze definidos.

## Critérios de aceitação

- Given uma nova apresentação, when a produção em escala é solicitada, then narrativa, direção de arte e os três slides representativos precisam estar aprovados nos estados aplicáveis.
- Given um deck com sinais repetitivos, when a validação de sistema é executada, then a distribuição de famílias e os abusos contextuais são reportados com evidência, sem substituir a decisão visual humana.
- Given um export tecnicamente correto, when aprovação visual, aprovação de conteúdo ou freeze estiver ausente, then o deck não recebe o estado final.
- Given uma apresentação criada pelo fluxo atual, when o novo contrato for adotado, then a migração preserva Brand Pack, HTML/PDF, Codex/Claude e permite compatibilidade explícita ou falha orientada.

## Qualidades e operação

- Segurança: os contratos não incorporam credenciais nem material privado de Brand Packs.
- Privacidade: golden decks e evidências precisam de proveniência, autorização de uso e classificação de sensibilidade.
- Desempenho e volume: as validações devem operar por deck e por slide sem exigir uma biblioteca visual remota no runtime do cliente.
- Auditoria e observabilidade: toda aprovação, reprovação, exceção e freeze registra ator, estado, evidência, data e escopo.
- Compatibilidade: o contrato e os gates precisam produzir o mesmo resultado normativo em Codex e Claude Code.

## Dependências

- Autoridade de identidade e assets: Brand Pack externo validado ou direção `brand-pending` explicitamente provisória.
- Fluxo atual: skill Presentation, direção local, runtime HTML/PDF e QA renderizado.
- Decisões humanas: autoridade de aprovação visual, de conteúdo e de freeze.

## Situações de erro

- Contrato ausente, inválido ou incompatível bloqueia a transição que depende dele e informa a correção necessária.
- Falha determinística bloqueia o gate correspondente.
- Avaliação humana ausente mantém o estado pendente; não é convertida em aprovação automática.
- Referência visual sem proveniência ou autorização não pode entrar no conjunto de regressão.
- Conflito entre Brand Pack, direção local e contrato interrompe a produção até resolução explícita.

## Escopo

- Dentro: sistema de qualidade para apresentações; gates narrativo, direção de arte, sistema e entrega; contrato estruturado por deck; taxonomia de famílias; monotonia e anti-slop; tratamento editorial; rubrica; golden decks; estados, aprovações, migração e compatibilidade.
- Fora: implementação, tarefas, testes TDD/BDD executáveis, Plan Gate, presets estéticos no core, identidade de cliente e extensão imediata para sites, produtos ou documentos.

## Dúvidas, decisões e riscos

- **Decidido**: apresentações são a primeira superfície; os quatro gates e a prova por três slides pertencem à primeira versão.
- **Decidido**: checks determinísticos e decisões humanas precisam ser distinguidos explicitamente.
- **Aberto**: modelo de autoridade humana e cardinalidade das aprovações.
- **Aberto**: formato e ownership de `presentation.spec.json` ou alternativa equivalente.
- **Aberto**: estados normativos, transições, invalidação e semântica exata de `final` e `freeze`.
- **Aberto**: taxonomia inicial, limites de repetição e limiares de monotonia.
- **Aberto**: composição, proveniência e política de atualização dos golden decks.
- **Aberto**: estratégia de migração e comportamento de compatibilidade do fluxo legado.
- **Risco**: transformar heurísticas em falsa objetividade ou, no extremo oposto, criar gates humanos sem evidência verificável.
- **Risco**: uma taxonomia ou golden set universal virar estética implícita e contaminar identidades.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [ ] Permissões, regras e exceções relevantes estão claras.
- [ ] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Aprofundar nesta etapa até o item ficar pronto para `$specsfy-03-specify`.
