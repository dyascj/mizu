/**
 * Build a shadcn-svelte-compatible registry from the component source.
 *
 * Scans src/lib/components/ui/<slug>/, embeds each file's content, infers npm
 * and registry dependencies, and writes:
 *   static/r/<slug>.json   one registry-item per component (+ utils)
 *   static/r/registry.json the index of all items
 *
 * The base URL is read from src/lib/site/config.ts (`registryBase`) so the
 * site and the registry always agree. Override with MIZU_REGISTRY_BASE.
 *
 * Run: pnpm registry:build   (node scripts/build-registry.mjs)
 * No secrets, no network. Safe for a public repo.
 */
import {
	existsSync,
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptPath = fileURLToPath(import.meta.url);
const root = join(dirname(scriptPath), '..');
const UI_DIR = join(root, 'src/lib/components/ui');
const OUT_DIR = join(root, 'static/r');
const RELEASE_CONFIG = join(root, 'registry-release.json');
const ITEM_SCHEMA = 'https://shadcn-svelte.com/schema/registry-item.json';
const REGISTRY_SCHEMA = 'https://shadcn-svelte.com/schema/registry.json';

/** Recursively list files under a directory, relative to it. */
function listFiles(dir, base = dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...listFiles(full, base));
		else out.push(full.slice(base.length + 1));
	}
	return out;
}

/** Keep colocated tests and snapshots out of installable registry items. */
export function isRegistrySource(file) {
	return (
		!/(^|\/)__(?:tests|snapshots)__(?:\/|$)/.test(file) && !/\.(?:test|spec)\.[^/]+$/.test(file)
	);
}

/**
 * Read ESM import specifiers without maintaining a package whitelist.
 * TypeScript's preprocessor understands static, side-effect, and dynamic imports
 * while remaining tolerant of Svelte markup around script blocks.
 */
export function extractImportSpecifiers(contents) {
	return contents.flatMap((content) =>
		ts.preProcessFile(content, true, true).importedFiles.map(({ fileName }) => fileName)
	);
}

/** Normalize a bare import or deep import to its npm package root. */
export function packageRoot(specifier) {
	if (
		specifier.startsWith('.') ||
		specifier.startsWith('/') ||
		specifier.startsWith('$') ||
		specifier.startsWith('#') ||
		specifier.startsWith('node:') ||
		specifier.startsWith('virtual:') ||
		specifier.startsWith('vite:') ||
		specifier.includes('://') ||
		specifier === 'svelte' ||
		specifier.startsWith('svelte/')
	) {
		return null;
	}

	const parts = specifier.split('/');
	return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Resolve a root package name to the versioned form emitted by the registry. */
export function versionDependency(packageName, dependencyVersions) {
	const version = dependencyVersions[packageName];
	if (!version) {
		throw new Error(`"${packageName}" is absent from package.json dependencies.`);
	}
	return `${packageName}@${version}`;
}

/** Infer versioned npm dependencies and Mizu registry dependencies. */
export function inferDeps(contents, dependencyVersions) {
	const deps = new Set();
	const localImports = new Set();
	const registryDeps = new Set();

	for (const specifier of extractImportSpecifiers(contents)) {
		if (
			specifier === '$lib/utils' ||
			specifier.startsWith('$lib/utils.') ||
			specifier.startsWith('$lib/utils/')
		) {
			registryDeps.add('utils');
			continue;
		}

		const registryMatch = specifier.match(/^\$lib\/components\/ui\/([a-z0-9-]+)(?:\/|$)/);
		if (registryMatch) {
			registryDeps.add(registryMatch[1]);
			continue;
		}
		if (specifier.startsWith('$lib/')) {
			localImports.add(specifier);
			continue;
		}

		const packageName = packageRoot(specifier);
		if (!packageName) continue;

		try {
			deps.add(versionDependency(packageName, dependencyVersions));
		} catch {
			throw new Error(
				`Registry source imports "${specifier}", but "${packageName}" is absent from package.json dependencies.`
			);
		}
	}

	return {
		deps: [...deps].sort(),
		localImports: [...localImports].sort(),
		registryDeps: [...registryDeps].sort()
	};
}

/** Fail when source relies on a project-local file the registry will not install. */
export function assertLocalImports(itemName, localImports, registryFiles = []) {
	const configured = registryFiles.map((file) => file.import).sort();
	if (JSON.stringify(localImports) !== JSON.stringify(configured)) {
		throw new Error(
			`Registry item "${itemName}" has unresolved local imports: expected ${configured.join(', ') || 'none'}; ` +
				`found ${localImports.join(', ') || 'none'}.`
		);
	}
}

/** Fail unless a generated directory contains exactly the expected files. */
export function assertExactInventory(dir, expectedFiles) {
	const actual = readdirSync(dir).sort();
	const expected = [...expectedFiles].sort();
	const missing = expected.filter((file) => !actual.includes(file));
	const unexpected = actual.filter((file) => !expected.includes(file));

	if (missing.length || unexpected.length) {
		const details = [
			missing.length ? `missing: ${missing.join(', ')}` : '',
			unexpected.length ? `unexpected: ${unexpected.join(', ')}` : ''
		]
			.filter(Boolean)
			.join('; ');
		throw new Error(`Registry output inventory mismatch (${details}).`);
	}
}

function json(value) {
	return JSON.stringify(value, null, 2) + '\n';
}

function integrity(content) {
	return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

function rewriteRegistryDependencies(item, base) {
	return {
		...item,
		registryDependencies: (item.registryDependencies ?? []).map(
			(dependency) => `${base}/${basename(new URL(dependency).pathname)}`
		)
	};
}

function writeManifest(directory, { base, channel, generationCommit, homepage, version }, files) {
	const entries = files.map((file) => {
		const content = readFileSync(join(directory, file));
		return {
			path: file,
			bytes: content.byteLength,
			integrity: integrity(content)
		};
	});

	const manifest = {
		schemaVersion: 1,
		name: 'mizu',
		version,
		channel,
		registryBase: base,
		generationCommit,
		generatedFrom: `${homepage}/commit/${generationCommit}`,
		files: entries
	};
	writeFileSync(join(directory, 'manifest.json'), json(manifest));
	return manifest;
}

function writeVariant(sourceDir, targetDir, base, release, itemFiles) {
	mkdirSync(targetDir, { recursive: true });

	for (const file of itemFiles) {
		const source = JSON.parse(readFileSync(join(sourceDir, file), 'utf8'));
		const output =
			file === 'registry.json'
				? {
						...source,
						items: source.items.map((item) => rewriteRegistryDependencies(item, base))
					}
				: rewriteRegistryDependencies(source, base);
		writeFileSync(join(targetDir, file), json(output));
	}

	writeManifest(targetDir, { ...release, base }, itemFiles);
}

/** Fail before an existing immutable release can be changed or pruned. */
export function assertImmutableDirectory(existingDir, candidateDir) {
	const expected = readdirSync(existingDir).sort();
	assertExactInventory(candidateDir, expected);

	for (const file of expected) {
		const existingPath = join(existingDir, file);
		const candidatePath = join(candidateDir, file);
		if (statSync(existingPath).isDirectory() || statSync(candidatePath).isDirectory()) {
			throw new Error(`Immutable registry release contains an unexpected directory: ${file}.`);
		}
		if (!readFileSync(existingPath).equals(readFileSync(candidatePath))) {
			throw new Error(
				`Immutable registry release would change ${file}. Bump the package and registry release versions first.`
			);
		}
	}
}

/**
 * Replace generated output only after the staged directory is complete.
 * A failed replacement restores the prior directory.
 */
export function replaceGeneratedDirectory(stagedDir, outDir) {
	const parent = dirname(outDir);
	const backupDir = join(
		parent,
		`.${basename(outDir)}-backup-${process.pid}-${Date.now().toString(36)}`
	);
	const hadExistingOutput = existsSync(outDir);

	if (hadExistingOutput) renameSync(outDir, backupDir);

	try {
		renameSync(stagedDir, outDir);
	} catch (error) {
		if (hadExistingOutput && existsSync(backupDir) && !existsSync(outDir)) {
			renameSync(backupDir, outDir);
		}
		throw error;
	}

	if (hadExistingOutput) rmSync(backupDir, { recursive: true, force: true });
}

/** Prereleases never replace the stable install aliases. */
export function aliasVersion(release) {
	if (!release.version.includes('-')) return release.version;
	if (!/^\d+\.\d+\.\d+$/.test(release.stableVersion ?? '')) {
		throw new Error('Prereleases require an explicit stableVersion for the install aliases.');
	}
	return release.stableVersion;
}

export function buildRegistry() {
	const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
	const dependencyVersions = packageJson.dependencies ?? {};
	const releaseConfig = JSON.parse(readFileSync(RELEASE_CONFIG, 'utf8'));
	if (releaseConfig.version !== packageJson.version) {
		throw new Error(
			`registry-release.json version ${releaseConfig.version} does not match package.json version ${packageJson.version}.`
		);
	}
	if (!/^[0-9a-f]{40}$/.test(releaseConfig.generationCommit)) {
		throw new Error('registry-release.json generationCommit must be a full 40-character Git SHA.');
	}

	// Single source of truth: read registryBase straight from the site config.
	const config = readFileSync(join(root, 'src/lib/site/config.ts'), 'utf8');
	const base = (
		process.env.MIZU_REGISTRY_BASE ||
		config.match(/registryBase:\s*'([^']+)'/)?.[1] ||
		'https://mizu-ui.com/r'
	).replace(/\/$/, '');
	const homepage = config.match(/repo:\s*'([^']+)'/)?.[1] ?? 'https://github.com/dyascj/mizu';
	const depUrl = (name) => `${base}/${name}.json`;
	const release = {
		channel: 'compatibility',
		generationCommit: releaseConfig.generationCommit,
		homepage,
		version: releaseConfig.version
	};

	const meta = JSON.parse(readFileSync(join(root, 'src/lib/site/components.json'), 'utf8'));
	const blocksMeta = JSON.parse(readFileSync(join(root, 'src/lib/site/blocks.json'), 'utf8'));
	const blocksDir = join(root, 'src/lib/site/blocks');
	const itemNames = [
		...meta.map(({ slug }) => slug),
		...blocksMeta.map(({ slug }) => slug),
		'utils'
	];

	if (new Set(itemNames).size !== itemNames.length) {
		throw new Error('Component, block, and utility registry names must be unique.');
	}

	mkdirSync(dirname(OUT_DIR), { recursive: true });
	const stagedDir = mkdtempSync(join(dirname(OUT_DIR), '.r-build-'));
	const items = [];

	try {
		for (const component of meta) {
			const dir = join(UI_DIR, component.slug);
			const relFiles = listFiles(dir).filter(isRegistrySource).sort();
			const registryFiles = component.registryFiles ?? [];
			const contents = [
				...relFiles.map((file) => readFileSync(join(dir, file), 'utf8')),
				...registryFiles.map((file) => readFileSync(join(root, file.source), 'utf8'))
			];
			const { deps, localImports, registryDeps } = inferDeps(contents, dependencyVersions);
			assertLocalImports(component.slug, localImports, registryFiles);
			const dependencies = [
				...new Set([
					...deps,
					...(component.npmDependencies ?? []).map((name) =>
						versionDependency(name, dependencyVersions)
					)
				])
			].sort();

			const item = {
				$schema: ITEM_SCHEMA,
				name: component.slug,
				type: 'registry:ui',
				title: component.name,
				description: component.description,
				dependencies,
				registryDependencies: registryDeps
					.filter((dependency) => dependency !== component.slug)
					.map(depUrl),
				// `target` is relative to the project's `ui` alias (e.g. button/button.svelte).
				files: [
					...relFiles.map((file, index) => ({
						type: 'registry:file',
						target: `${component.slug}/${file}`,
						content: contents[index]
					})),
					...registryFiles.map((file, index) => ({
						type: file.type,
						target: file.target,
						content: contents[relFiles.length + index]
					}))
				]
			};
			writeFileSync(join(stagedDir, `${component.slug}.json`), json(item));
			items.push(item);
		}

		// Blocks: whole screens as registry:block items. Their sources import
		// $lib/components/ui/* directly, so registry dependencies resolve the same
		// way component items do and the file lands beside the user's components.
		for (const block of blocksMeta) {
			const content = readFileSync(join(blocksDir, `${block.slug}.svelte`), 'utf8');
			const { deps, localImports, registryDeps } = inferDeps([content], dependencyVersions);
			assertLocalImports(block.slug, localImports);
			const item = {
				$schema: ITEM_SCHEMA,
				name: block.slug,
				type: 'registry:block',
				title: block.name,
				description: block.description,
				dependencies: deps,
				registryDependencies: registryDeps.map(depUrl),
				files: [
					{
						type: 'registry:component',
						target: `blocks/${block.slug}.svelte`,
						content
					}
				]
			};
			writeFileSync(join(stagedDir, `${block.slug}.json`), json(item));
			items.push(item);
		}

		// The shared `cn` helper as its own registry:lib item.
		const utilsContent = readFileSync(join(root, 'src/lib/utils.ts'), 'utf8');
		const utils = {
			$schema: ITEM_SCHEMA,
			name: 'utils',
			type: 'registry:lib',
			title: 'cn utility',
			description: 'Tailwind-aware className merge helper used by every component.',
			dependencies: inferDeps([utilsContent], dependencyVersions).deps,
			registryDependencies: [],
			files: [
				{
					type: 'registry:lib',
					target: 'utils.ts',
					content: utilsContent
				}
			]
		};
		writeFileSync(join(stagedDir, 'utils.json'), json(utils));
		items.unshift(utils);

		const registry = {
			$schema: REGISTRY_SCHEMA,
			name: 'mizu',
			homepage,
			items
		};
		writeFileSync(join(stagedDir, 'registry.json'), json(registry));

		const itemFiles = [...itemNames, 'registry'].map((name) => `${name}.json`);
		assertExactInventory(stagedDir, itemFiles);
		writeManifest(stagedDir, { ...release, base }, itemFiles);

		const latestDir = join(stagedDir, 'latest');
		writeVariant(
			stagedDir,
			latestDir,
			`${base}/latest`,
			{ ...release, channel: 'latest' },
			itemFiles
		);

		const versionDirName = `v${release.version}`;
		const versionDir = join(stagedDir, versionDirName);
		writeVariant(
			stagedDir,
			versionDir,
			`${base}/${versionDirName}`,
			{ ...release, channel: 'versioned' },
			itemFiles
		);

		let aliasFiles = itemFiles;
		const stable = aliasVersion(releaseConfig);
		if (stable !== release.version) {
			const stableDir = join(OUT_DIR, `v${stable}`);
			const manifest = JSON.parse(readFileSync(join(stableDir, 'manifest.json'), 'utf8'));
			if (manifest.version !== stable || manifest.channel !== 'versioned') {
				throw new Error('The stable registry manifest does not match stableVersion.');
			}
			aliasFiles = manifest.files.map(({ path }) => path);
			for (const file of itemFiles) rmSync(join(stagedDir, file));
			rmSync(latestDir, { recursive: true });
			const stableRelease = { ...manifest, homepage };
			writeVariant(
				stableDir,
				stagedDir,
				base,
				{ ...stableRelease, channel: 'compatibility' },
				aliasFiles
			);
			writeVariant(
				stableDir,
				latestDir,
				`${base}/latest`,
				{ ...stableRelease, channel: 'latest' },
				aliasFiles
			);
		}

		const preservedVersions = existsSync(OUT_DIR)
			? readdirSync(OUT_DIR, { withFileTypes: true })
					.filter(
						(entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(entry.name)
					)
					.map((entry) => entry.name)
			: [];

		for (const preservedVersion of preservedVersions) {
			if (preservedVersion === versionDirName) {
				assertImmutableDirectory(join(OUT_DIR, preservedVersion), versionDir);
				continue;
			}
			cpSync(join(OUT_DIR, preservedVersion), join(stagedDir, preservedVersion), {
				recursive: true,
				errorOnExist: true
			});
		}

		const generatedFiles = [...aliasFiles, 'manifest.json'];
		assertExactInventory(latestDir, generatedFiles);
		assertExactInventory(versionDir, [...itemFiles, 'manifest.json']);
		assertExactInventory(stagedDir, [
			...generatedFiles,
			'latest',
			...new Set([...preservedVersions, versionDirName])
		]);
		replaceGeneratedDirectory(stagedDir, OUT_DIR);
	} catch (error) {
		if (existsSync(stagedDir)) rmSync(stagedDir, { recursive: true, force: true });
		throw error;
	}

	console.log(
		`Registry built: ${items.length} items -> static/r/, latest, and v${release.version} (base: ${base})`
	);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) {
	buildRegistry();
}
