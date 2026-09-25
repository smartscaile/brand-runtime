# Sistema de direção do Brand Runtime

Este documento governa como o Brand Runtime transforma identidade e conteúdo
em artefatos profissionais. Ele é identidade-neutro: não contém estilo, tokens,
assets ou regras de um cliente específico.

## Classificação

| Campo | Valor |
| --- | --- |
| Escopo | Runtime universal |
| Status | Baseline para evolução por spec |
| Versão | 0.1.0 |
| Identidade | Sempre externa ao plugin |

## Modelo de autoridade

| Camada | Pergunta que responde | Autoridade |
| --- | --- | --- |
| Identidade | Quem é a marca? | Brand Pack externo validado |
| Conteúdo e narrativa | O que precisa ser entendido e em qual sequência? | Brief, evidências e spec da entrega |
| Direção de arte | Que mundo visual torna essa mensagem própria e memorável? | Direção local aprovada |
| Sistema de composição | Como essa direção se mantém coerente sem virar fórmula? | Famílias, tokens derivados e contratos locais |
| Runtime | Como produzir, validar, exportar e aprender? | Brand Runtime universal |

Nenhuma camada pode compensar silenciosamente a ausência de outra. Em especial,
um Brand Pack não escolhe sozinho a direção de arte, e um export tecnicamente
correto não comprova qualidade visual.

## Princípios de qualidade

- Começar por intenção, audiência, decisão esperada e hierarquia de conteúdo.
- Criar um mapa de conteúdo por superfície antes de escolher composição:
  afirmação, evidência, relação dominante, densidade e restrições.
- Declarar um perfil de composição local para densidade, distribuição, simetria
  e continuidade; esses campos orientam decisões, mas não formam score de gosto.
- Quando houver ambiguidade material, comparar estruturas distintas e escolher
  pela narrativa, evidência, direção aprovada e ritmo vizinho, nunca por
  randomização ou rotação de presets.
- Derivar direção visual das evidências da marca e do contexto da entrega.
- Tratar presets estéticos fortes apenas como referências ou adapters
  opcionais; nunca como gosto universal do core.
- Evitar assinaturas recorrentes de geração automática: headline gigante por
  padrão, eyebrow em toda superfície, cards sem função, gradientes decorativos,
  texto centralizado sem hierarquia, screenshots apenas encaixados e variações
  cosméticas do mesmo layout.
- Usar repetição quando ela constrói ritmo e reconhecimento; interrompê-la
  quando começa a denunciar template.
- Exigir que imagem, tipografia, grid, espaço e movimento tenham função
  editorial ou operacional demonstrável.

## Gates mínimos

### 1. Gate narrativo

Confirma tese, audiência, ação esperada, sequência, evidências e densidade antes
de decidir layouts.

### 2. Gate de direção de arte

Confirma referências, tensões visuais, tratamento de imagem, tipografia,
composição, movimento e proibições antes de produção em escala.

### 3. Gate de sistema

Valida um conjunto pequeno de superfícies representativas, suas famílias,
variações, limites de repetição e comportamento em conteúdo real.

### 4. Gate de entrega

Separa QA técnico, QA visual, aprovação de conteúdo e freeze. O estado `final`
só existe quando as aprovações requeridas e a evidência exportada concordam.

## Apresentações

- Cada slide declara papel narrativo e família de composição.
- O deck acompanha a distribuição de famílias para detectar monotonia e abuso.
- A primeira implementação contém exatamente três slides, por padrão os slides
  1–3; esse lote inicial deve provar o sistema em sequência narrativa real.
- Não criar slides posteriores nem placeholders antes da aprovação humana
  explícita do primeiro lote e da autorização para expandir o deck.
- Revisar os slides 1–3 como sequência de miniaturas, páginas completas e
  detalhes; repetição e contraste precisam de função narrativa demonstrável.
- Screenshots são material editorial: precisam de recorte, escala, foco,
  anotação ou integração coerente com a narrativa.
- QA deve verificar overflow, fontes, assets, contraste e exportação, além de
  ritmo, hierarquia, repetição, credibilidade e aderência à direção aprovada.

## Sites, produtos e documentos

Os mesmos gates se aplicam, ajustados à superfície. Produtos acrescentam
interação, estados e acessibilidade; sites acrescentam fluxo de leitura e
conversão; documentos acrescentam paginação, navegação e legibilidade longa.

O método operativo comum está em
`plugins/brand-runtime/skills/brand/references/design-foundation.md`.
Brand e Presentation devem consumi-lo antes da implementação e na revisão.
Mapa de conteúdo, perfil justificado, escolha estrutural, prova renderizada e
crítica em três escalas não dependem de invocar Presentation.
`surface-guidelines.md` especializa a aplicação sem impor formato ou lote de
slides às demais superfícies. A proveniência externa é centralizada em
`design-method-provenance.md`, na mesma pasta da base.

O CLI `context` entrega `designMethod` em `brand-pack` e `brand-pending`, com
conteúdo, paths relativos ao plugin e hashes dos documentos consumidos.
`status: instructions-only` comprova apenas quais instruções foram entregues.
Não comprova que o agente as executou nem que o artefato foi aprovado.

## Exceções da entrega

| Data | Entrega | Regra substituída | Nova direção | Alcance | Evidência e aprovação |
| --- | --- | --- | --- | --- | --- |
| A preencher | A preencher | A preencher | A preencher | Local ou durável | A preencher |

## Histórico

| Versão | Data | Alteração | Origem |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-24 | Baseline inicial para estruturar a evolução da qualidade visual | Preparação do sistema visual |
