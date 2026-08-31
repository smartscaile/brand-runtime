# Persistência

O projeto não possui banco de dados. O estado é explícito e baseado em arquivos.

| Fonte | Responsabilidade |
| --- | --- |
| `project.json` | Estado e versão canônicos do runtime |
| Configuração do host | Caminho do diretório externo de Brand Packs |
| Brand Pack externo | Identidade, assets, voz e regras do cliente |
| `presentation.spec.json` | Intenção, ordem, jobs e famílias do deck |
| `presentation.approvals.json` | Aprovações humanas de conteúdo, visual e freeze |
| `qa-report.json` | Evidências e diagnósticos determinísticos de entrega |
| `docs/design/` do projeto consumidor | Direção e aprendizado locais |

Arquivos de cliente permanecem fora do plugin universal.
