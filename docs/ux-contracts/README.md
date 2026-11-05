# UX Contracts — Operating Procedure (adopsi Contract-First UI/UX Framework v2)

**Status:** Adopted 2026-11-05 (PO). Reference framework: `contract_first_ui_v2/` (workspace).
**Parent architecture:** Doc07 (Frontend) + Doc08 (UX & Interaction). This layer does NOT
replace them — it governs how deferred detail (Doc07 §19, Doc08 §19) gets decided per feature.

## Anti-goal
Prevent "AI slop": an app that works but whose flow, layout and visuals are incoherent
because decisions were invented during coding instead of decided and reviewed beforehand.

## Six gates (per feature)
G1 Job → G2 Flow → G3 Screen & Interaction → G4 Design System & Component →
G5 Slice, Prototype & Critique → G6 Build, QA & Audit → continuous governance.

Core rule: **no production UI code until the relevant contracts are reviewed.**
Exploration prototypes allowed only if labelled disposable.

## Rigor levels (binding for this repo)
- **Standard** — every M2/M3 feature: G1, G2 as needed, G3–G6.
- **Lite** — copy/small low-risk fixes: G3 relevant section → implement → focused check.
- **Full** — cross-module / high-risk workflows (e.g. Guided 10-stage flow, plugin/AI):
  Application Architecture + all gates + governance.

## Non-negotiables
1. Decisions before code. 2. States before polish (loading, empty-first-run,
   empty-filtered, partial, error, long-content, restricted, done + domain states).
3. Evidence over claims (every finding: contract ref, screenshot, test or source location).
4. Independent Critic — fresh context / separate reviewer, never the builder.

## Binding constraints (baseline freeze v1.0 — framework may not weaken)
- State is backend-authoritative (SYS-015); frontend projects, never owns it.
- Frontend talks to backend ONLY via `ipcClient` (4 bridge methods).
- Authorization default-deny, fail-closed (SEC-004).
- WCAG 2.2 AA baseline is NOT deferred (Doc08).
- Analytics payloads: no whole-DataFrame JSON over IPC (Arrow IPC, M2+).
- Guided Mode (10 stages) + Advanced Mode share one engine/model/project (Doc08 §5).

## Where artefacts live
`docs/ux-contracts/<feature>/` with stable IDs:
`JOB-<FEAT>-001`, `FLOW-<FEAT>-001`, `SCREEN-<FEAT>-001`, `DS-CORE-001`, `QA-<FEAT>-001`.
Trace: contract ↔ screen ↔ test in each `QA-*.md`.

## Visual confirmation (PO requirement)
- **G3 exit:** Screen & Interaction Contract reviewed before any UI code.
- **G5 slice + Critique:** one working vertical slice, screenshot-reviewed by an
  independent Critic; blockers resolved before other screens follow the pattern.
