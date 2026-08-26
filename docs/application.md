# Aplicação e implementações

## Componentes observados fora do inventário automático

| Componente | Caminho | Responsabilidade |
| --- | --- | --- |
| Hook de comando | `plugins/brand-runtime/scripts/brand-command-hook.mjs` | Ativar `>>brand` e `>>presentation` nos hosts suportados |
| Configuração do Brand Pack | `plugins/brand-runtime/scripts/brand-root-config.mjs` | Resolver e persistir com segurança o diretório externo de marcas |
| CLI de marca | `plugins/brand-runtime/skills/brand/scripts/brand.ts` | Validar packs, fornecer contexto e registrar aprendizados |
| Runtime de apresentação | `plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs` | Verificar, renderizar, exportar e inspecionar decks |
| Skill de direção | `plugins/brand-runtime/skills/brand/SKILL.md` | Orquestrar identidade, projeto, direção e revisão |
| Skill de apresentação | `plugins/brand-runtime/skills/presentation/SKILL.md` | Orquestrar criação, refinamento e entrega de decks |

<!-- specsfy:documentator:start -->
## Superfícies

Categorias: Serviços, Rotas e APIs, Páginas, Componentes, Testes e Outras fontes.

Relação: relaciona cada arquivo observado à sua superfície.

| Categoria | Arquivo | Símbolos |
| --- | --- | --- |
| Outras fontes | plugins/brand-runtime/skills/brand/scripts/brand.ts | CLIENT_RULES_FILE, CLIENT_RULES_SCHEMA_VERSION, SURFACES, RULE_SURFACES, RULE_SEVERITIES, RULE_STATUSES, LEARN_SCOPES, PROJECT_KNOWLEDGE_KINDS |
<!-- specsfy:documentator:end -->
