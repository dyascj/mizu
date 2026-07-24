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

test('release version, changelog, compatibility docs, and pinned install guidance agree', () => {
	const packageJson = JSON.parse(read('package.json'));
	const release = JSON.parse(read('registry-release.json'));
	const changelog = read('CHANGELOG.md');
	const compatibility = read('docs/compatibility.md');
	const readme = read('README.md');

	assert.equal(release.version, packageJson.version);
	assert.match(release.generationCommit, /^[0-9a-f]{40}$/);
	assert.match(
		changelog,
		new RegExp(`^## \\[${packageJson.version.replaceAll('.', '\\.')}\\]`, 'm')
	);
	assert.match(compatibility, new RegExp(`/r/v${packageJson.version.replaceAll('.', '\\.')}/`));
	assert.match(
		readme,
		new RegExp(`/r/v${packageJson.version.replaceAll('.', '\\.')}/button\\.json`)
	);
});

test('design rules reject stale claims and legacy Gauge colors', () => {
	const guidance = [
		read('AGENTS.md'),
		read('CONTRIBUTING.md'),
		read('src/routes/AGENTS.md/+server.ts'),
		read('src/routes/docs/+page.svelte'),
		read('src/routes/docs/usage/+page.svelte')
	].join('\n');
	const gauge = read('src/lib/components/ui/circular-gauge/circular-gauge.svelte');

	assert.doesNotMatch(guidance, /\b(?:No strokes|no strokes|hairline borders?)\b/);
	assert.doesNotMatch(gauge, /#(?:5cd5ff|0090d9)|rgba\(1,\s*178,\s*255/);
	assert.match(gauge, /var\(--primary\)/);
});
