# 05 — Checklists and Quality Gates

## Gate 0 — Architecture (when applicable)

- [ ] Modules have clear responsibilities.
- [ ] Navigation reflects user tasks, not internal code structure.
- [ ] Roles and permission boundaries are explicit.
- [ ] Shared component ownership is defined.
- [ ] Cross-module dependencies are visible.
- [ ] Open decisions are recorded.

## Gate 1 — Job

- [ ] Actor includes context, not only a role label.
- [ ] Job is an action or decision, not a feature name.
- [ ] Trigger and frequency are understood.
- [ ] Success is observable.
- [ ] Failure cost is concrete.
- [ ] Non-goals are explicit.

## Gate 2 — Flow

- [ ] Every step has purpose, entry and exit.
- [ ] Transitions include effect and feedback.
- [ ] Failure branches have recovery.
- [ ] Cancel, back and resume behavior are defined.
- [ ] No dead ends exist.
- [ ] Permission and stale-data branches are considered where relevant.

## Gate 3 — Screen & Interaction

- [ ] Primary action is singular and clear.
- [ ] Removed elements have reasons.
- [ ] Hierarchy ranks are distinct.
- [ ] Region tree is defined.
- [ ] Applicable data states are specified.
- [ ] Controls define trigger, result and feedback.
- [ ] Validation messages are literal and actionable.
- [ ] Keyboard and focus behavior are defined.
- [ ] Disabled controls explain why where useful.
- [ ] Destructive actions have proportionate confirmation / undo.
- [ ] Copy avoids vague labels such as "OK", "Submit" and "No data".
- [ ] Narrow and wide layouts are specified where applicable.

## Gate 4 — Design System

- [ ] Tokens use semantic names.
- [ ] Color has semantic meaning and sufficient contrast.
- [ ] Typography and spacing scales are bounded.
- [ ] Components and variants are documented.
- [ ] Tables, charts and forms have shared conventions.
- [ ] Exceptions are recorded.
- [ ] Lint or review checks enforce critical rules.

## Gate 5 — Slice & Critique

- [ ] Representative task works end-to-end.
- [ ] Representative data and edge state are included.
- [ ] Screenshots use declared sizes and build.
- [ ] Keyboard path is tested.
- [ ] Critic is independent.
- [ ] Findings include evidence and severity.
- [ ] Contract gaps are updated.
- [ ] Blockers are resolved.

## Gate 6 — Audit

- [ ] Functional acceptance criteria pass.
- [ ] Interaction and keyboard checks pass.
- [ ] Applicable state coverage is verified.
- [ ] Accessibility checks are run.
- [ ] Visual regression is reviewed.
- [ ] Performance is acceptable for the task.
- [ ] Human task walkthrough is completed for meaningful workflows.
- [ ] No unresolved blocker remains.
- [ ] Accepted risks have owner and rationale.

## Human usability pass

1. Use the application without developer tools.
2. Complete the primary task with a representative user scenario.
3. Record hesitation, uncertainty, errors and workarounds.
4. Repeat with realistic non-ideal data.
5. Verify keyboard-only operation for key tasks.
6. Turn observations into defects or explicit design decisions.

## Defect severity

| Severity | Definition | Release handling |
|---|---|---|
| Blocker | Primary task impossible, serious harm or data integrity risk | Must fix |
| High | Major task impairment, access or comprehension issue | Fix or explicit owner acceptance |
| Medium | Noticeable friction or inconsistency | Prioritize |
| Low | Minor cosmetic issue | Backlog |

## Anti-pattern blocklist

- Generic empty state with no next step.
- Silent failure or success with no feedback.
- Disabled action with no understandable reason.
- Destructive action styled as the primary path.
- Raw colors or arbitrary spacing outside tokens.
- Placeholder copy in shipped UI.
- Mouse-only essential workflow.
- Loading indicator that causes avoidable layout shift.
- Chart without units, context or readable labels.
- A screenshot-only claim of functional correctness.
