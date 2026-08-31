# Fluxos

## Ativação e entrega observadas

```mermaid
sequenceDiagram
  participant Pessoa
  participant Host as Codex, Claude Code ou Hermes
  participant Runtime as Brand Runtime
  participant Pack as Brand Pack externo
  participant Project as Projeto consumidor
  Pessoa->>Host: invoca brand ou presentation
  Host->>Runtime: ativa hook ou skill portátil
  Runtime->>Pack: resolve e valida identidade
  Runtime->>Project: lê direção e conhecimento local
  Runtime-->>Pessoa: cria, revisa ou entrega artefato com evidências
```

## Construção progressiva de apresentações

```mermaid
sequenceDiagram
  participant Pessoa
  participant Skill as Skill Presentation
  Skill-->>Pessoa: brief, pasta, narrativa, tese visual e evidências
  Pessoa->>Skill: aprova o plano completo
  Skill-->>Pessoa: HTML com exatamente três slides, slides 1–3 por padrão
  Pessoa->>Skill: aprova explicitamente o primeiro lote
  Skill-->>Pessoa: expande o deck restante
```

A aprovação de uma pasta ou de outro checkpoint isolado nunca autoriza a
expansão. Antes da aprovação do primeiro lote, slides futuros não entram no DOM,
no `presentation.spec.json` nem como placeholders.
