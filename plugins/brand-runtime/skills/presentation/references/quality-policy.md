# Presentation quality policy

## Purpose

This policy governs presentation process, contract integrity, technical QA, and explainable system diagnostics. It does not define client identity, choose a universal aesthetic, or replace human visual review.

The authority order is:

```text
validated Brand Pack + active brand rules + project-local direction
                              ↓
                   presentation.spec.json
                              ↓
             HTML metadata and rendered evidence
                              ↓
       technical QA + explainable system diagnostics
                              ↓
          human content and visual approval + freeze
```

## Three distinct gates

1. **Objective technical gate:** blocks malformed contracts, missing slide metadata, contract/render divergence, remote resource attempts, layout overflow, prohibited export effects, missing fonts, and packaging failures. Invalid PDF structure and payload hash mismatches apply only when PDF mode is explicit.
2. **Explainable system diagnostics:** blocks only when a project-declared threshold is exceeded. Findings always identify the affected slides and observed evidence. The Runtime does not emit an aggregate taste score.
3. **Human authority gate:** only a person may approve content, approve visual direction, accept an exception, or freeze delivery artifacts.

`technicalQa: passed` never implies visual approval or delivery completion.

## Contract v1

`scaffold` creates a protected set:

- `presentation.html`;
- `presentation.spec.json`;
- `presentation.approvals.json`.

If any file already exists, the command refuses to replace the set unless `--force` is explicit.

The JSON contracts are published in:

- `assets/contracts/presentation-spec.v1.schema.json`;
- `assets/contracts/presentation-approvals.v1.schema.json`.

Every `.slide` in a contract-v1 deck must declare, in the same order as `presentation.spec.json`:

```html
<section
  class="slide"
  data-slide-id="evidence-01"
  data-slide-job="proof"
  data-slide-family="evidence"
>
```

- `data-slide-id` is a stable project-local identifier.
- `data-slide-job` records the narrative job.
- `data-slide-family` records the project-local compositional family.

A family is semantic metadata, not a global CSS template. Values such as `statement` and `evidence` in the starter demonstrate the contract only; projects may define other slug values through their local direction.

New scaffolds start with `briefStatus: draft`. Set it to `ready` only after audience, decision, content constraints, and local direction are sufficiently resolved. A draft brief cannot cross the system gate.

## Project-declared thresholds

`presentation.spec.json` owns the two v1 thresholds:

- `qualityPolicy.maxConsecutiveFamily`: maximum permitted run of one declared family;
- `qualityPolicy.maxEyebrowRatio`: maximum fraction of slides carrying an explicit eyebrow role.

These values are local policy, not universal taste. Do not silently change them to force a pass. Correct the deck or make the policy decision explicit in the project contract.

## Runtime commands

Run the system gate before HTML export or optional PDF generation:

```bash
node <skill-dir>/scripts/presentation-runtime.mjs quality \
  --input <authoring.html>
```

`quality` discovers sibling contracts by default. `--spec <path>` and `--approvals <path>` may select explicit files. It emits deterministic JSON with `technicalQa: not-run` and exits non-zero when system diagnostics block. Browser inspection defaults to a 15-second readiness deadline; `--ready-timeout-ms <1..120000>` is available for an explicit project or CI constraint.

`qa` and `export` reuse the same gate. `export` emits standalone HTML by default; `--pdf <path>` explicitly activates PDF generation, Poppler validation and embedding. When the gate blocks, both commands write `qa-report.json`, print the report, exit non-zero, and do not generate final artifacts.

## Findings v1

Every generated report declares `reportSchema: "smartscaile.presentation-quality-report.v1"`.

All blocking findings use this shape:

```json
{
  "rule": "consecutive-family-overuse",
  "severity": "blocking",
  "slides": ["context-01", "context-02", "context-03"],
  "message": "A slide family exceeds the configured consecutive-use limit.",
  "evidence": {
    "family": "statement",
    "count": 3,
    "limit": 2
  }
}
```

The v1 rules are:

| Rule | Meaning |
| --- | --- |
| `contract-invalid` | `presentation.spec.json` is missing required data, malformed, or uses unsupported values. |
| `approval-invalid` | An explicit approvals contract is malformed or incomplete. |
| `brief-not-ready` | The local brief remains `draft`. |
| `contract-mismatch` | Slide count, order, or ordered `id`, `job`, or `family` differs between contract and rendered deck. |
| `remote-resource-reference` | The deck declared or attempted an HTTP(S), WebSocket, or FTP resource during sandboxed inspection. |
| `consecutive-family-overuse` | A declared family run exceeds its project-local limit. |
| `eyebrow-saturation` | Explicit eyebrow usage exceeds its project-local ratio. |

Eyebrow detection recognizes `data-presentation-role="eyebrow"` and the legacy `.slide__eyebrow` class. It does not infer eyebrow intent from arbitrary typography.

Technical failures are reported separately in `technicalFindings` and set `technicalQa: failed`. Browser rules include `browser-inspection-failed`, `browser-cleanup-failed`, `slides-missing`, `fonts-not-ready`, `layout-overflow`, and `prohibited-export-effect`. `browser-cleanup-failed` records serialized process, sink, socket, profile, and staging cleanup causes under `evidence` when the report destination remains usable. PDF rules apply only to explicit PDF mode and include inspection failure, page count or ratio mismatch, Type 3 or unembedded fonts, and incomplete page rendering. `packaging-failed` covers local-asset and, when applicable, embedded-payload failures, writes the report, removes incomplete staging files, and preserves any previously valid delivery artifacts. QA/export exit non-zero and do not relabel a technical failure as a system-policy failure.

Every finding carries a deterministic top-level `message`; volatile tool detail remains under `evidence`. Export normalizes Chrome's PDF creation/modification metadata before inspection, hashing, and embedding, so identical inputs produce byte-identical PDF and delivery HTML. Runtime-owned outputs use temporary siblings plus rollback-capable promotion to avoid following a destination symlink introduced during execution; the success `qa-report.json` participates in the same commit as HTML or PDF/HTML. Managed browser/PDF capture files from a prior run are cleared before rendering; unrelated human evidence is preserved.

Chrome starts on `about:blank` behind a Runtime-owned local sink proxy with loopback bypass disabled. CDP request blocking and interception are enabled as a second layer before navigation, and HTTP(S), WebSocket, and FTP attempts are recorded through their protocol-specific events. Deck JavaScript therefore cannot reach the requested network destination during inspection; attempted URLs remain explainable evidence in the report. Chrome runs in an isolated process group; the configured readiness deadline begins during DevTools startup and covers discovery through navigation. Every call site awaits idempotent cleanup with bounded SIGTERM/SIGKILL fallback before the sink and temporary profile are released.

## Lifecycle

Reports use independent states:

- `technicalQa`: `not-run`, `passed`, or `failed`;
- `systemDiagnostics`: `not-run`, `passed`, `failed`, or `legacy-unverified`;
- `approvals.content`: `pending`, `approved`, `rejected`, `invalidated`, or `invalid`;
- `approvals.visual`: the same decision states;
- `freeze`: `pending`, `frozen`, `invalidated`, or `invalid`;
- `deliveryState`: `blocked`, `legacy-unverified`, `awaiting-technical-qa`, `awaiting-content-approval`, `awaiting-visual-approval`, `awaiting-freeze`, or `frozen`.

Precedence is deterministic:

1. failed technical QA, failed diagnostics, rejected/invalid approval, or invalidated freeze → `blocked`;
2. legacy without a v1 contract and without a technical failure → `legacy-unverified`;
3. technical QA not run → `awaiting-technical-qa`;
4. content pending → `awaiting-content-approval`;
5. visual pending → `awaiting-visual-approval`;
6. valid freeze absent → `awaiting-freeze`;
7. current HTML, PDF, and spec hashes match an authorized freeze → `frozen`.

`quality` and HTML-only `export` have no PDF and report `technicalQa: not-run`. For contract-v1 HTML-only export, `deliveryState` remains `awaiting-technical-qa`; browser captures and system diagnostics are still emitted. When approvals already record `freeze: frozen`, the report preserves that source state; only `qa` or explicit-PDF `export`, with current HTML, PDF, and spec hashes available, may invalidate a mismatch.

There is no generic `status: passed` field.

## Human approvals and freeze

Approval records require an actor, timestamp, scope, and non-empty evidence list when they are not pending. Credential values, private tokens, and secrets never belong in these fields.

A frozen record also carries:

- `htmlSha256`;
- `pdfSha256`;
- `specSha256`.

`qa` validates these hashes against current artifacts. A mismatch invalidates the freeze and blocks delivery after writing the report. Pending approvals do not block creation of review artifacts; they prevent the lifecycle from reaching `frozen`.

## Legacy compatibility

When no sibling `presentation.spec.json` exists and no explicit `--spec` was provided, the Runtime preserves HTML-first export and explicit HTML/PDF payload verification without inventing a contract. It reports:

```json
{
  "systemDiagnostics": "legacy-unverified",
  "deliveryState": "legacy-unverified"
}
```

Legacy mode does not invent metadata, generate inferred contracts, or claim visual approval. Migrate a deck deliberately by authoring and validating the v1 contracts.

## Deliberate limits

The v1 policy does not:

- calculate an aesthetic or taste score;
- approve visual maturity;
- enforce a universal family catalog;
- default to minimalist, soft, premium, brutalist, or showcase-site aesthetics;
- import remote dependencies or require network access;
- turn a generated reference image into brand authority;
- replace rendered human review.

## Research provenance

The preflight and anti-repetition approach was informed by an audit of `taste-skill` at commit `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`:

https://github.com/Leonxlnx/taste-skill/tree/ccbc15639c97057cbfcf32ecebc38ef716e4bb37

That project is MIT-licensed. Brand Runtime re-expresses selected process ideas for presentation contracts and does not import its skills, presets, code, or aesthetic authority.