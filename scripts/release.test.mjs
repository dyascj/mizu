import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { releaseNotes, verifyRelease } from './release.mjs';

const currentVersion = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).version;

const completeEntry = `## [1.2.3] - 2026-07-24

### Added
One.

### Changed
Two.

### Deprecated
None.

### Removed
None.

### Fixed
Three.

### Security
Four.

## [1.2.2] - 2026-07-01
`;

test('extracts complete release notes without the version heading', () => {
	const notes = releaseNotes(completeEntry, '1.2.3');

	assert.match(notes, /^### Added/);
	assert.doesNotMatch(notes, /1\.2\.2/);
});

test('rejects changelog entries missing the release template', () => {
	assert.throws(
		() => releaseNotes('## [1.2.3]\n\n### Fixed\nOne.\n', '1.2.3'),
		/missing sections: Added, Changed, Deprecated, Removed, Security/
	);
});

test('verifies the current release metadata and immutable output', () => {
	const release = verifyRelease(currentVersion);

	assert.equal(release.tag, `v${currentVersion}`);
	assert.equal(release.manifest.channel, 'versioned');
});
