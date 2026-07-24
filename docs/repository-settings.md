# Repository settings

`repository-policy.json` is the source-controlled contract for GitHub repository settings that cannot be expressed in workflow files.

## Protected main

Changes land through pull requests. The `verify`, `browser`, and `analyze` checks must pass against a branch that is current with `main`, and review conversations must be resolved. Force pushes and branch deletion are disabled.

Mizu currently has one maintainer, so branch protection requires a pull request but zero approving reviews and does not enforce the policy for repository administrators. This preserves an emergency owner bypass without pretending that self-approval is independent review. Once a second active maintainer exists, raise `requiredApprovingReviewCount` to one and reconsider the administrator bypass.

## Merge strategy

Mizu uses merge commits. This preserves the commits made on each focused topic branch and records the point where the complete branch passed review. Squash and rebase merges are disabled so the repository has one predictable integration model. Successfully merged branches are deleted automatically.

## Security settings

Private vulnerability reporting, Dependabot security updates, secret scanning, and secret scanning push protection must remain enabled. Security reports follow `SECURITY.md`; dependency update pull requests still pass the same required checks as other changes.

## Applying and checking

The commands require an authenticated GitHub CLI identity with repository administration access:

```bash
pnpm repository:audit
pnpm repository:apply
pnpm repository:audit
```

`repository:apply` changes only the settings named in `repository-policy.json`. The audit command is read-only and fails with a list of policy drift.

GitHub Discussions remain disabled until there is enough moderation capacity to respond consistently. Feature requests and support questions use the issue forms and `SUPPORT.md`.
