# Compatibility and versioning

Mizu distributes source rather than a runtime package. Its public contract still includes component prop and callback names, compound exports, documented behavior, accessibility semantics, CSS token names, and documented markup assumptions.

## Semantic versions

- Patch releases fix defects without intentionally breaking the public contract.
- Before 1.0, minor releases may contain breaking changes. Every break must be listed in `CHANGELOG.md` with a migration.
- After 1.0, breaking changes require a major release.
- Additive components, props, exports, and tokens normally ship in a minor release.
- Deprecated APIs remain available for at least one minor release when security or correctness does not require immediate removal.

## Registry channels

Use a versioned URL when reproducibility matters:

```bash
npx shadcn-svelte@latest add https://mizu-ui.com/r/v0.2.1/button.json
```

Use the explicit latest channel only when you intend to receive the newest released source:

```bash
npx shadcn-svelte@latest add https://mizu-ui.com/r/latest/button.json
```

The legacy `/r/<item>.json` path remains as a compatibility alias. New documentation and generated agent guidance use pinned URLs.

Each release directory contains `manifest.json` with the version, generation commit, byte size, and SHA-256 integrity for every item. Once committed, a version directory is immutable. The generator fails if a later build would change or prune it.

## Deprecations and migrations

Deprecations and breaking changes are recorded in `CHANGELOG.md`. A migration entry must name the affected registry items, show the old and new API, and explain any manual update required after reinstalling copied source.

Mizu v0.1.1 does not intentionally break the v0.1.0 component API. It is the first release with a reproducible registry. The original v0.1.0 mutable URLs did not preserve a trustworthy dependency-complete snapshot, so consumers should pin new installs to v0.1.1.

## Yanks and security fixes

Published version directories are not silently replaced or deleted. If a release must be discouraged, the changelog and release notes will mark it as yanked and point to a safe version. A security fix receives a new version and follows the private reporting process in `SECURITY.md`.
