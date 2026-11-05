# 07 — Adoption, Metrics and Process Health

## Adoption levels

### Lite

For a small, low-risk change:
1. Identify the existing job and contract.
2. Update the relevant Screen Contract section.
3. Implement.
4. Run focused interaction and visual checks.

### Standard

For a feature:
1. Job Contract.
2. Flow Contract when workflow changes.
3. Screen & Interaction Contracts.
4. Reuse existing design system.
5. Slice and independent critique.
6. QA and audit.

### Full

For a new application or complex feature:
- Application Architecture.
- All six gates.
- Design system and component contract.
- Full QA and governance.

## Metrics

Leading indicators:
| Metric | Suggested target | Interpretation |
|---|---|---|
| Relevant screens with approved contract before implementation | 100% | Prevents silent design decisions |
| Applicable states specified | 100% | Avoids known state omissions |
| Critical acceptance criteria with tests | 100% | Ensures testability |
| Critic findings with evidence | 100% | Prevents vague feedback |

Outcome indicators:
| Metric | How to use |
|---|---|
| Rework rate | Track substantial screen rebuilds after review or release |
| Task completion | Test whether users complete the primary job |
| Time on task | Compare only equivalent tasks and user groups |
| Error rate | Track user errors and recovery |
| Accessibility defects | Track severity and recurrence |
| Design-system drift | Count unapproved tokens and variants |

Do not set arbitrary universal targets for task time or critic defect counts. Establish a baseline, then set targets from product context.

## First-week rollout

| Day | Activity | Output |
|---|---|---|
| 1 | Select one representative feature and rigor level | Scope decision |
| 2 | Create/review architecture and job/flow contracts | Approved decisions |
| 3 | Create screen and interaction contracts | Screen specification |
| 4 | Build one representative slice | Working reference |
| 5 | Critique, fix and audit | Defect report and lessons |

## Process anti-patterns

- Contract theatre: writing contracts after implementation.
- Over-specification: artifacts too large to review.
- Critic noise: subjective findings presented as defects.
- Permanent exceptions: skipping critical checks by habit.
- Token drift: design rules exist but are not enforced.
- One-context relapse: builder also approves its own work.
- Metric gaming: optimizing time or defect count without user outcome.

## When to skip

Skip artifacts that duplicate approved decisions. Do not skip validation for consequential behavior, permission boundaries, destructive actions or data integrity.
