# ADR 0002: Immutable versioned registry releases

- Status: Accepted
- Date: 2026-07-24

## Context

Mizu copies source into consumer projects through public JSON URLs. A mutable URL can return different source and dependency ranges when rerun, which prevents reproducible installs and makes a release label meaningless.

The original `/r/<item>.json` URLs are already public, so removing them would create an avoidable compatibility break.

## Decision

Every registry build produces three channels:

- `/r/v<version>/<item>.json` is an immutable release.
- `/r/latest/<item>.json` explicitly follows the current release.
- `/r/<item>.json` remains as a legacy compatibility alias.

New documentation and generated agent guidance use the versioned channel.

Each channel has a `manifest.json` containing the semantic version, generation commit, registry base, byte size, and SHA-256 integrity for every JSON file. External npm dependencies retain the audited ranges from `package.json`. Registry-to-registry dependencies remain within their channel, so a pinned component cannot pull mutable Mizu source.

The generator copies older version directories forward unchanged. If rebuilding the current version would change any byte or inventory entry, generation fails and requires a version bump.

## Consequences

- Pinned installs are reproducible and independently verifiable.
- Released JSON is intentionally duplicated under versioned paths.
- Any installable source, dependency, serialization, or registry URL change requires preparing a new version before rebuilding.
- The release process uses a source commit recorded in `registry-release.json`. This avoids nondeterministic manifests and lets CI reproduce the exact output.
- The legacy root channel remains mutable and should not be used for new reproducibility-sensitive installs.
