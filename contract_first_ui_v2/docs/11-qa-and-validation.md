# 11 — QA and Validation Standards

## Four validation layers

### 1. Contract conformance
Does the implementation match approved structure, copy, states, behavior and tokens?

### 2. Functional and interaction QA
Do actions produce correct outcomes? Are validation, permissions, errors, cancellation and recovery correct?

### 3. Visual and accessibility QA
Do hierarchy, layout, typography, contrast, focus and responsive/adaptive behavior work at supported sizes?

### 4. Usability validation
Can representative users complete the primary task without avoidable confusion?

## Test matrix

For each screen, select applicable combinations of:
- State: normal, loading, empty, partial, error, restricted, long and domain-specific.
- Viewport/window: minimum supported, typical and wide.
- Role: authorized and unauthorized where relevant.
- Input: mouse, keyboard and assistive technology where applicable.
- Data: typical, boundary, missing and unusually long.

Do not multiply every dimension blindly. Use risk-based coverage and record exclusions.

## Visual regression

- Capture screenshots at declared sizes and states.
- Keep build, environment, data fixture and viewport consistent.
- Compare meaningful changes; do not blindly approve pixel diffs caused by nondeterminism.
- Treat screenshot evidence as visual evidence only, not proof of functional correctness.

## Accessibility testing

Combine automated checks with:
- Keyboard-only walkthrough.
- Focus order and visibility.
- Screen-reader spot checks for critical workflows.
- Contrast and zoom/reflow review.
- Dynamic announcement testing.

## Performance UX

Measure user-perceived behavior:
- Time to first useful content.
- Feedback delay after action.
- Progress visibility for long tasks.
- Ability to cancel or continue working.
- Layout stability.
- Recovery after timeout or failure.

## Release decision

- **PASS:** acceptance criteria met; no unresolved blocker.
- **PASS WITH ACCEPTED RISKS:** remaining risks have owner, rationale and follow-up.
- **FAIL:** blocker, unverified critical behavior or material contract deviation remains.

A test not run is not a pass.
