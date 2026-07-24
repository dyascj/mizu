# ADR 0005: Merge commits with protected main

- Status: Accepted
- Date: 2026-07-24

## Context

Mizu needs required checks and a review boundary without inventing independent approval while only one maintainer is active. Allowing merge commits, squash merges, and rebase merges at the same time also makes repository history inconsistent.

## Decision

All routine changes use focused topic branches and pull requests. GitHub requires the `verify`, `browser`, and `analyze` checks, up-to-date branches, and resolved review conversations. Force pushes and deletion of `main` are blocked.

Merge commits are the sole enabled merge strategy. They preserve the focused commits on a topic branch and give each completed change an explicit integration point. GitHub deletes merged branches automatically.

While Mizu has one maintainer, no approving review is required and administrators retain an emergency bypass. When a second active maintainer is available, the required approval count becomes one and the bypass policy is reviewed.

## Consequences

Routine changes cannot land on `main` before the full trust suite passes. History includes explicit merge commits rather than remaining linear. Emergency owner actions remain possible and must be followed by a normal issue or pull-request record when the service is restored.
