# 06 — Worked Example: Invoice Review Queue

This example demonstrates the framework end-to-end. It is illustrative, not a universal invoice workflow.

## Context

A clerk reviews incoming vendor invoices. The key job is to decide whether an invoice needs approval, rejection or further investigation.

## Architecture snapshot

- Module: Accounts Payable.
- Screen: Invoice Queue and Invoice Detail.
- Role: Clerk can review; approver can approve; viewer is read-only.
- Shared patterns: dense data table, status badge, confirmation, toast with undo where safe.

## Gate 1 — Job Contract

```yaml
job: Review invoices that need a decision
actor: Accounts-payable clerk processing about 40 invoices per day
trigger: New invoices enter the review queue
inputs: [invoice identity, amount, vendor, PO match, risk flags, history]
desired_outcome: Correctly route each invoice without losing place in the queue
success_signal: Median time to decision and rate of incorrect approvals
failure_cost: Duplicate or incorrect payment; delayed payment
not_in_scope:
  - Create invoices: handled by ingestion workflow
  - Configure accounting rules: handled by administrators
```

## Gate 2 — Flow Contract

```text
Queue
  -> Open invoice
      -> Review details
          -> Approve (authorized)
              -> Confirmation / undo window
              -> Return to queue, preserve position
          -> Reject
              -> Require reason
              -> Return to queue
          -> Needs investigation
              -> Assign / flag
              -> Return to queue
```

Failure branches:
- Stale invoice: reload latest version before decision.
- Missing PO: show explicit "No PO" and route to investigation.
- Restricted role: explain required permission.
- Save failure: preserve input and allow retry.

## Gate 3 — Screen Contract: Queue

Primary action: Open row.

Removed:
- New Invoice button: creation belongs to ingestion.
- Inline approve: decision needs detail context.
- Column chooser: fixed columns cover the primary job.
- Kanban: status is a queue, not a sequence of stages.

Hierarchy:
1. Invoice identity and amount.
2. Status and age.
3. Vendor and PO match.
4. Secondary metadata.

States:
- Loading: skeleton rows matching final column widths.
- Empty first-run: explain source connection and import action.
- Empty filtered: summarize active filters and offer clear filters.
- Partial: show "Unknown vendor" / "No PO", not blank cells.
- Error: retry while preserving filters and scroll context.
- Long: truncate vendor safely; preserve amount visibility; paginate or virtualize.
- Restricted: row remains visible; action explains missing role.
- Done: remove or update row optimistically; preserve queue position and recover on failure.

Interaction:
- Row opens with click, Enter or Space when focused.
- Focus returns to originating row after detail closes.
- Approval occurs in detail, with object and amount named in confirmation.
- Stale version blocks approval until refreshed.

## Gate 4 — Design System

- Neutral table surface with clear row separators.
- One primary accent for the main affordance.
- Semantic warning color for payment risk.
- Amounts right-aligned with tabular numerals.
- Minimum readable type size appropriate to the platform.
- Status uses text plus color, never color alone.

## Gate 5 — Slice & Critique

Test the queue at narrow and wide supported window sizes, populated, empty, error and long-content states.

Example findings:
- Blocker: long vendor name pushes amount out of view.
- High: PO mismatch warning indistinguishable from metadata.
- High: keyboard focus lost after returning from detail.
- Medium: empty-filtered state does not reveal active filters.

Fix contract gaps before patching implementation.

## Gate 6 — Audit

Acceptance:
- Clerk can open and review an invoice.
- Unauthorized user cannot approve and receives an explanation.
- Stale invoice cannot be approved.
- Failed save preserves context.
- Queue position is preserved after completion.
- Keyboard-only path works.
- Relevant visual and accessibility checks pass.

Measure median time-to-decision and incorrect approval rate with representative users. Do not treat illustrative timings as measured results.
