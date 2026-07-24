import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Node and pnpm contracts agree across local development and CI', () => {
	const packageJson = JSON.parse(read('package.json'));
	const workflow = read('.github/workflows/ci.yml');
	const viteConfig = read('vite.config.ts');

	assert.equal(packageJson.engines.node, '>=22 <25');
	assert.equal(packageJson.engines.pnpm, '>=10.28.2 <11');
	assert.equal(packageJson.scripts.prepare, 'svelte-kit sync');
	assert.equal(read('.nvmrc').trim(), '22');
	assert.match(workflow, /node-version: 22/);
	assert.match(viteConfig, /adapter\(\{ runtime: 'nodejs22\.x' \}\)/);
});

test('README count matches the component catalog and stale claims stay removed', () => {
	const readme = read('README.md');
	const components = JSON.parse(read('src/lib/site/components.json'));

	assert.match(readme, new RegExp(`\\*\\*${components.length} components\\*\\*`));
	assert.match(readme, new RegExp(`currently includes ${components.length} components`));
	assert.doesNotMatch(readme, /Thought for 2 seconds/);
	assert.doesNotMatch(readme, /Phosphor in the docs site/);
	assert.doesNotMatch(readme, /hairline border/);
});
