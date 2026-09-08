import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';

import { aliasVersion, assertExactInventory, inferDeps } from './build-registry.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const root = join(dirname(scriptPath), '..');
const registryDir = join(root, 'static/r');

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256(content) {
	return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

function compileSchemas() {
	const ajv = new Ajv2020({ allErrors: true });
	const itemSchema = readJson(join(root, 'schemas/registry-item.schema.json'));
	const registrySchema = readJson(join(root, 'schemas/registry.schema.json'));
	const manifestSchema = readJson(join(root, 'schemas/registry-manifest.schema.json'));
	ajv.addSchema(itemSchema);

	return {
		ajv,
		item: ajv.compile(itemSchema),
		registry: ajv.compile(registrySchema),
		manifest: ajv.compile(manifestSchema)
	};
}

function assertSchema(validate, value, label, ajv) {
	if (!validate(value)) {
		throw new Error(`${label} failed schema validation: ${ajv.errorsText(validate.errors)}`);
	}
}

function dependencyName(url) {
	return basename(new URL(url).pathname, '.json');
}

export function assertDependencyParity(item, dependencyVersions) {
	const inferred = inferDeps(
		item.files.map((file) => file.content),
		dependencyVersions
	);
	const declaredPackages = new Set(
		item.dependencies.map((dependency) => dependency.slice(0, dependency.lastIndexOf('@')))
	);
	const missingPackages = inferred.deps.filter(
		(dependency) => !declaredPackages.has(dependency.slice(0, dependency.lastIndexOf('@')))
	);

	if (missingPackages.length > 0) {
		throw new Error(
			`${item.name}.json is missing inferred dependencies: ${missingPackages.join(', ')}.`
		);
	}

	const expectedRegistry = inferred.registryDeps
		.filter((dependency) => dependency !== item.name)
		.sort();
	const declaredRegistry = item.registryDependencies.map(dependencyName).sort();
	if (JSON.stringify(expectedRegistry) !== JSON.stringify(declaredRegistry)) {
		throw new Error(
			`${item.name}.json registry dependency mismatch: expected ${expectedRegistry.join(', ') || 'none'}; ` +
				`received ${declaredRegistry.join(', ') || 'none'}.`
		);
	}

	for (const localImport of inferred.localImports) {
		const hookMatch = localImport.match(/^\$lib\/hooks\/(.+?)(?:\.js)?$/);
		const expectedTarget = hookMatch?.[1]?.replace(/\.svelte$/, '.svelte.ts');
		if (
			!expectedTarget ||
			!item.files.some((file) => file.type === 'registry:hook' && file.target === expectedTarget)
		) {
			throw new Error(`${item.name}.json does not install its local import ${localImport}.`);
		}
	}
}

export function verifyManifestFiles(directory, manifest, expectedFiles) {
	const declared = manifest.files.map(({ path }) => path);
	if (new Set(declared).size !== declared.length) {
		throw new Error(`${directory}/manifest.json contains duplicate file entries.`);
	}
	if (JSON.stringify([...declared].sort()) !== JSON.stringify([...expectedFiles].sort())) {
		throw new Error(`${directory}/manifest.json does not describe the exact registry inventory.`);
	}

	for (const entry of manifest.files) {
		const content = readFileSync(join(directory, entry.path));
		if (content.byteLength !== entry.bytes || sha256(content) !== entry.integrity) {
			throw new Error(`${directory}/manifest.json integrity mismatch for ${entry.path}.`);
		}
	}
}

function validateDirectory({
	base,
	channel,
	dependencyParity,
	directory,
	expectedCommit,
	extraEntries = [],
	expectedFiles,
	expectedVersion,
	schemas
}) {
	assertExactInventory(directory, [...expectedFiles, 'manifest.json', ...extraEntries]);
	const manifest = readJson(join(directory, 'manifest.json'));
	assertSchema(schemas.manifest, manifest, `${directory}/manifest.json`, schemas.ajv);

	if (
		manifest.registryBase !== base ||
		manifest.channel !== channel ||
		manifest.version !== expectedVersion
	) {
		throw new Error(
			`${directory}/manifest.json release metadata does not match ${channel} ${expectedVersion} at ${base}.`
		);
	}
	if (expectedCommit && manifest.generationCommit !== expectedCommit) {
		throw new Error(
			`${directory}/manifest.json generation commit does not match registry-release.json.`
		);
	}
	verifyManifestFiles(directory, manifest, expectedFiles);

	const items = expectedFiles
		.filter((file) => file !== 'registry.json')
		.map((file) => {
			const item = readJson(join(directory, file));
			assertSchema(schemas.item, item, `${directory}/${file}`, schemas.ajv);
			if (item.name !== basename(file, '.json')) {
				throw new Error(`${directory}/${file} declares the wrong registry item name.`);
			}
			for (const dependency of item.registryDependencies) {
				if (!dependency.startsWith(`${base}/`)) {
					throw new Error(`${directory}/${file} contains an unpinned registry dependency.`);
				}
			}
			if (dependencyParity) assertDependencyParity(item, dependencyParity);
			return item;
		});

	const registry = readJson(join(directory, 'registry.json'));
	assertSchema(schemas.registry, registry, `${directory}/registry.json`, schemas.ajv);
	const individualItems = new Map(items.map((item) => [item.name, item]));
	if (
		registry.items.length !== items.length ||
		registry.items.some(
			(item) => JSON.stringify(item) !== JSON.stringify(individualItems.get(item.name))
		)
	) {
		throw new Error(`${directory}/registry.json does not match the individual registry items.`);
	}
}

export function validateRegistry() {
	const packageJson = readJson(join(root, 'package.json'));
	const releaseConfig = readJson(join(root, 'registry-release.json'));
	const components = readJson(join(root, 'src/lib/site/components.json'));
	const blocks = readJson(join(root, 'src/lib/site/blocks.json'));
	const itemNames = [
		...components.map(({ slug }) => slug),
		...blocks.map(({ slug }) => slug),
		'utils'
	];
	const expectedFiles = [...itemNames, 'registry'].map((name) => `${name}.json`);
	const schemas = compileSchemas();
	const rootManifest = readJson(join(registryDir, 'manifest.json'));
	const versionDirectories = readdirSync(registryDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(entry.name))
		.map((entry) => entry.name)
		.sort();
	const currentVersionDirectory = `v${releaseConfig.version}`;

	if (releaseConfig.version !== packageJson.version) {
		throw new Error('package.json and registry-release.json versions do not match.');
	}
	if (!versionDirectories.includes(currentVersionDirectory)) {
		throw new Error(`The immutable ${currentVersionDirectory} registry release is missing.`);
	}

	const stable = aliasVersion(releaseConfig);
	const currentAliases = stable === releaseConfig.version;
	const aliasManifest = readJson(join(registryDir, `v${stable}`, 'manifest.json'));
	const aliasFiles = aliasManifest.files.map(({ path }) => path);
	assertExactInventory(registryDir, [
		...aliasFiles,
		'manifest.json',
		'latest',
		...versionDirectories
	]);

	validateDirectory({
		base: rootManifest.registryBase,
		channel: 'compatibility',
		dependencyParity: currentAliases ? packageJson.dependencies : null,
		directory: registryDir,
		expectedCommit: aliasManifest.generationCommit,
		extraEntries: ['latest', ...versionDirectories],
		expectedFiles: aliasFiles,
		expectedVersion: stable,
		schemas
	});
	validateDirectory({
		base: `${rootManifest.registryBase}/latest`,
		channel: 'latest',
		dependencyParity: currentAliases ? packageJson.dependencies : null,
		directory: join(registryDir, 'latest'),
		expectedCommit: aliasManifest.generationCommit,
		expectedFiles: aliasFiles,
		expectedVersion: stable,
		schemas
	});

	for (const versionDirectory of versionDirectories) {
		const version = versionDirectory.slice(1);
		const current = versionDirectory === currentVersionDirectory;
		validateDirectory({
			base: `${rootManifest.registryBase}/${versionDirectory}`,
			channel: 'versioned',
			dependencyParity: current ? packageJson.dependencies : null,
			directory: join(registryDir, versionDirectory),
			expectedCommit: current ? releaseConfig.generationCommit : null,
			expectedFiles: current
				? expectedFiles
				: readJson(join(registryDir, versionDirectory, 'manifest.json')).files.map(
						({ path }) => path
					),
			expectedVersion: version,
			schemas
		});
	}

	console.log(
		`Registry validation passed: ${itemNames.length} items across compatibility, latest, and ${versionDirectories.join(', ')}.`
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	validateRegistry();
}
