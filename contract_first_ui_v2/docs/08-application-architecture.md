# 08 — Application Architecture Contract

## Purpose

Define the product-wide structure before designing individual screens. This layer is mandatory for new applications and recommended when a feature crosses modules, roles or navigation boundaries.

## What it covers

1. Product goal and target users.
2. Information architecture and navigation.
3. Module responsibilities and boundaries.
4. User roles and permission model.
5. Shared UI patterns and component ownership.
6. Cross-module workflows and dependencies.
7. Platform constraints and adaptive behavior.

## Design rules

- Organize navigation around user tasks and mental models, not database tables.
- Give each module a clear purpose and ownership.
- Define shared patterns once; avoid module-specific reinvention.
- Distinguish navigation visibility from authorization.
- Specify what happens when a user opens a deep link without permission.
- Avoid designing every screen at this stage; defer screen detail to G3.

## Review questions

- Can a user predict where a task belongs?
- Are module boundaries understandable?
- Are roles and permissions consistent?
- Which components are global and which are domain-specific?
- What changes could affect multiple modules?

## Output

Use the Application Architecture template in [03 Artifact Templates](03-artifact-templates.md). Keep a diagram or navigation tree when it materially improves review.

## Desktop-specific considerations

For desktop applications, explicitly decide:
- Main window structure and minimum supported size.
- Navigation persistence and workspace model.
- Resizable panes and split views.
- Keyboard shortcuts and command access.
- Dialog ownership and focus return.
- Multi-window behavior, if supported.
- Offline, local processing and long-running task feedback, where applicable.
