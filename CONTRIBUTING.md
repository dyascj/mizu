# Contributing to Mizu

Thanks for helping make Mizu better.

Participation is governed by `CODE_OF_CONDUCT.md`. Use the issue templates and `SUPPORT.md` to keep reports reproducible and route security concerns privately.

## Development

Mizu supports Node 22 and 24 with pnpm 10.28.

```bash
pnpm install
pnpm dev      # docs site + live previews on localhost:5183
pnpm check    # type-check (svelte-check)
pnpm format:check # prettier check
pnpm lint     # semantic ESLint checks
pnpm test     # contract, parser, and component tests
pnpm test:browser # Playwright route and accessibility tests
pnpm build && pnpm build:budget # production build and client size limits
pnpm format   # prettier write
pnpm registry:build # regenerate registry channels and release manifests
pnpm registry:validate # schemas, dependencies, inventory, and integrity
pnpm registry:consumer-check # isolated install and build of all registry items
```

## The design rules

Mizu is a design system for AI products. Every contribution has to speak the same language:

- **No decorative strokes.** Depth comes from the surface ladder. Light mode uses white surfaces with soft ambient shadows and gray fills. Dark mode uses tonal rungs (`#000` page, card, popover, hover). Semantic strokes are reserved for control outlines, focus and invalid states, dashed empty states, dense-content dividers, and panel edges that must remain distinct over arbitrary content. See `docs/decisions/0001-visual-boundaries.md`.
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
3. `pnpm registry:build` to regenerate `static/r`, then run `pnpm check`, `pnpm lint`, and `pnpm test`.

If a component imports a project-local file outside `$lib/components/ui` or `$lib/utils`, declare it in the catalog entry's `registryFiles` list so the consumer receives it. CI fails on unresolved local imports and stale `static/r` output, so always commit the rebuilt registry.

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

## Compatibility and releases

Mizu's public contract includes props, callbacks, compound exports, documented behavior, accessibility semantics, CSS token names, and documented markup assumptions. Read `docs/compatibility.md` before changing one.

- Patch releases must remain backwards compatible.
- Before 1.0, documented breaking changes require a minor version and migration notes.
- Deprecations remain for at least one minor release when correctness and security allow.
- Versioned registry directories are immutable. Never edit or delete `static/r/v*` by hand.
- `/r/latest` follows the current release. `/r/<item>.json` is a legacy compatibility alias.

To prepare a release, update `package.json` and `registry-release.json` to the same version, record the source commit in `generationCommit`, complete every section in `CHANGELOG.md`, and run:

```bash
pnpm registry:build
pnpm registry:validate
pnpm registry:consumer-check
pnpm test
pnpm check
pnpm lint
pnpm build
pnpm build:budget
pnpm test:browser
```

The release workflow verifies the same contract. A discouraged release is marked as yanked in the changelog and release notes, never rewritten.

The detailed release, rollback, and incident procedure lives in `docs/releases.md`.

Visual baseline changes follow `docs/visual-regression.md`. Snapshot updates require inspecting every changed desktop and mobile image in light, dark, and custom-primary themes; they are never an automatic CI repair.
