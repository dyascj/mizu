# Changelog

All notable changes to Mizu are documented here. The project follows the compatibility policy in `docs/compatibility.md`.

## [0.3.0-rc.2] - 2026-09-07

This candidate includes the neutral theme, native Svelte cloud orb, revised landing page and docs, and the component spacing, radius, and interaction audit. It includes the fixes recorded under 0.3.0-rc.1. The stable registry remains on 0.2.1. Representative VoiceOver review is required before a stable 0.3.0 release.

### Added

- Browser checks for open menus, date pickers, selection lists, tooltips, dialogs, and drawers, including viewport bounds and Escape dismissal.
- Regression coverage for repeated citations, unsafe citation URLs, retained invalid tags, compact gauges, and clearing a feedback vote.

### Changed

- Phone input text uses 16 pixels. Small metadata uses 12 pixels. Card titles allow wrapped lines, and dialog footers stack their actions on narrow screens.
- Checkboxes and keycaps use smaller corner radii. OTP cells, segmented controls, calendars, and range endpoints have consistent shapes.
- Button sizes set a minimum height and allow long action labels to wrap. For a deliberate smaller fixed height, override the minimum height too, or use the appropriate size variant.
- Selected controls use a stronger neutral fill. Component, gallery, and block previews use the page background in both themes.
- **MessageActions migration:** `onFeedback` now receives `'up'`, `'down'`, or `null`. Handle `null` to remove a previously recorded vote. The earlier callback omitted vote removal.
- **Select and Combobox migration:** keep their `Root`, input or trigger, and content from the same Mizu version. The roots now share list relationships. Give Select triggers a visible associated label or an `aria-label`. `Combobox.Content` provides its own viewport; place groups and items directly inside it.
- **CircularGauge migration:** diameters without enough interior space omit visual center content. The value and label remain available through the meter's accessibility attributes. Use a larger diameter for a visible caption.
- Demo copy describes projects, files, reviews, and settings. Navigation examples link to working documentation routes.

### Deprecated

- No additional APIs deprecated.

### Removed

- No components removed.

### Fixed

- Context menus and navigation flyouts running outside narrow viewports.
- Missing IDs and control relationships in open Select and Combobox lists.
- Collapsed tree descendants remaining exposed to assistive technology.
- Rejected or duplicate tags clearing the user's draft, and repeated labels causing keyed-render errors.
- Selected calendar dates losing text contrast on hover and range endpoints receiving inconsistent corners.
- Oversized menu content and long citation labels escaping their containers.

### Security

- Sources only creates links for HTTP, HTTPS, and relative web URLs. Other URL schemes render as plain citations.

## [0.3.0-rc.1] - 2026-09-07

This candidate is ready for integration testing. The stable and compatibility registry aliases remain on 0.2.1. Representative VoiceOver review is still required before 0.3.0 becomes stable.

### Added

- A Svelte 5 port of Orb UI's cloud renderer, with MIT attribution, audio-level input, reduced-motion handling, offscreen suspension, and a fallback when WebGL is unavailable or its context is lost.
- `ChatInput` exposes `label`, `onAttach`, and `onVoice`. `StreamingText` exposes `paused` and resumes the current text without restarting it.
- A control-fill token, live surface examples in the theming docs, and browser coverage for all 79 components in light and dark on desktop and mobile.
- Tests for semantic contrast, tablet reflow, every block category, disabled links, IME composition, focused toast timers, and WebGL fallback behavior.

### Changed

- The default theme uses black, white, and neutral grays. AI activity and status retain color. Fields use a distinct fill on page, card, muted, and popover backgrounds. Focus, error states, and small empty controls retain semantic boundaries.
- The landing page has five composed examples, responsive layouts, and restrained entrance motion. Documentation uses native page scrolling, clearer typography, wrapping API tables, and async section navigation. UI labels use sentence case.
- Updated the reviewed dependency ranges for Svelte, TypeScript ESLint, Node types, globals, Lucide, internationalized dates, and TanStack Table. CodeQL actions now share one revision and one Dependabot group.
- **Migration for copied source:** reinstall the theme alongside updated components to receive `--control` and the revised primary/foreground pairs. Custom themes should define `--control`, `--input`, and their primary foreground together.
- **Button migration:** buttons now default to `type="button"`. Add `type="submit"` to intentional form submitters. Disabled link buttons have no navigable URL or callback.
- **ChatInput migration:** attachment and microphone buttons render when their callbacks are supplied. Existing `leading` and `trailing` snippets still work.
- **Command migration:** `Command.List` now creates the Bits UI viewport internally. Put items and groups directly inside the list.
- Block previews provide local feedback. Authentication examples validate inputs but do not send credentials or create accounts.

### Deprecated

- No APIs deprecated. The legacy blue ramp remains available for existing custom themes.

### Removed

- Decorative uppercase labels, blue focus washes, the masked landing-page component wall, and the custom page scroll container.

### Fixed

- Low-contrast primary and status text, the dark-mode switch thumb, and composers that blended into their surrounding cards.
- Slider, progress, select, and OTP accessible names; command list relationships; sidebar list semantics; keyboard access to scrollable tables and conversations.
- Mobile pagination, dock, stepper, OTP, and block layouts; oversized dialog scrolling; long API names and documentation pagination.
- IME Enter handling, rating size and invalid-value normalization, carousel keys inside editable fields, and keyboard focus pausing toast dismissal.
- Theme storage failures, clipboard failure feedback and timer cleanup, deterministic sidebar skeletons, and premultiplied alpha at the orb edge.
- Historical registry inventories now validate against their own manifests. Candidate builds preserve the stable aliases and verify the candidate's isolated consumer install.

### Security

- Updated the transitive `fast-uri` dependency to 3.1.7 to resolve four high-severity advisories. The dependency audit reports no known vulnerabilities.
- JSON-LD serialization escapes HTML-significant input before insertion into script elements.

## [0.2.1] - 2026-08-28

### Added

- No new components. v0.2.1 clears the dependency queue that accumulated after v0.2.0.

### Changed

- Updated bits-ui to 2.19.0 and Lucide to 1.34.0, and moved the same ranges into generated registry items.
- Updated the development stack to SvelteKit 2.70.3, Svelte 5.56.10, Vite 8.2.2, Vitest 4.1.11, ESLint 10.9.1, typescript-eslint 8.68.0, and @types/node 26.3.0.

### Deprecated

- Nothing is deprecated in this release.

### Removed

- Nothing is removed in this release.

### Fixed

- The message-actions teardown test flushes the zero-delay timer that Svelte 5.56.10 schedules on the first delegated event, so it only asserts on the component's own copy reset timer. Component behavior is unchanged.

### Security

- No security fixes. `pnpm audit` remains clear at the high level.

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
