## Summary

Describe the user or maintainer problem and the resulting behavior.

## Verification

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] Relevant browser and accessibility checks
- [ ] Screenshots or recordings for visible changes, in light and dark modes

## Registry and compatibility

- [ ] I ran `pnpm registry:build` after component, block, hook, or catalog changes.
- [ ] I ran `pnpm registry:validate` and the relevant clean consumer check.
- [ ] This does not change the public compatibility contract.
- [ ] Any breaking change has a new allowed version, changelog entry, deprecation or migration notes, and regenerated immutable output.

## Accessibility

- [ ] Keyboard, focus, labels, announcements, disabled states, and reduced motion were considered.
- [ ] Any manual assistive-technology review is recorded below.

## Notes

List visual review details, known limitations, migration instructions, or follow-up work.
