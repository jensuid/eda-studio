# 02 — The Framework: operating six gates

## Operating principles

- Contracts are decision records, not paperwork.
- Review the smallest artifact that resolves the uncertainty.
- A gate may be tailored, but skipped decisions must be explicitly marked as already decided, not silently omitted.
- Contracts can change during implementation; changes require impact review.
- A prototype may precede approval only when clearly marked exploratory and disposable.

## Application-level layer

For new or complex applications, complete the Application Architecture Contract before G1. It defines product-wide navigation, modules, roles, shared patterns and boundaries. See [08 — Application Architecture](08-application-architecture.md).

For a small isolated feature, reference the existing architecture instead of recreating it.

## Gate 1 — Job Contract

**Question:** Who is trying to accomplish what, under which conditions, and what counts as success?

Required fields:
- Actor and relevant context.
- Trigger and frequency / volume.
- Job expressed as an action or decision.
- Inputs and information needed.
- Desired outcome and measurable signal.
- Failure cost.
- Explicit non-goals and things to remove.

Exit criteria:
- One primary job is clear.
- The job is not merely a feature name.
- Success and failure are observable.
- At least two non-goals are considered.

## Gate 2 — Flow Contract

**Question:** What path does the user take, including exceptions and recovery?

Specify:
- Entry points and preconditions.
- Screens / steps and their purpose.
- Transitions, triggers and effects.
- Feedback after each meaningful action.
- Failure branches and recovery.
- Exit / completion conditions.
- Back, cancel and resume behavior.

Exit criteria:
- Golden path is understandable.
- Every screen has entry and exit.
- Important failure branches are represented.
- No dead ends or ambiguous transitions remain.

## Gate 3 — Screen & Interaction Contract

**Question:** What information appears, what matters most, and how does every control behave?

Specify:
- Region tree and responsive/adaptive layout.
- Primary action and hierarchy.
- Removed elements and rationale.
- Data states per region.
- Interaction states and keyboard behavior.
- Validation, feedback, confirmation and undo.
- Copy deck and terminology.
- Accessibility and permission behavior.

Eight data states remain a strong default: loading, empty-first-run, empty-filtered, partial, error, long-content, restricted and done. Add domain-specific states such as processing, cancelled, stale, offline or conflict where relevant. Do not force irrelevant states onto static regions.

Exit criteria:
- No important behavior is left to agent invention.
- Each data region has applicable states.
- Controls have a defined result and feedback.
- Content hierarchy supports the primary job.

## Gate 4 — Design System & Component Contract

**Question:** Which visual and component rules must remain consistent?

Specify:
- Tokens: color, typography, spacing, sizing, radius, border, elevation and motion.
- Semantic colors and contrast intent.
- Component inventory and approved variants.
- Usage and composition rules.
- Data visualization and table conventions where applicable.
- Anti-patterns and exceptions.
- Enforcement mechanism (lint, tests, review).

Exit criteria:
- Tokens have semantic names and usage guidance.
- Shared components are reused where appropriate.
- Variants are intentional, not arbitrary.
- Rules are discoverable by the Builder and enforceable where practical.

## Gate 5 — Slice & Critique

Build one representative vertical slice before broad implementation.

The slice should exercise:
- Primary task.
- At least one important edge state.
- Shared components.
- Responsive/adaptive behavior.
- Keyboard and focus path.
- Representative data.

Review:
1. Visual hierarchy and alignment.
2. Task clarity and interaction behavior.
3. State handling.
4. Accessibility.
5. Error recovery.
6. Consistency with contracts.

Critic must be independent of the implementation context. It must distinguish confirmed defects, risks and subjective suggestions. Do not impose an arbitrary minimum defect count; a clean result is possible if evidence supports it.

Exit criteria:
- Blockers resolved.
- High-severity defects resolved or explicitly accepted by owner.
- Contract gaps updated.
- Slice becomes the reference implementation.

## Gate 6 — Build & Audit

Implement remaining screens using approved contracts and the reference slice.

Audit layers:
- Contract conformance.
- Functional and interaction tests.
- Visual regression at representative sizes/states.
- Accessibility checks.
- Performance and perceived responsiveness.
- Human task walkthrough.

Exit criteria:
- Acceptance criteria pass.
- No unresolved blocker.
- High defects have owners and explicit disposition.
- Relevant tests and evidence are attached.

## Cross-cutting role separation

Designer decides and documents. Builder implements. Critic challenges the result. QA verifies behavior and acceptance. One agent may perform multiple roles sequentially, but Critic must use a fresh context or independent review setup.

## Evidence discipline

Every finding must be labelled:
- **Confirmed:** reproduced or directly evidenced.
- **Likely:** evidence suggests a defect but reproduction is incomplete.
- **Suggestion:** improvement idea, not a defect.

Evidence can be contract reference, screenshot, test output, source location or observed task result.

## Stop rule

Stop implementation and ask for a decision when:
- A contract conflicts with product behavior or existing architecture.
- A permission or destructive-action rule is ambiguous.
- Required data or states are undefined.
- A shared component change has broad impact not yet assessed.

Do not invent consequential product behavior to keep coding.
