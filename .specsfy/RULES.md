# Regras do sistema

Estas regras complementam as instruções dos agentes sem substituir specs ou
critérios de aceite. Modelo inicial sugerido para **stack ainda não identificado**.

Confirme os manifests e as fronteiras principais antes de completar o modelo genérico.

## Arquitetura

- Mantenha identidade, regras, tokens e assets específicos de clientes fora do plugin; consuma-os somente por Brand Packs externos validados.

- Mantenha o fluxo principal equivalente e validado em Codex e Claude Code.

## Código e qualidade

- Altere as skills canônicas somente em plugins/brand-runtime/skills e preserve os contratos públicos documentados.

## Testes

- Execute npm run check antes de concluir uma mudança no runtime.

## Segurança e privacidade

- Nunca grave credenciais, conteúdo privado de clientes ou dados de produção no plugin universal.

## Operação

- Mantenha aprendizados e decisões de entregas em docs/design/ no projeto consumidor; promova ao Brand Pack somente regras normativas explicitamente confirmadas.

## Regras específicas do projeto
