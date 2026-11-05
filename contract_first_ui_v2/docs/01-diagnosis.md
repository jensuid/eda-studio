# 01 — Diagnosis: why agent-built UI fails

## Core diagnosis

A coding agent can generate working components without making coherent product and UX decisions. The interface then reflects implementation convenience or the data model rather than the user's task.

```text
Intent in prose
  -> implicit assumptions
  -> component-by-component implementation
  -> late visual review
  -> expensive rework
```

## Six recurring failure modes

| Failure | Typical symptom | Framework countermeasure |
|---|---|---|
| Lossy translation | Requirements become code without reviewable decisions | Contracts at G1–G4 |
| Happy-path gravity | Empty, partial, error and restricted states are missing | G3 state matrix |
| No visual feedback | Agent claims "clean and responsive" without evidence | G5 screenshots and critique |
| Bottom-up composition | Components look acceptable but screen hierarchy is weak | Architecture and region tree |
| No task model | UI mirrors database fields rather than user priorities | Job contract and task flow |
| Review bias | Builder approves its own work | Independent Critic and QA |

## Additional risks in larger applications

1. **Fragmented information architecture:** each feature creates its own navigation and terminology.
2. **Component duplication:** similar controls behave differently across modules.
3. **Interaction inconsistency:** keyboard, validation, confirmation and feedback patterns vary.
4. **Permission ambiguity:** hidden, disabled and unavailable actions are treated inconsistently.
5. **Uncontrolled change:** a screen change silently breaks shared components or downstream flows.
6. **False confidence from screenshots:** a static image cannot prove behavior, accessibility or performance.

## Complexity assessment

Score each dimension 0–2.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Screens | 1–2 | 3–8 | >8 |
| Roles | One | Two or three | Many / complex permissions |
| Workflow risk | Reversible | Some consequential actions | Financial, destructive or regulated |
| Data complexity | Static/simple | Dynamic | Large, partial, asynchronous |
| Module coupling | Standalone | Some shared areas | Many shared modules |

Suggested interpretation:
- **0–3:** Lite
- **4–6:** Standard
- **7–10:** Full

This is a routing aid, not a scientific score. A single high-risk action can justify Full rigor regardless of total.

## Diagnosis rule

Do not solve upstream problems with downstream polish. If users cannot tell what to do, revisit the job and hierarchy before changing colors or shadows.
