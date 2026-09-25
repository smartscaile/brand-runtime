# Decisões técnicas

## Decisões explícitas observadas

- Identidade e regras de clientes ficam fora do plugin universal.
- O mesmo produto deve funcionar em Codex, Claude Code e Hermes.
- Direção e aprendizado começam no projeto consumidor.
- Apresentações usam HTML local como entrega padrão; PDF automatizado é opt-in e mantém QA determinístico.
- O Viewer preserva navegação, progresso, título, contador, hash, teclado e
  `window.print()`, sem fullscreen.
- O dock permanece uma ilha inferior de até 520 × 56 px no desktop e 340 × 56
  px no mobile, com gap de 12 px e stage transparente com `overflow: hidden`.
- Apresentações novas separam spec, aprovações humanas, diagnóstico e freeze;
  decks legados permanecem `legacy-unverified`.
- O Runtime bloqueia apenas invariantes e limites explícitos; gosto e aprovação
  visual continuam decisões humanas.
- O `taste-skill` é referência metodológica auditada, não dependência nem
  autoridade estética. O Runtime adapta leitura de contexto, raciocínio de
  composição, crítica e preflight, rejeita presets e randomização e mantém
  Brand Packs e aprovação humana como autoridades.
- Antes do deck completo, o fluxo aprova o plano e constrói exatamente três
  slides. A expansão exige aprovação humana explícita do primeiro lote.
- O Hermes usa instalação gerenciada por profile e sem symlink. O comando
  padrão instala a fonte oficial corrente; pin imutável exige `--ref <SHA-40>`
  explícito para uma revisão publicada.
- A camada local de lifecycle documental foi retirada em 2026-08-30 para
  reduzir overhead; decisões vivas foram promovidas para os arquivos canônicos
  e os artefatos históricos continuam recuperáveis pelo Git.
- Nenhum tracker externo estava vinculado na migração; o trabalho futuro
  remanescente está preservado em [Dívidas e lacunas observadas](../INTERFACE.md#dívidas-e-lacunas-observadas)
  até receber uma referência externa confirmada.

## Composição como base de todas as superfícies

O raciocínio antes concentrado em Presentation passa a ter autoridade única em
`plugins/brand-runtime/skills/brand/references/design-foundation.md`.
Mapa de conteúdo, perfil de composição, candidatos estruturais quando
necessários, prova antes de escalar e crítica renderizada em três escalas
integram a base de site, produto, apresentação e documento. A revisão deve
acontecer antes da entrega, sem depender de rejeições sucessivas do usuário.

O CLI entrega os textos e hashes em `designMethod` para ambos os modos de
identidade. A seção é aditiva e separada das regras do cliente; o estado
`instructions-only` impede confundir disponibilidade com execução ou aceite.
Presentation consome a base e mantém seus gates específicos. A proveniência
externa e a matriz de adoção ficam em `design-method-provenance.md`, sem
presets estéticos, estilos de clientes, dependências novas ou score de beleza.

Essa alteração de fonte não instala o checkout nem publica uma release.
Versão, distribuição gerenciada e autorização de publicação permanecem
fronteiras separadas. Alterações preexistentes de projeção de Brand Packs
não fazem parte desta mudança de método.

## Continuidade da UI sem congelar a composição

A base universal orienta o método, não substitui a aplicação local aprovada.
O contexto prioriza regras de marca, Pack e direção local compatível, antes
das heurísticas universais. Identidade, integridade, conteúdo e acessibilidade
continuam protegidos; exemplos e dimensões de tentativas não viram obrigações
gerais. Reutilizar, evoluir ou compor depende da função do conteúdo e da UI
realmente renderizada, distinguindo aprovação parcial, estado atual e rejeição.

`projectKnowledge.existingSources` lista somente entradas convencionais locais
que existam como arquivos, sem seguir symlinks. É descoberta limitada, não leitura
do conteúdo, registro de aprovação ou inventário exaustivo. O agente segue as
fontes declaradas pelo projeto. Não se exige migrar registros existentes para
`docs/design/`, e nenhum conhecimento do cliente é armazenado no core.

## Fundação de marca, UI local e biblioteca compartilhada

`context.designAuthority` explicita identidade e restrições obrigatórias,
defaults fundacionais recomendados e composição de autoria do projeto.
Escalas e exemplos não são um catálogo fechado de componentes. Extensões
semânticas locais preservam identidade, integridade e regras explícitas.

O schema de configuração permanece `1.0.0`, com `additionalBrandRoots`
opcional. `config add` preserva a biblioteca e é idempotente; `config set`
substitui a seleção. Slugs são descobertos dinamicamente. Colisões bloqueiam
seleção implícita, e uma entrada local inválida não é mascarada pela global.
Não há cópia, movimentação ou symlink de packs. Instalar em todos os perfis é
uma operação de distribuição separada, não herança automática do plugin.

## Seleção explícita de origem por marca

Uma pasta histórica ou incompleta com o mesmo slug continua sendo uma colisão,
não uma autorização para usar a primeira origem. O usuário pode escolher uma
raiz já cadastrada por `config bind`. O mapa opcional `brandRootsBySlug` mantém
o schema `1.0.0` e só governa a resolução global. Bindings inválidos ou obsoletos
falham sem fallback; `config add` os preserva e `config set` substitui toda a
seleção. O binding não movimenta dados nem concede aprovação da marca.

## Política

`PROJECT.md`, `project.json`, `AGENTS.md`, contratos, código e testes são as
fontes normativas. Decisões duráveis ficam neste documento; trabalho futuro
fica no tracker e não cria uma árvore documental paralela.
