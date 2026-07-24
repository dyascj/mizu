/**
 * Materialize registry items in an isolated SvelteKit project, install only
 * their declared npm dependencies, then type-check and build the consumer.
 *
 * The fixture has no access to the repository's node_modules. Its package
 * manifest contains the emitted registry dependencies plus the exact installed
 * Svelte toolchain, so undeclared runtime packages cannot leak into the check.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registryDir = join(root, 'static/r');
const requestedItems = process.argv.slice(2);
const entryItems = requestedItems.length ? requestedItems : ['drawer', 'data-table'];

function parseDependency(specifier) {
	const separator = specifier.lastIndexOf('@');
	if (separator <= 0) {
		throw new Error(`Registry dependency "${specifier}" does not include a version range.`);
	}
	return [specifier.slice(0, separator), specifier.slice(separator + 1)];
}

function registryDependencyName(url) {
	return basename(new URL(url).pathname, '.json');
}

function collectItems(names) {
	const items = new Map();

	function visit(name) {
		if (items.has(name)) return;
		const itemPath = join(registryDir, `${name}.json`);
		if (!existsSync(itemPath)) throw new Error(`Registry item "${name}" does not exist.`);

		const item = JSON.parse(readFileSync(itemPath, 'utf8'));
		items.set(name, item);
		for (const dependency of item.registryDependencies ?? []) {
			visit(registryDependencyName(dependency));
		}
	}

	for (const name of names) visit(name);
	return items;
}

function writeConsumerFiles(fixtureDir, items) {
	const dependencies = {};

	for (const item of items.values()) {
		for (const dependency of item.dependencies ?? []) {
			const [name, version] = parseDependency(dependency);
			const existing = dependencies[name];
			if (existing && existing !== version) {
				throw new Error(
					`Registry items require conflicting ranges for "${name}": "${existing}" and "${version}".`
				);
			}
			dependencies[name] = version;
		}

		for (const file of item.files) {
			const target =
				item.type === 'registry:lib'
					? join(fixtureDir, 'src/lib', file.target)
					: join(fixtureDir, 'src/lib/components/ui', file.target);
			mkdirSync(dirname(target), { recursive: true });
			writeFileSync(target, file.content);
		}
	}

	const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
	const toolchainNames = [
		'@sveltejs/kit',
		'@sveltejs/vite-plugin-svelte',
		'svelte',
		'svelte-check',
		'typescript',
		'vite'
	];
	const devDependencies = Object.fromEntries(
		toolchainNames.map((name) => {
			const installedManifest = JSON.parse(
				readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')
			);
			return [name, installedManifest.version];
		})
	);

	writeFileSync(
		join(fixtureDir, 'package.json'),
		JSON.stringify(
			{
				name: 'mizu-registry-consumer-check',
				private: true,
				type: 'module',
				packageManager: rootPackage.packageManager,
				dependencies,
				devDependencies
			},
			null,
			2
		) + '\n'
	);
	writeFileSync(
		join(fixtureDir, 'svelte.config.js'),
		`import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess()
};
`
	);
	writeFileSync(
		join(fixtureDir, 'vite.config.ts'),
		`import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
`
	);
	writeFileSync(
		join(fixtureDir, 'tsconfig.json'),
		`{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
}
`
	);

	mkdirSync(join(fixtureDir, 'src/routes'), { recursive: true });
	writeFileSync(
		join(fixtureDir, 'src/app.html'),
		`<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
`
	);
	writeFileSync(
		join(fixtureDir, 'src/routes/+page.svelte'),
		`<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { createSvelteTable } from '$lib/components/ui/data-table';
</script>

<svelte:head><title>Mizu registry consumer check</title></svelte:head>

<Drawer.Root>
	<Drawer.Trigger>Open</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Title>Registry check</Drawer.Title>
		<Drawer.Description>Drawer compiled in an isolated consumer.</Drawer.Description>
	</Drawer.Content>
</Drawer.Root>

<p>Data table export: {typeof createSvelteTable}</p>
`
	);
}

function run(command, args, cwd) {
	const result = spawnSync(command, args, {
		cwd,
		env: { ...process.env, CI: '1' },
		stdio: 'inherit'
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}.`);
	}
}

const fixtureDir = mkdtempSync(join(tmpdir(), 'mizu-registry-consumer-'));

try {
	const items = collectItems(entryItems);
	writeConsumerFiles(fixtureDir, items);

	console.log(`Checking ${entryItems.join(', ')} in ${fixtureDir}`);
	run(
		'pnpm',
		['install', '--prefer-offline', '--ignore-scripts', '--no-frozen-lockfile'],
		fixtureDir
	);
	run('pnpm', ['exec', 'svelte-kit', 'sync'], fixtureDir);
	run('pnpm', ['exec', 'svelte-check', '--tsconfig', './tsconfig.json'], fixtureDir);
	run('pnpm', ['exec', 'vite', 'build'], fixtureDir);
	console.log(`Registry consumer check passed: ${entryItems.join(', ')}`);
} finally {
	rmSync(fixtureDir, { recursive: true, force: true });
}
