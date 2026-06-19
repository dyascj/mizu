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

## Adding a component

1. Build it in `src/lib/components/ui/<name>/` (`<name>.svelte` plus an `index.ts`), following the existing patterns: `tailwind-variants` for variants, bits-ui for behavior, the `cn` helper, and the `glass` / `gloss` / `gradient-*` / `shadow-*` tokens from `src/app.css`.
2. List it in `src/lib/site/components.json` (slug, name, category, description).
3. Add a demo in `src/lib/site/demos/<name>.svelte`.
4. Run `pnpm registry:build` to regenerate `static/r`.
5. `pnpm check && pnpm build`, then `pnpm format`.

## Conventions

- Svelte 5 runes only (no `export let`, no `on:` directives).
- Tailwind v4. The brand derives from a single `--primary` token, so use `--primary`-driven classes for accents.
- Keep the repo free of secrets.
