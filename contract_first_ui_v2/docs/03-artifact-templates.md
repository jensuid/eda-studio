# 03 — Artifact Templates

Use only the templates relevant to the feature. Keep artifacts concise enough to review.

## 1. Application Architecture Contract

```yaml
application: "<name>"
product_goal: "<outcome>"
platforms: ["desktop"]
roles:
  - name: "<role>"
    goals: ["<goal>"]
modules:
  - id: "<module>"
    purpose: "<purpose>"
    primary_tasks: ["<task>"]
navigation:
  model: "<sidebar | tabs | command | other>"
  hierarchy:
    - label: "<label>"
      route_or_view: "<id>"
shared_patterns:
  - "<pattern>"
boundaries:
  - "<module ownership / dependency rule>"
open_questions: []
```

## 2. Job Contract

```yaml
job: "<verb phrase>"
actor: "<person + context + volume>"
trigger: "<what starts the job>"
frequency: "<how often>"
inputs: ["<information needed>"]
desired_outcome: "<observable result>"
success_signal: "<measure>"
failure_cost: "<concrete consequence>"
not_in_scope:
  - item: "<thing deliberately excluded>"
    reason: "<why>"
```

## 3. Flow Contract

```yaml
flow: "<name>"
entry: "<entry point>"
steps:
  - id: "<step>"
    purpose: "<verb>"
    preconditions: ["<condition>"]
    action: "<user action>"
    effect: "<system effect>"
    feedback: "<visible response>"
    next: ["<step or terminal state>"]
branches:
  - when: "<failure / alternate condition>"
    destination: "<recovery step>"
    recovery: "<how user proceeds>"
completion: "<observable completion>"
cancel_and_back: "<behavior>"
```

## 4. Screen & Interaction Contract

```yaml
screen: "<screen-id>"
purpose: "<verb phrase>"
primary_action: "<verb>"
removed:
  - item: "<element>"
    reason: "<why it is unnecessary or harmful>"
hierarchy:
  1: "<highest priority>"
  2: "<second>"
regions:
  - id: "<region>"
    content: ["<content>"]
    states:
      loading: "<specific treatment>"
      empty_first_run: "<specific treatment>"
      empty_filtered: "<specific treatment>"
      partial: "<specific treatment>"
      error: "<specific treatment>"
      long_content: "<specific treatment>"
      restricted: "<specific treatment>"
      done: "<specific treatment>"
interactions:
  - control: "<control>"
    trigger: "<click / keyboard / input>"
    precondition: "<when available>"
    result: "<system behavior>"
    feedback: "<visible feedback>"
    disabled_reason: "<reason, if disabled>"
    undo_or_recovery: "<behavior>"
keyboard:
  tab_order: "<sequence>"
  shortcuts: []
  focus_after_action: "<destination>"
validation:
  - field_or_action: "<target>"
    rule: "<rule>"
    message: "<literal message>"
copy:
  title: "<literal>"
  primary_action: "<literal>"
  error: "<literal>"
accessibility:
  name_and_role: "<requirement>"
  contrast: "<requirement>"
  announcements: "<requirement>"
responsive_or_adaptive:
  narrow: "<behavior>"
  default: "<behavior>"
  wide: "<behavior>"
```

## 5. Design System Contract

```yaml
system: "<name>"
tokens_source: "<path>"
principles: ["<principle>"]
components:
  - name: "<component>"
    purpose: "<purpose>"
    variants: ["<variant>"]
    do: ["<usage rule>"]
    dont: ["<anti-pattern>"]
semantic_colors:
  success: "<token>"
  warning: "<token>"
  danger: "<token>"
  info: "<token>"
typography:
  scale: ["<token>"]
spacing:
  base_unit: "<unit>"
exceptions:
  - "<approved exception and reason>"
enforcement:
  lint: "<rule>"
  visual_review: "<method>"
```

## 6. Critic Report

| ID | Classification | Severity | Contract reference | Evidence | Expected | Actual | Recommendation |
|---|---|---|---|---|---|---|---|
| D-01 | Confirmed | High | screen.states.error | screenshot/test | ... | ... | ... |

Severity:
- Blocker: prevents primary task or creates serious harm.
- High: materially impairs task, data integrity, access or comprehension.
- Medium: causes friction or inconsistency.
- Low: cosmetic or minor refinement.

Also record:
- Tested viewport and state.
- Browser / runtime and build identifier.
- Not-defects and accepted trade-offs.
- Reviewer confidence.

## 7. QA Acceptance Record

```yaml
feature: "<name>"
build: "<commit / version>"
contracts:
  architecture: "<path or n/a>"
  job: "<path>"
  flow: "<path or n/a>"
  screens: ["<path>"]
tests:
  functional: "<pass/fail + evidence>"
  interaction: "<pass/fail + evidence>"
  accessibility: "<pass/fail + exceptions>"
  visual: "<pass/fail + viewports>"
  performance: "<pass/fail + measurement>"
human_task_walkthrough:
  task: "<task>"
  result: "<complete / incomplete>"
open_defects:
  - id: "<id>"
    severity: "<level>"
    disposition: "<fix / accept / defer>"
approval: "<owner>"
```

## 8. Artifact linking convention

Use stable IDs and relative links. Example:
- `APP-ARCH-001`
- `JOB-INV-001`
- `FLOW-INV-001`
- `SCREEN-INV-QUEUE`
- `DS-CORE-001`
- `QA-INV-001`

Keep a requirement-to-screen-to-test traceability table for complex features.
