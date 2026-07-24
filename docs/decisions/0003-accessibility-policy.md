# ADR 0003: Accessibility verification policy

- Status: Accepted
- Date: 2026-07-24

## Context

Headless primitives provide a strong base, but Mizu also owns custom keyboard behavior, announcements, timers, motion, and composed demos. Static markup checks cannot establish all of those behaviors, and automated tools cannot replace assistive-technology review.

## Decision

- Every core docs route is checked with axe in light and dark modes on desktop and mobile viewports.
- Custom interactive components receive focused keyboard and state tests.
- Streaming Text exposes stable complete text to assistive technology while its visual reveal is hidden from the accessibility tree. Reduced motion reveals the visual content immediately.
- Clipboard failure, status changes, disabled controls, and dismissals must have visible and programmatic feedback.
- Timer and observer behavior must include teardown coverage.
- Representative manual keyboard and VoiceOver review is required before declaring a new stable minor line. The review result belongs in the release issue or notes.

Automated checks are release gates. Manual assistive-technology review is a maintained checklist and must not be described as automated proof.

## Consequences

Accessibility regressions in covered behavior fail CI. Novel components need an explicit behavior contract before implementation. A passing axe result is evidence for the rules it checks, not a claim of complete accessibility.
