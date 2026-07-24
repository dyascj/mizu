# Changelog

All notable changes to Mizu are documented here. The project follows the compatibility policy in `docs/compatibility.md`.

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

## [0.1.0] - 2026-07-21

### Added

- Initial Mizu component registry, blocks, documentation site, and agent guidance.
