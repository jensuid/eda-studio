# 09 — Design System & Component Contract

## Purpose

Turn visual consistency from a collection of preferences into reusable and enforceable rules.

## Token categories

At minimum define:
- Color: surface, text, border, accent and semantic status.
- Typography: family, scale, weight and line height.
- Spacing: bounded scale and layout gaps.
- Sizing: control heights, icon sizes and content widths.
- Shape: radius and border widths.
- Elevation: shadows or layering rules.
- Motion: duration, easing and reduced-motion behavior.

Use semantic token names such as `text-primary`, `surface-raised` and `status-warning`; avoid names tied only to a specific hex value.

## Component contract

For each shared component document:
- Purpose and when to use it.
- Variants and sizes.
- Required and optional properties.
- States: default, hover, focus, pressed, disabled, loading, error.
- Keyboard and accessibility behavior.
- Content and truncation rules.
- Do / don't examples.

## Pattern library

Prioritize patterns that recur:
- Navigation.
- Data tables.
- Forms and validation.
- Search and filters.
- Empty and error states.
- Confirmation and undo.
- Notifications.
- Charts and metric summaries.
- Progress and background tasks.

## Governance

- New token or variant requires a use case.
- Prefer extending a shared component over copying it.
- Domain-specific components should remain in their module until reuse is proven.
- Record exceptions and a removal/review condition.
- Enforce raw style restrictions with lint where feasible.

## Data visualization

Specify chart purpose before chart type. Include title, units, axes, legend, empty state, loading state, accessible summary and a non-color-only distinction. Never rely on decorative chart styling to communicate a business conclusion.
