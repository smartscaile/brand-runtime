# Aplicação e implementações

## Componentes principais

| Componente | Caminho | Responsabilidade |
| --- | --- | --- |
| Hook de comando | `plugins/brand-runtime/scripts/brand-command-hook.mjs` | Ativar `>>brand` e `>>presentation` nos hosts suportados |
| Configuração do Brand Pack | `plugins/brand-runtime/scripts/brand-root-config.mjs` | Resolver e persistir com segurança o diretório externo de marcas |
| CLI de marca | `plugins/brand-runtime/skills/brand/scripts/brand.ts` | Validar packs, fornecer contexto e registrar aprendizados |
| Runtime de apresentação | `plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs` | Verificar, renderizar, exportar e inspecionar decks |
| Skill de direção | `plugins/brand-runtime/skills/brand/SKILL.md` | Orquestrar identidade, projeto, direção e revisão |
| Skill de apresentação | `plugins/brand-runtime/skills/presentation/SKILL.md` | Orquestrar criação, refinamento e entrega de decks |

O plugin não oferece servidor, banco ou API própria. Ele é carregado pelos
runtimes suportados e atua somente sobre arquivos do projeto consumidor e
Brand Packs externos aprovados.
