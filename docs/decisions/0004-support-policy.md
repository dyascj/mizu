# ADR 0004: Supported toolchain

- Status: Accepted
- Date: 2026-07-24

## Decision

Mizu repository development supports:

- Node 22 and 24;
- pnpm 10.28;
- Svelte 5;
- SvelteKit 2;
- Tailwind CSS 4.

CI and release automation run on Node 22 as the lowest supported LTS line. The repository records the Node contract in `package.json`, `.nvmrc`, and the Vercel runtime configuration.

Registry consumers must use a Svelte 5 toolchain capable of runes and snippets. Dependency ranges embedded in each registry item define the tested external package contract for that Mizu release.

## Consequences

Support for another runtime or framework generation requires an explicit compatibility decision and CI coverage. Reports on unsupported versions may still be useful, but they do not block a release.
