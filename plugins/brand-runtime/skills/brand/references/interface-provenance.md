# Proveniência da engenharia de interface

## Origem e método

Extração autorizada de contratos do projeto `smartscaile/smartscaile-site`, snapshot Git `4b2c385ba6e851eec486564b7f5b6fda128046d5`, incluindo a correção do primeiro paint `fc7a1f9` e restauração do canvas `40c4ba7`. A análise cruzou imports e branches efetivos, controladores, testes, direção local, patterns e recortes de cinco sessões recentes. Não foi uma transcrição exaustiva de todas as conversas.

O levantamento classificou 85 fontes de componentes em 24 famílias e confrontou 20 lições, distinguindo aprovação humana, direção autorizada, implementação, publicação e histórico. A extração não corrigiu o projeto doador. Gaps de lifecycle/fallback do doador foram tratados como riscos a evitar, não copiados como padrões. As primitivas ESM distribuídas são implementação original de mecanismos gerais, não extração literal dos componentes.

## Mapa rastreável

Os caminhos abaixo são do snapshot de origem, não dependências de runtime. Uma sessão nova recebe o método completo, as receitas e as primitivas no plugin. Não precisa abrir essas fontes para criar um artefato. O mapa serve à auditoria da derivação, não à importação de UI ou à transferência de aceite.

| Receita distribuída | Fontes de origem consultadas | Disposição |
| --- | --- | --- |
| `navigation-shell` | `src/layouts/BaseLayout.astro:57-104`; `src/components/site/SiteHeader.astro:15-74` | Princípio reescrito; nova aplicação exige revisão. |
| `editorial-disclosure` | `src/pages/index.astro:43-63`; `src/components/home/FaqSection.astro:15-58` | Princípio reescrito; nova aplicação exige revisão. |
| `action-feedback` | `src/components/ui/SpecularButton.astro:2-92`; `src/components/ui/SpecularButton.astro:197-303` | Princípio reescrito; nova aplicação exige revisão. |
| `attention-cue` | `src/scripts/true-focus-heading.ts:24-61`; `src/scripts/true-focus-heading.ts:78-117` | Princípio reescrito; nova aplicação exige revisão. |
| `scroll-surface` | `src/lib/scroll-background.ts:8-55`; `src/components/effects/ScrollBackground.astro:18-108` | Princípio reescrito; nova aplicação exige revisão. |
| `scene-lifecycle` | `src/lib/signal-visibility.ts:18-77`; `src/lib/signal-visibility.ts:79-172` | Princípio reescrito; nova aplicação exige revisão. |
| `event-stream` | `src/components/home/HomeHero.astro:37-104`; `src/components/home/AnimatedSignalStream.tsx:98-162` | Princípio reescrito; nova aplicação exige revisão. |
| `ambient-rail` | `src/components/home/SignalTicker.astro:11-100`; `src/components/home/SignalTicker.astro:136-147` | Princípio reescrito; nova aplicação exige revisão. |
| `stable-alternatives` | `src/components/home/DataImportanceStory.tsx:26-105`; `src/components/ui/StableContent.tsx:9-23` | Princípio reescrito; nova aplicação exige revisão. |
| `connected-diagram` | `src/components/home/DataSignalDiagram.tsx:19-148`; `src/components/home/DataSignalDiagram.tsx:152-462` | Princípio reescrito; nova aplicação exige revisão. |
| `simulator` | `src/components/home/OutcomeCalculator.astro:9-136`; `src/components/home/OutcomeCalculator.astro:141-237` | Princípio reescrito; nova aplicação exige revisão. |
| `external-handoff` | `src/components/home/CheckerScanForm.astro:5-69`; `src/scripts/checker-scan-form.ts:3-68` | Princípio reescrito; nova aplicação exige revisão. |
| `quantitative-indicator` | `src/components/home/CheckerNativeScore.astro:13-88`; `src/styles/checker-native-score.css:169-214` | Princípio reescrito; nova aplicação exige revisão. |
| `diagnostic-scaffold` | `src/components/home/CheckerSection.astro:1-50`; `src/components/home/CheckerEvidenceDark.astro:31-49` | Princípio reescrito; nova aplicação exige revisão. |
| `dependent-sequence` | `src/scripts/tracking-implementation.ts:4-100`; `src/scripts/tracking-implementation.ts:105-246` | Princípio reescrito; nova aplicação exige revisão. |
| `logical-fit` | `src/scripts/checker-desktop-fit.ts:3-78`; `src/lib/checker-desktop-fit.ts:8-31` | Princípio reescrito; nova aplicação exige revisão. |
| `product-inspection` | `src/pages/index.astro:8-8`; `src/pages/index.astro:51-51` | Princípio reescrito; nova aplicação exige revisão. |
| `compact-record` | `src/components/prototypes/gtm/GtmSummaryIllustration.astro:28-125`; `src/scripts/gtm-summary-motion.ts:4-40` | Princípio reescrito; nova aplicação exige revisão. |
| `detail-distribution` | `src/components/prototypes/gtm/GtmSummaryPurchase.astro:99-125`; `src/scripts/gtm-summary-purchase-motion.ts:60-102` | Princípio reescrito; nova aplicação exige revisão. |
| `async-join` | `src/lib/gtm-summary-recovery.ts:7-57`; `src/lib/gtm-summary-recovery.ts:67-94` | Princípio reescrito; nova aplicação exige revisão. |
| `numeric-comparison` | `src/components/home/TrackingComparison.astro:18-69`; `src/scripts/tracking-comparison-count-up.ts:12-91` | Princípio reescrito; nova aplicação exige revisão. |
| `capability-plan` | `src/components/home/TrackingPlatforms.astro:7-19`; `src/components/home/TrackingPlatforms.astro:76-174` | Princípio reescrito; nova aplicação exige revisão. |
| `evidence-viewer` | `src/components/home/TrackingProof.astro:44-163`; `src/scripts/tracking-proof.ts:4-106` | Princípio reescrito; nova aplicação exige revisão. |
| `accessible-marquee` | `src/components/home/TestimonialsSection.astro:30-103`; `src/components/home/TestimonialsSection.astro:130-184` | Princípio reescrito; nova aplicação exige revisão. |

## Decisões que não foram generalizadas

- A jornada resumida tem aceite desktop e integração local, não aprovação automática de mobile, de outra marca ou de uma nova implementação.
- O donut e sua coreografia foram explicitamente preservados enquanto outros canais ainda recebiam correção. O contrato portátil protege eixos, não adota o score, o período ou o visual.
- A extensão de material tinha estados documentais conflitantes entre o agregado e a aplicação diagnóstica. Nenhum aceite global foi inferido.
- Publicação posterior supera flags históricas de não publicação, mas não transforma uma candidata rejeitada em referência aprovada.
- A retirada de entradas decorativas e de inércia foi local. O aprendizado é separar classes de movimento e preservar o restante, não proibir efeitos em todo projeto.
- Escala integral foi uma escolha específica e tem limite de leitura no mobile. Não virou default universal.
- Fonte sob `prototypes` pode ser ativa; import de tipo, árvore inerte, feature flag e legado não comprovam uso. O método exige rastrear o consumidor real.

## Licença e exclusões

`THIRD_PARTY_NOTICES.md:46-78` no doador registra MIT + Commons Clause para True Focus, Specular Button, OptionWheel, DotField e Decrypted Text, com restrição de redistribuição de componentes isolados, em bundle ou port. Eles são referências de comportamento somente. O plugin não inclui seu código, markup, CSS, glifos ou ports. Uso ou reaproveitamento no consumidor requer conferir a licença aplicável, sem inferir autorização a partir do site doador.

Não são distribuídos: identidade, paleta, fontes, logos, dados de clientes, prints, depoimentos, copy comercial, configurações de plataformas, geometria de produto, regras mutáveis do projeto, transcrições privadas ou paths pessoais. O catálogo não declara nenhum novo componente visualmente aprovado.

## Fronteira de verificação

O titular optou por manter o licenciamento existente. Esta evolução não concede
MIT nem outra licença pública nova às primitivas originais. Integração requer
autorização do titular ou permissão separada; nenhuma licença de terceiros foi
alterada. A implementação opcional e a orientação de engenharia são camadas
distintas, e disponibilidade do arquivo não equivale a direito de redistribuir.

Testes determinísticos provam entrega do método, integridade do catálogo, identidade separada, bundle realocado e funcionamento dos mecanismos cobertos. Probes isolados de sessão nova verificam compreensão das instruções; renderizações verificam comportamento e aparência dos exemplos sintéticos inspecionados. Nenhum desses gates equivale a aprovação humana, teste físico de aparelho, benchmark de FPS ou promessa de que todo novo componente sairá final na primeira tentativa.
