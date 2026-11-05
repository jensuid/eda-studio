# 12 — Continuous UX Governance

## Purpose

Keep contracts, implementation and design system aligned as the application evolves.

## Source of truth

For each decision identify its authoritative artifact:
- Product intent: approved requirement / job contract.
- Workflow: flow contract.
- Screen behavior: screen & interaction contract.
- Shared visual behavior: design-system contract.
- Release confidence: QA acceptance record.

When two sources conflict, stop and reconcile them. Do not assume the newest code is the intended behavior.

## Change protocol

1. Describe the proposed change and reason.
2. Run impact analysis across jobs, flows, screens, roles, components and tests.
3. Identify affected artifacts.
4. Obtain approval for consequential behavior changes.
5. Update contracts before or alongside implementation, with traceable commits.
6. Implement and run regression checks.
7. Record the final decision and evidence.

## Versioning

Use normal source-control history. Add artifact IDs and status:
- Draft
- In Review
- Approved
- Superseded

Avoid duplicating entire documents for every small change. Use version history and concise decision records.

## Design-system change control

A shared token or component change must identify:
- Why change is needed.
- Which screens/modules are affected.
- Compatibility or migration needs.
- Visual regression coverage.
- Owner and approval.

## Governance cadence

- Per feature: contract review, critique and QA.
- Per release: regression and open-risk review.
- Periodically: token drift, component duplication, accessibility debt and recurring UX defects.

## Definition of Done

A UI change is done when:
- Relevant contracts are approved and current.
- Implementation meets acceptance criteria.
- Applicable states and interactions are verified.
- Accessibility and visual checks are complete at the agreed scope.
- Defects are resolved or explicitly accepted.
- Evidence and artifacts are traceable.
