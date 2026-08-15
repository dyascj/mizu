# Changelog

All notable changes to Mizu are documented here. The project follows the compatibility policy in `docs/compatibility.md`.

## [0.2.0] - 2026-08-15

### Added

- No new components. v0.2.0 modernizes the data table and clears the dependency and security queue.

### Changed

- **Breaking: the `data-table` registry item now targets TanStack Table v9.** The vendored `createSvelteTable` wrapper, `flex-render.svelte`, and `render-helpers.ts` are removed. The item re-exports `FlexRender`, `renderComponent`, `renderSnippet`, and `createTable` (aliased as `createSvelteTable`) from the official `@tanstack/svelte-table` adapter, which itself re-exports all of `@tanstack/table-core`. Migration for consumers reinstalling the copied source:
  - Replace `@tanstack/table-core` with `@tanstack/svelte-table` in `package.json`.
  - Register features and row models through options instead of `get*RowModel` options. Old: `createSvelteTable({ data, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })`. New: `const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel(), sortFns }); createSvelteTable({ features, columns, get data() { return data } })`.
  - Type column definitions against the feature set: `ColumnDef<typeof features, Row>[]`.
  - Table state lives in rune-aware atoms; external `$state` plus `onSortingChange` wiring is no longer required. Read slices with `table.atoms.<slice>.get()` when needed.
  - `row.getVisibleCells()` requires registering `columnVisibilityFeature`; use `row.getAllCells()` otherwise.
  - `FlexRender` accepts `{cell}` or `{header}` directly, and still accepts the previous `content`/`context` pair. The old `attach` prop is removed.
- Updated Lucide to 1.28.0, tailwind-variants to 3.3.1, and @internationalized/date to 3.12.3, and moved the same ranges into generated registry items.
- Updated the development stack to SvelteKit 2.70.2, Svelte 5.56.9, Vite 8.2.1, Playwright 1.62, and jsdom 30.

### Deprecated

- Nothing is deprecated in this release.

### Removed

- The vendored data-table adapter files (`data-table.svelte.ts`, `flex-render.svelte`, `render-helpers.ts`), replaced by the official adapter as described above.

### Fixed

- Registry dependency tests read every dependency range from `package.json` instead of freezing the TanStack range inside a fixture.

### Security

- Cleared all `pnpm audit` findings: brace-expansion, postcss, nanoid, fast-uri, and cookie advisories via updated overrides, and the SvelteKit 2.70.2 content-negotiation ReDoS fix.

## [0.1.4] - 2026-07-24

### Added

- No new components this time. v0.1.4 clears the dependency queue before feature work resumes.

### Changed

- Updated the development stack to SvelteKit 2.70.1, Svelte 5.56.7, Vite 8.1.5, and Tailwind CSS 4.3.3.
- Reformatted components, blocks, demos, and documentation with Prettier 3.9. This is a formatting-only migration; component APIs and behavior are unchanged.
- Updated Lucide to 1.26.0 and moved the same compatible range into generated registry items.

### Deprecated

- Nothing is deprecated in this release.

### Removed

- Nothing is removed in this release.

### Fixed

- Registry dependency tests now follow `package.json` instead of freezing the Lucide version inside a fixture.

### Security

- SvelteKit 2.70.1 keeps CSRF protection enabled when a build uses a non-production `NODE_ENV`.

## [0.1.3] - 2026-07-24

### Added

- Source-controlled GitHub repository policy with audited branch protection, merge, cleanup, vulnerability-reporting, and dependency-security settings.

### Changed

- Pull requests now require the full verification, browser, and CodeQL checks before merge.
- CI fetches release provenance history before validating immutable registry metadata.
- Pinned GitHub Actions use maintained Node 24 runtimes.

### Deprecated

- No additional APIs or registry channels are deprecated in this release.

### Removed

- Squash and rebase merge strategies are disabled in favor of documented merge commits.

### Fixed

- Carousel uses consumer-build-compatible parameter syntax while preserving the same scrolling behavior.
- The repository policy enables vulnerability alerts before Dependabot security updates.

### Security

- `main` is protected from routine direct pushes, force pushes, and deletion.
- Private vulnerability reporting, vulnerability alerts, Dependabot security updates, secret scanning, and push protection are enabled.

## [0.1.2] - 2026-07-24

### Added

- Tag-gated release automation with deployment integrity verification, annotated tags, changelog notes, and offline registry assets.
- Security, support, conduct, ownership, issue, pull-request, roadmap, accessibility, and incident-response policies.
- Browser interaction coverage for keyboard navigation and open component states.

### Changed

- Horizontally scrollable component API tables are named keyboard-focusable regions.

### Deprecated

- No additional APIs or registry channels are deprecated in this release.

### Removed

- No public APIs or registry items are removed in this release.

### Fixed

- Tree keeps its roving tab stop on a visible row when the selected item is inside a collapsed branch.

### Security

- Private vulnerability reporting and supported-version expectations are documented.

## [0.1.1] - 2026-07-24

### Added

- Immutable `/r/v0.1.1` registry paths, an explicit `/r/latest` channel, and SHA-256 release manifests.
- Contract, component, accessibility, browser, registry consumer, route, and bundle-budget verification.
- Typed public route metadata and source-backed component API snapshots.

### Changed

- Documentation commands now recommend the pinned v0.1.1 registry.
- Documentation demos, component source, API data, and blocks load in route-sized chunks.
- Stateful components normalize invalid boundaries and clean up timers and observers.

### Deprecated

- Mutable `/r/<item>.json` install URLs. They remain available as a compatibility alias.

### Removed

- Six retired registry artifacts that were no longer present in the component catalog.

### Fixed

- Drawer and Data Table now declare their external dependency ranges.
- Sidebar now installs its required mobile-query hook.
- Registry builds prune stale files and validate every local and external dependency.
- Keyboard, announcement, reduced-motion, theme-token, and timer behavior across custom components.

### Security

- GitHub Actions are pinned to full commit SHAs.
- High and critical dependency advisories fail CI, with narrow dependency overrides for audited transitive fixes.

## [0.1.0] - 2026-07-10

### Added

- Initial Mizu component registry, blocks, documentation site, and agent guidance.
