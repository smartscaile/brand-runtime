# Projeto

## História e motivação

O Brand Runtime nasceu para aplicar identidades privadas e validadas em
artefatos produzidos por agentes sem embutir marcas de clientes no runtime.
Sua evolução atual inclui um fluxo geral de direção de marca e um runtime
especializado em apresentações determinísticas.

## Finalidade

Dirigir sites, produtos, apresentações e documentos a partir de um Brand Pack
externo ou de uma direção explicitamente provisória. O resultado esperado é um
artefato coerente com a identidade selecionada, com decisões locais registradas
e entrega verificável.

## Pessoas e contexto de uso

- Pessoas que usam Codex, Claude Code ou Hermes para criar e revisar artefatos.
- Times que mantêm Brand Packs privados fora do plugin universal.
- Projetos consumidores que precisam preservar direção, evidência e aprendizado
  sem contaminar a identidade de outros clientes.

## Capacidades principais

- Descobrir, configurar e validar Brand Packs externos.
- Criar direção de design local antes da produção substancial.
- Dirigir e revisar superfícies de produto, sites e documentos.
- Criar, refinar, renderizar, exportar e verificar apresentações HTML-first, com PDF somente por solicitação explícita.
- Registrar regras, padrões, aprendizados e evidências no projeto consumidor.
- Promover ao Brand Pack somente regras normativas confirmadas para uso futuro.
- Funcionar como plugin distribuído para Codex, Claude Code e Hermes.

## Limites

- Não contém identidade, tokens, assets ou regras mutáveis de clientes.
- Não declara conformidade oficial quando o projeto está em `brand-pending`.
- Não usa preferências estéticas fortes como gosto universal do core.
- Não substitui aprovação humana de conteúdo, direção visual ou freeze.
- Não mantém banco de dados de produção nem copia material privado para o
  repositório universal.

## Contexto técnico

O runtime usa Node.js em ES modules, skills Markdown, contratos JSON, hooks dos
runtimes compatíveis e um manifest portátil Agent Plugins v1 para Hermes, além
de uma cadeia determinística HTML-first com PDF opt-in. Detalhes verificáveis
ficam em `docs/architecture.md`, `docs/database.md`, `INTERFACE.md` e
`DESIGNSYSTEM.MD`.

## Estado atual e oportunidade

A versão canônica é `0.7.1`. Esta patch release preserva o método visual, o gate
de três slides e o hardening lançados em `0.7.0`, normalizando a versão pública
para SemVer limpo e idêntico em Codex, Claude Code e Hermes. No Hermes, a
distribuição é gerenciada por perfil e atualizada por reinstalação verificada da
fonte oficial, sem apontar o diretório instalado para o checkout do runtime.
