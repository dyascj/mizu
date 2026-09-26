import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { motionTokens, springPosition, springToken } from './motion-curves.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const theme = readFileSync(join(root, 'src/app.css'), 'utf8');

test('spring easing tokens in app.css match the generator', () => {
	for (const { name, duration, easing } of motionTokens()) {
		assert.ok(
			theme.includes(`--duration-${name}: ${duration}ms;`),
			`--duration-${name} is stale; run node scripts/motion-curves.mjs`
		);
		assert.ok(
			theme.includes(`--ease-${name}: ${easing};`),
			`--ease-${name} is stale; run node scripts/motion-curves.mjs`
		);
	}
});

test('springs start at rest, end at rest, and only overshoot when bouncy', () => {
	assert.equal(springPosition({ duration: 0.4, bounce: 0 }, 0), 0);
	const critical = springToken({ duration: 0.3, bounce: 0 });
	const bouncy = springToken({ duration: 0.5, bounce: 0.3 });
	const values = (token) => token.easing.slice('linear('.length, -1).split(', ').map(Number);

	assert.equal(values(critical).at(-1), 1);
	assert.ok(values(critical).every((value) => value <= 1));
	assert.ok(Math.max(...values(bouncy)) > 1.03);
});
