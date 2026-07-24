# 0001: Visual boundaries and color exceptions

Status: accepted

## Decision

Mizu avoids decorative strokes. Surface hierarchy should come from spacing, tonal fills, and soft elevation.

Strokes remain appropriate when they communicate structure or state:

- outline control variants;
- focus and invalid-state indicators;
- dashed empty and drop targets;
- table, list, menu, accordion, and timeline separators;
- panel edges that must remain distinct over arbitrary content;
- native control geometry and transparent scrollbar hit areas.

These boundaries use semantic theme tokens. They are not a substitute for layout or elevation.

Hardcoded component colors are limited to the documented AI aura palette in Aurora, Aura Tile, and Voice Orb. General-purpose feedback and control components derive color from semantic tokens, including `--primary`.

## Enforcement

Repository contracts reject value imports from the Lucide package barrel, stale absolute design claims, and hardcoded legacy Gauge colors. Visual review remains required for whether a semantic stroke is necessary.
