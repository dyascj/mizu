# Mizu contributor guide for agents

This file is for AI coding agents working on the Mizu repo itself. If you are building an app WITH Mizu, use the consumer guide at https://mizu-ui.com/AGENTS.md instead.

Mizu is the design system for AI products: a shadcn-style Svelte 5 component library plus its docs site (mizu-ui.com). Stack: SvelteKit 2, Svelte 5 runes, Tailwind v4, bits-ui, tailwind-variants, pnpm, Node 22.

## Commands

```bash
pnpm install
pnpm dev              # docs site + live previews on localhost:5183
pnpm check            # type-check (svelte-check)
pnpm lint             # prettier check (CI fails on this)
pnpm format           # prettier write
pnpm registry:build   # regenerate static/r (CI fails if stale)
pnpm new:component <slug> "<Name>" <Category> "<Description>"   # scaffold a component
```

Always run `pnpm registry:build` after touching components, blocks, or the catalog, and commit the regenerated `static/r/*.json`.

## Design rules (every change must follow these)

- No strokes. Depth comes from shadows and gray fills in light mode and tonal surface rungs in dark mode, never borders. No `dark:border` fallbacks. Exceptions: `outline` variants, dashed empty states, table row dividers.
- One accent, `--primary`. Active states are `bg-primary-muted text-primary`; everything else stays quiet gray.
- `orb-*` and `aurora-*` washes mark AI moments only, never chrome.
- Nothing heavier than `font-semibold`. Titles semibold with tight tracking, labels medium, body regular. Single-line controls are pills; multi-line fields are `rounded-2xl`.
- Motion is 200-320ms ease-out, shimmer sweeps are 2s, everything respects `prefers-reduced-motion`.

## Structure

- `src/lib/components/ui/<slug>/` holds each component with an `index.ts` barrel.
- `src/lib/site/components.json` is the catalog source of truth; demos auto-glob by slug from `src/lib/site/demos/`.
- Blocks are single self-contained files in `src/lib/site/blocks/` (only import `$lib/components/ui/*`), listed in `src/lib/site/blocks.json`.
- Theme tokens live in `src/app.css` and map through `@theme inline`. Never hardcode hex values in markup.
- `src/routes/llms.txt/+server.ts` and `src/routes/AGENTS.md/+server.ts` generate the machine-readable docs from the catalog; they update themselves.

## Conventions

- Svelte 5 runes only: `$props()`, `$state`, `$derived`, snippets. No `export let`, no `on:` directives.
- lucide icons only, imported per icon: `import Check from '@lucide/svelte/icons/check'`.
- No em dashes anywhere, including comments. No emojis. Titles use the "middle dot" separator.
- When stock shadcn-svelte already solved a behavior, lift it and reskin (see CONTRIBUTING.md) instead of rebuilding.
- Keep the repo free of secrets.

CONTRIBUTING.md has the long-form version of all of this.
