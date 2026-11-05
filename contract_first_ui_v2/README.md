# Contract-First UI/UX Framework v2

**An operating framework for designing, implementing, and validating application UI/UX with coding agents.**

## 1. Purpose

Contract-First UI prevents interface decisions from being silently invented during implementation. Before UI code is written, decisions are captured in reviewable artifacts, approved, implemented, and verified against evidence.

The framework preserves the original six gates and adds an application-level architecture layer and continuous governance.

## 2. Operating model

```text
Product / feature intent
        |
        v
Application Architecture (when needed)
        |
        v
G1 Job Contract
        |
        v
G2 Flow Contract
        |
        v
G3 Screen & Interaction Contract
        |
        v
G4 Design System & Component Contract
        |
        v
G5 Slice, Prototype & Critique
        |
        v
G6 Build, QA & Audit
        |
        v
Continuous UX Governance
```

**Core rule:** no production UI implementation begins until the relevant contracts have been reviewed. Exploration prototypes are allowed, but must be explicitly labelled disposable.

## 3. Six gates

| Gate | Main decision | Required artifact | Exit condition |
|---|---|---|---|
| 1. Job | Who is doing what, and why? | Job contract | One primary job and measurable outcome |
| 2. Flow | How does the user complete it? | Flow contract | Golden path, branches, exits and recovery are clear |
| 3. Screen & Interaction | What is on screen and how does it behave? | Screen contract | Regions, hierarchy, states, actions and copy are specified |
| 4. Design System | Which shared visual and component rules apply? | Tokens and component contract | Reusable rules are defined and enforceable |
| 5. Slice & Critique | Does the contract work in a real interface? | Working slice and defect report | Blockers resolved or explicitly accepted |
| 6. Build & Audit | Does the implementation conform and work? | QA and conformance report | Acceptance criteria pass |

## 4. Choose the right rigor

| Level | Use when | Minimum process |
|---|---|---|
| Lite | One small screen, copy change, low-risk UI | G3 relevant section → implement → focused check |
| Standard | A feature with several screens or interactions | G1, G2 as needed, G3–G6 |
| Full | New application, complex modules, multiple roles, high-risk workflows | Architecture + all six gates + governance |

Do not create artifacts that do not resolve a real decision. Reuse approved contracts and existing design-system rules.

## 5. Four non-negotiable principles

1. **Decisions before code.** Contracts precede implementation.
2. **States before polish.** Normal, empty, loading, error, restricted and edge conditions are designed.
3. **Evidence over claims.** A defect must point to a contract, test, source location or screenshot.
4. **Independent review.** Critique should use a fresh context or a reviewer that did not implement the screen.

## 6. Repository structure

```text
contract-first-ui/
├── README.md
├── docs/
│   ├── 01-diagnosis.md
│   ├── 02-framework.md
│   ├── 03-artifact-templates.md
│   ├── 04-agent-prompts.md
│   ├── 05-checklists.md
│   ├── 06-worked-example.md
│   ├── 07-adoption-and-metrics.md
│   ├── 08-application-architecture.md
│   ├── 09-design-system.md
│   ├── 10-interaction-and-accessibility.md
│   ├── 11-qa-and-validation.md
│   └── 12-governance.md
└── examples/
    └── README.md
```

## 7. How to start

1. Read [01 Diagnosis](docs/01-diagnosis.md) and [02 Framework](docs/02-framework.md).
2. For a new or complex application, create [Application Architecture](docs/08-application-architecture.md).
3. Copy relevant templates from [03 Artifact Templates](docs/03-artifact-templates.md).
4. Run the role prompts in [04 Agent Prompts](docs/04-agent-prompts.md).
5. Use [05 Checklists](docs/05-checklists.md) as human approval gates.
6. Compare your workflow with [06 Worked Example](docs/06-worked-example.md).
7. Adopt metrics and governance from [07 Adoption](docs/07-adoption-and-metrics.md) and [12 Governance](docs/12-governance.md).

## 8. Framework boundaries

This is a workflow and quality framework, not a substitute for product strategy, domain expertise, formal user research, security review, or engineering architecture. It helps surface decisions and verify implementation; it cannot guarantee usability without representative users and real tasks.

## 9. Version 2 change summary

- Added an application architecture layer for information architecture, navigation, modules and roles.
- Expanded Screen Contract into Screen & Interaction Contract.
- Expanded System Lock into Design System & Component Contract.
- Added explicit interaction and accessibility standards.
- Strengthened visual, functional, usability and regression QA.
- Added change control, traceability and governance.
- Added Lite / Standard / Full adoption levels to avoid unnecessary process overhead.
