# ADR 0006: Motion tokens and springs

- Status: Accepted
- Date: 2026-09-25

## Context

Before 0.4, components chose durations and curves individually. The catalog used Tailwind's default `ease-out`, `duration-200` and `duration-300`, a hand-tuned bezier in Nudge, and a separate shimmer keyframe in each working-state component. The results were close but not consistent, and a product team had no way to adjust motion globally or reuse it in their own screens.

Browsers now support `linear()` easing, which can approximate a physical spring in CSS without JavaScript.

## Decision

Motion is part of the theme.

- `src/app.css` defines six durations (`--duration-instant` through `--duration-ambient`), a `--stagger` step, and easing curves. It overrides Tailwind's `--ease-out`, `--ease-in`, and `--ease-in-out`, so existing utilities adopt the house curves.
- Three springs (`--ease-spring`, `--ease-spring-snappy`, `--ease-spring-bouncy`) are sampled from a damped oscillator by `scripts/motion-curves.mjs`. Each has a paired `--duration-spring*` token equal to its settling time. A contract test fails when the CSS drifts from the generator.
- Shared keyframes cover entrances (`fade-in`, `rise-in`, `blur-in`, `scale-in`) and ambient loops (`shimmer`, `breathe`, `float`).
- The Motion registry item mirrors every token in TypeScript and provides Svelte transitions, a scroll reveal attachment, and pointer attachments. A unit test fails when the JavaScript values differ from the CSS.

Usage rules:

- Enter with `ease-out` or a spring. Exit faster with `ease-in`.
- Springs animate scale and position only. Color and opacity must not overshoot.
- Looping motion indicates AI activity, AI presence, or a working state. Other idle interfaces hold still. Continuous motion that runs longer than five seconds beside other content offers a way to stop it (WCAG 2.2.2), such as the `paused` props on TextRotate and Marquee and `ambient={false}` on Presence.
- Reduced motion completes CSS motion immediately and cancels start delays, turns Svelte transitions into a short crossfade, never hides content behind a scroll reveal, and disables pointer effects.

## Consequences

Consumers can retune the whole catalog by changing a handful of variables. Components that use the new utilities require the 0.4 theme; the changelog lists this as a theme migration.

`linear()` is unsupported in browsers older than Safari 17.2, Chrome 113, and Firefox 112. Those browsers ignore the declaration and fall back to the default timing function, which still completes the transition.
