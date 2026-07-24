import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
	assertExactInventory,
	assertImmutableDirectory,
	assertLocalImports,
	inferDeps,
	isRegistrySource,
	packageRoot,
	replaceGeneratedDirectory
} from './build-registry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dependencyVersions = JSON.parse(
	readFileSync(join(root, 'package.json'), 'utf8')
).dependencies;

test('infers versioned dependencies from static, side-effect, deep, and dynamic imports', () => {
	const source = `
		import 'vaul-svelte';
		import type { ColumnDef } from '@tanstack/table-core';
		export { default as Check } from '@lucide/svelte/icons/check';
		const pane = import('paneforge/internal');
		import { cn } from '$lib/utils.js';
		import Button from '$lib/components/ui/button/button.svelte';
		import { onMount } from 'svelte';
		import { browser } from '$app/environment';
	`;

	assert.deepEqual(inferDeps([source], dependencyVersions), {
		deps: [
			'@lucide/svelte@^1.21.0',
			'@tanstack/table-core@^8.21.3',
			'paneforge@^1.0.2',
			'vaul-svelte@1.0.0-next.7'
		],
		localImports: [],
		registryDeps: ['button', 'utils']
	});
});

test('tracks project-local imports and requires explicit installable files', () => {
	const inferred = inferDeps(
		["import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';"],
		dependencyVersions
	);

	assert.deepEqual(inferred.localImports, ['$lib/hooks/is-mobile.svelte.js']);
	assert.doesNotThrow(() =>
		assertLocalImports('sidebar', inferred.localImports, [
			{ import: '$lib/hooks/is-mobile.svelte.js' }
		])
	);
	assert.throws(
		() => assertLocalImports('sidebar', inferred.localImports),
		/unresolved local imports/
	);
});

test('normalizes scoped and unscoped deep imports to package roots', () => {
	assert.equal(packageRoot('@lucide/svelte/icons/check'), '@lucide/svelte');
	assert.equal(packageRoot('paneforge/internal'), 'paneforge');
	assert.equal(packageRoot('./local.js'), null);
	assert.equal(packageRoot('svelte/action'), null);
	assert.equal(packageRoot('virtual:generated-module'), null);
});

test('fails when registry source imports an undeclared package', () => {
	assert.throws(
		() => inferDeps(["import 'not-declared';"], dependencyVersions),
		/not-declared.*absent from package\.json dependencies/
	);
});

test('excludes colocated tests and snapshots from registry source files', () => {
	assert.equal(isRegistrySource('rating.svelte'), true);
	assert.equal(isRegistrySource('helpers.ts'), true);
	assert.equal(isRegistrySource('rating.test.ts'), false);
	assert.equal(isRegistrySource('rating.spec.svelte'), false);
	assert.equal(isRegistrySource('__tests__/rating.ts'), false);
	assert.equal(isRegistrySource('__snapshots__/rating.txt'), false);
});

test('rejects missing and orphaned generated files', (context) => {
	const fixtureRoot = mkdtempSync(join(tmpdir(), 'mizu-registry-inventory-'));
	context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

	writeFileSync(join(fixtureRoot, 'button.json'), '{}\n');
	writeFileSync(join(fixtureRoot, 'retired.json'), '{}\n');

	assert.throws(
		() => assertExactInventory(fixtureRoot, ['button.json', 'registry.json']),
		/missing: registry\.json; unexpected: retired\.json/
	);
});

test('replaces generated output and prunes retired artifacts', (context) => {
	const fixtureRoot = mkdtempSync(join(tmpdir(), 'mizu-registry-replace-'));
	context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

	const outDir = join(fixtureRoot, 'r');
	const stagedDir = join(fixtureRoot, 'staged');
	mkdirSync(outDir);
	mkdirSync(stagedDir);
	writeFileSync(join(outDir, 'current.json'), '{"old":true}\n');
	writeFileSync(join(outDir, 'retired.json'), '{}\n');
	writeFileSync(join(stagedDir, 'current.json'), '{"old":false}\n');

	replaceGeneratedDirectory(stagedDir, outDir);

	assert.deepEqual(readdirSync(outDir), ['current.json']);
	assert.equal(readFileSync(join(outDir, 'current.json'), 'utf8'), '{"old":false}\n');
});

test('rejects changes to an existing immutable release', (context) => {
	const fixtureRoot = mkdtempSync(join(tmpdir(), 'mizu-registry-immutable-'));
	context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

	const existing = join(fixtureRoot, 'existing');
	const candidate = join(fixtureRoot, 'candidate');
	mkdirSync(existing);
	mkdirSync(candidate);
	writeFileSync(join(existing, 'button.json'), '{"version":1}\n');
	writeFileSync(join(candidate, 'button.json'), '{"version":1}\n');

	assert.doesNotThrow(() => assertImmutableDirectory(existing, candidate));
	writeFileSync(join(candidate, 'button.json'), '{"version":2}\n');
	assert.throws(() => assertImmutableDirectory(existing, candidate), /would change button\.json/);
});

test('generated output declares audited dependencies and has exact versioned inventory', () => {
	const outDir = join(root, 'static/r');
	const release = JSON.parse(readFileSync(join(root, 'registry-release.json'), 'utf8'));
	const currentVersionDir = `v${release.version}`;
	const drawer = JSON.parse(readFileSync(join(outDir, 'drawer.json'), 'utf8'));
	const pinnedDrawer = JSON.parse(
		readFileSync(join(outDir, currentVersionDir, 'drawer.json'), 'utf8')
	);
	const dataTable = JSON.parse(readFileSync(join(outDir, 'data-table.json'), 'utf8'));
	const manifest = JSON.parse(
		readFileSync(join(outDir, currentVersionDir, 'manifest.json'), 'utf8')
	);
	const components = JSON.parse(readFileSync(join(root, 'src/lib/site/components.json'), 'utf8'));
	const blocks = JSON.parse(readFileSync(join(root, 'src/lib/site/blocks.json'), 'utf8'));
	const versionDirectories = readdirSync(outDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+/.test(entry.name))
		.map((entry) => entry.name);
	const itemFiles = [
		...components.map(({ slug }) => `${slug}.json`),
		...blocks.map(({ slug }) => `${slug}.json`),
		'utils.json',
		'registry.json'
	];
	const generatedFiles = [...itemFiles, 'manifest.json'];

	assert.ok(drawer.dependencies.includes('vaul-svelte@1.0.0-next.7'));
	assert.ok(drawer.dependencies.includes('bits-ui@^2.18.1'));
	assert.ok(dataTable.dependencies.includes('@tanstack/table-core@^8.21.3'));
	assert.ok(
		pinnedDrawer.registryDependencies.every((dependency) =>
			dependency.startsWith(`https://mizu-ui.com/r/${currentVersionDir}/`)
		)
	);
	assert.equal(manifest.version, release.version);
	assert.match(manifest.generationCommit, /^[0-9a-f]{40}$/);
	assert.equal(manifest.files.length, itemFiles.length);
	assertExactInventory(outDir, [...generatedFiles, 'latest', ...versionDirectories]);
	assertExactInventory(join(outDir, 'latest'), generatedFiles);
	for (const versionDirectory of versionDirectories) {
		assertExactInventory(join(outDir, versionDirectory), generatedFiles);
	}
});
