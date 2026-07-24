# Security policy

## Supported versions

Mizu supports the latest patch release in the current minor line.

| Version                       | Supported |
| ----------------------------- | --------- |
| 0.1.1 and later 0.1.x patches | Yes       |
| 0.1.0 and earlier             | No        |

The v0.1.0 mutable registry did not preserve a dependency-complete immutable snapshot. New installations should use the pinned version shown in the documentation.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use [GitHub private vulnerability reporting](https://github.com/dyascj/mizu/security/advisories/new) and include:

- the affected component, block, registry URL, or workflow;
- the impact and required preconditions;
- reproduction steps or a minimal project;
- any known workaround;
- whether the report is already public elsewhere.

The maintainer aims to acknowledge a report within three business days and provide an initial severity assessment within seven business days. Timelines may change with complexity, but progress will be communicated through the private advisory.

## Disclosure and fixes

Security fixes receive a new release. Published versioned registry directories are not rewritten. If a release must be discouraged, it is marked as yanked in the changelog and release notes while a fixed version is prepared.

Consumers own copied component source and should review Mizu release notes, dependency advisories, and the resulting application threat model.
