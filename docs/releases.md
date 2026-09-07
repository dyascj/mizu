# Release and incident procedure

## Prepare a release

1. Land the source, tests, and documentation intended for the release on `main`.
2. Choose the semantic version using `docs/compatibility.md`.
3. Update `package.json` and `registry-release.json` to the same version.
4. Set `registry-release.json#generationCommit` to the full source commit that contains the installable component and block source.
5. Complete Added, Changed, Deprecated, Removed, Fixed, and Security sections in `CHANGELOG.md`.
6. Run `pnpm registry:build`. This creates the new immutable version directory and moves the compatibility and latest channels.
7. Run the full command list in `CONTRIBUTING.md`, then commit the release metadata and generated artifacts.
8. Merge through the normal protected-main process and wait for the production deployment.

## Publish

From the Actions page, run the Release workflow on `main` with the version and no `v` prefix.

The workflow repeats all required checks, validates a clean tree, verifies the deployed versioned manifest and every item hash, creates or verifies an annotated tag, publishes changelog notes, and attaches:

- the immutable registry archive;
- the release manifest;
- SHA-256 checksums for both assets.

The workflow is safe to retry when a tag or GitHub release already exists, provided the annotated tag still points to the same commit.

## Failed release

Do not move or replace an existing version tag. Fix the cause on `main`, wait for deployment, and retry the workflow when no release artifact was published.

If a published release is defective:

1. Mark it as yanked in `CHANGELOG.md` and the GitHub release notes.
2. Keep its tag and `static/r/v*` directory available.
3. Prepare a new patch release with the fix.
4. Move `latest` and the legacy compatibility alias only through that new committed release.
5. Tell affected consumers what copied source must be replaced or migrated.

## Security incident

Keep vulnerability details in the private advisory until coordinated disclosure. Establish impact, affected versions, exploit prerequisites, and a safe remediation. Rotate any exposed credential immediately, preserve relevant logs, and prepare a new immutable release. After disclosure, record the fixed version and consumer action in the Security section of the changelog.

## Deployment rollback

A site rollback may restore a prior application deployment, but it must not erase a published registry version. Confirm that every previously released `/r/v*` URL remains available after rollback. If a rollback would remove a newer pinned directory, redeploy an artifact containing both versions instead.

## Candidate releases

Set a prerelease version in `package.json` and `registry-release.json`, and set `stableVersion` to the most recent stable release. The generator writes the candidate's immutable directory while preserving the stable install aliases. The consumer check tests the version recorded in `registry-release.json`.

The release workflow marks prereleases as such on GitHub and does not make them the latest stable release. Complete the keyboard and VoiceOver review required by ADR 0003 before promoting a new stable minor version. Promotion uses a new immutable version directory; candidate directories remain unchanged.
