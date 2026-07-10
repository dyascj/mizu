# Contributing to Mizu

Thanks for helping make Mizu better.

## Development

```bash
pnpm install
pnpm dev      # docs site + live previews on localhost:5183
pnpm check    # type-check (svelte-check)
pnpm lint     # prettier check
pnpm format   # prettier write
```

## The design rules

Mizu is a design system for AI products. Every contribution has to speak the same language:

- **No strokes.** Depth comes from the surface ladder, never borders. Light mode: white surfaces with soft ambient shadows and gray fills. Dark mode: tonal rungs (`#000` page, card, popover, hover), no `dark:border` fallbacks. Semantic exceptions only: `outline` variants, dashed empty states, table row dividers.
- **One accent.** `--primary` blue for the active thing; active states are `bg-primary-muted text-primary`. Everything else is quiet gray.
- **Auras are for AI moments.** The `orb-*` and `aurora-*` washes mark where intelligence lives (voice, generation, presence), never chrome.
- **Nothing heavier than semibold.** Titles are semibold with tight tracking, labels are medium, body is regular. Controls are pills; multi-line fields are `rounded-2xl`.
- **Motion is quiet and honest.** 200-320ms ease-out entrances, 2s shimmer sweeps for working states, and everything respects `prefers-reduced-motion`.

## Adding a component

The fast way:

```bash
pnpm new:component my-widget "My Widget" AI "One-line description."
```

That scaffolds `src/lib/components/ui/my-widget/` (component + `index.ts`), a demo at `src/lib/site/demos/my-widget.svelte`, and the catalog entry in `src/lib/site/components.json`. Then:

1. Build the component: `tailwind-variants` for variants, bits-ui for behavior, the `cn` helper, and tokens from `src/app.css`.
2. Make the demo show the component doing its real job in an AI product.
3. `pnpm registry:build` to regenerate `static/r`, then `pnpm check && pnpm lint`.

CI fails if `static/r` is stale, so always commit the rebuilt registry.

## Lifting from shadcn-svelte

When stock shadcn-svelte already solved the behavior, lift it instead of rebuilding: fetch `https://shadcn-svelte.com/registry/<name>.json`, extract the file contents, resolve `$UI$` / `$UTILS$` / `$HOOKS$` placeholders to `$lib/...`, then reskin to the design rules above (strip borders, blue-wash actives, hide scrollbars). The sidebar, calendar, and drawer all arrived this way.

## Blocks

Whole screens live in `src/lib/site/blocks/` and are listed in `src/lib/site/blocks.json`. Each block must be a single self-contained `.svelte` file that only imports `$lib/components/ui/*`, because visitors copy the file verbatim and the registry installs it with its dependency tree.

## Conventions

- Svelte 5 runes only (no `export let`, no `on:` directives).
- Tailwind v4; theme tokens live in `src/app.css` and map through `@theme inline`.
- lucide icons only, imported per-icon (`@lucide/svelte/icons/<name>`).
- No em dashes anywhere, including comments.
- Keep the repo free of secrets.
