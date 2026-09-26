# Roadmap

Mizu uses milestones and labeled issues for committed work. This file describes direction, not delivery dates.

## Current priorities

- Keep every registry item installable in a clean supported SvelteKit project.
- Grow deterministic visual coverage for canonical component and block states, starting with Presence, Tabs, and the App components.
- Complete periodic keyboard and screen-reader review of custom interactions, including the 0.4 motion and app components and the 0.5 interaction components.
- Improve generated component API metadata without increasing client payload.
- Maintain reproducible registry releases, dependency hygiene, and incident readiness.

## Direction

- **Theme as a registry item.** Install and upgrade `app.css` tokens through the CLI instead of copying the file by hand.
- **Feedback beyond sight.** Optional, off-by-default sound and haptic cues that follow the motion tokens and respect system settings.
- **More surfaces.** Settings, pricing, onboarding, and notification blocks for apps and websites, built from the existing catalog.
- **Presence expressions.** Additional states for errors, confusion, and celebration, reviewed for clarity with assistive technology.

## Component requests

New components are evaluated against demonstrated product use, accessibility behavior, maintenance cost, overlap with existing primitives, and fit with the Mizu design language. Breadth does not take priority over the reliability of the existing catalog.

Accepted work should have a milestone or an explicit maintainer note. Unscheduled requests remain proposals and are not promises.
