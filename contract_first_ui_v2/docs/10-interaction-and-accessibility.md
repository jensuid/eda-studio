# 10 — Interaction and Accessibility Standards

## Interaction contract

Every meaningful control must define:
1. Trigger: click, keyboard, input, gesture or system event.
2. Preconditions: when it is available.
3. Result: state or navigation change.
4. Feedback: what the user perceives.
5. Failure: what can go wrong.
6. Recovery: retry, undo, edit or escape route.

## Interaction states

Use applicable states:
- Default.
- Hover (pointer devices).
- Focus-visible.
- Pressed / active.
- Selected.
- Disabled, with reason where useful.
- Loading / pending.
- Success.
- Error.
- Read-only.

Not every component needs every state. State behavior must match platform conventions.

## Forms

- Label every field.
- Explain required vs optional fields.
- Validate at an appropriate time; do not surprise users with premature errors.
- Preserve valid input after recoverable failures.
- Associate error messages with fields.
- Use actionable, specific messages.
- Prevent duplicate submission when an operation is pending.

## Destructive and consequential actions

- Make consequence clear before commitment.
- Confirmation must identify the object and consequence.
- Use undo when safe and technically reliable.
- Do not use confirmation dialogs as a substitute for clear workflow design.
- Re-authentication or additional authorization must follow product/security policy.

## Keyboard and focus

- Essential tasks must be keyboard operable.
- Focus order follows reading and task order.
- Focus indicator is visible.
- Focus is moved intentionally after navigation, dialogs and dynamic updates.
- Focus returns to a logical origin when overlays close.
- Shortcuts must not conflict with platform conventions and should be discoverable.

## Accessibility baseline

- Semantic names, roles and values.
- Text alternatives for meaningful non-text content.
- Sufficient contrast.
- Text resizing and layout resilience.
- No color-only meaning.
- Screen-reader announcements for important dynamic changes.
- Reduced-motion support.
- Adequate target size for touch interfaces.
- Keyboard access for all essential functions.

Use WCAG 2.2 AA as a practical web-content baseline where applicable, while also respecting native platform accessibility conventions. Automated tools detect only part of accessibility issues; manual keyboard and assistive-technology checks remain necessary.
