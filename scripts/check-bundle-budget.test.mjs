import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { assertBundleBudget, measureBundle } from './check-bundle-budget.mjs';

function bundleFixture(context, sizes) {
	const directory = mkdtempSync(join(tmpdir(), 'mizu-bundle-budget-'));
	context.after(() => rmSync(directory, { recursive: true, force: true }));

	for (const [name, size] of Object.entries(sizes)) {
		const path = join(directory, name);
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, Buffer.alloc(size));
	}

	return directory;
}

test('measures nested client JavaScript and ignores other assets', (context) => {
	const directory = bundleFixture(context, {
		'entry.js': 12,
		'nodes/page.js': 30,
		'styles.css': 100
	});

	assert.deepEqual(measureBundle(directory), {
		files: [
			{ path: 'nodes/page.js', bytes: 30 },
			{ path: 'entry.js', bytes: 12 }
		],
		largest: { path: 'nodes/page.js', bytes: 30 },
		totalBytes: 42
	});
});

test('accepts a bundle at its limits', (context) => {
	const measurement = measureBundle(bundleFixture(context, { 'entry.js': 60, 'page.js': 40 }));

	assert.doesNotThrow(() =>
		assertBundleBudget(measurement, { largestFileBytes: 60, totalBytes: 100 })
	);
});

test('reports largest-file and total-size regressions together', (context) => {
	const measurement = measureBundle(bundleFixture(context, { 'entry.js': 70, 'page.js': 50 }));

	assert.throws(
		() => assertBundleBudget(measurement, { largestFileBytes: 60, totalBytes: 100 }),
		/largest client chunk is 70 bytes.*total client JavaScript is 120 bytes/s
	);
});

test('requires build output containing JavaScript', (context) => {
	const directory = bundleFixture(context, { 'styles.css': 100 });

	assert.throws(() => measureBundle(directory), /No JavaScript files were found/);
});
