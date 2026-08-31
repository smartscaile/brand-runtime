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

## Política

`PROJECT.md`, `project.json`, `AGENTS.md`, contratos, código e testes são as
fontes normativas. Decisões duráveis ficam neste documento; trabalho futuro
fica no tracker e não cria uma árvore documental paralela.
