/**
 * Build a shadcn-svelte-compatible registry from the component source.
 *
 * Scans src/lib/components/ui/<slug>/, embeds each file's content, infers npm
 * + registry dependencies (as absolute URLs so a single `add <url>` resolves
 * everything), and writes:
 *   static/r/<slug>.json   one registry-item per component (+ utils)
 *   static/r/registry.json the index of all items
 *
 * The base URL is read from src/lib/site/config.ts (`registryBase`) so the
 * site and the registry always agree. Override with MIZU_REGISTRY_BASE.
 *
 * Run: pnpm registry:build   (node scripts/build-registry.mjs)
 * No secrets, no network — safe for a public repo.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const UI_DIR = join(root, 'src/lib/components/ui');
const OUT_DIR = join(root, 'static/r');
const ITEM_SCHEMA = 'https://shadcn-svelte.com/schema/registry-item.json';
const REGISTRY_SCHEMA = 'https://shadcn-svelte.com/schema/registry.json';

// Single source of truth: read registryBase straight from the site config.
const config = readFileSync(join(root, 'src/lib/site/config.ts'), 'utf8');
const BASE = (
	process.env.MIZU_REGISTRY_BASE ||
	config.match(/registryBase:\s*'([^']+)'/)?.[1] ||
	'https://mizu.dev/r'
).replace(/\/$/, '');
const HOMEPAGE = config.match(/repo:\s*'([^']+)'/)?.[1] ?? 'https://mizu.dev';

const meta = JSON.parse(readFileSync(join(root, 'src/lib/site/components.json'), 'utf8'));

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

/** Infer npm + registry dependencies from import statements. */
function inferDeps(contents) {
	const deps = new Set();
	const registryDeps = new Set();
	const text = contents.join('\n');
	if (/from ['"]bits-ui['"]/.test(text)) deps.add('bits-ui');
	if (/from ['"]phosphor-svelte/.test(text)) deps.add('phosphor-svelte');
	if (/from ['"]@lucide\/svelte/.test(text)) deps.add('@lucide/svelte');
	if (/from ['"]tailwind-variants['"]/.test(text)) deps.add('tailwind-variants');
	if (/\$lib\/utils/.test(text)) registryDeps.add('utils');
	for (const m of text.matchAll(/\$lib\/components\/ui\/([a-z-]+)/g)) registryDeps.add(m[1]);
	return { deps: [...deps].sort(), registryDeps: [...registryDeps] };
}

/** Registry dependencies are absolute URLs so a bare `add <url>` resolves them. */
const depUrl = (name) => `${BASE}/${name}.json`;

mkdirSync(OUT_DIR, { recursive: true });
const items = [];

for (const c of meta) {
	const dir = join(UI_DIR, c.slug);
	const relFiles = listFiles(dir).sort();
	const contents = relFiles.map((f) => readFileSync(join(dir, f), 'utf8'));
	const { deps, registryDeps } = inferDeps(contents);

	const item = {
		$schema: ITEM_SCHEMA,
		name: c.slug,
		type: 'registry:ui',
		title: c.name,
		description: c.description,
		dependencies: deps,
		registryDependencies: registryDeps
			.filter((d) => d !== c.slug)
			.sort()
			.map(depUrl),
		files: relFiles.map((f, i) => ({
			path: `lib/components/ui/${c.slug}/${f}`,
			type: 'registry:ui',
			target: `src/lib/components/ui/${c.slug}/${f}`,
			content: contents[i]
		}))
	};
	writeFileSync(join(OUT_DIR, `${c.slug}.json`), JSON.stringify(item, null, 2) + '\n');
	items.push({ name: c.slug, type: 'registry:ui', title: c.name, description: c.description });
}

// The shared `cn` helper as its own registry:lib item.
const utils = {
	$schema: ITEM_SCHEMA,
	name: 'utils',
	type: 'registry:lib',
	title: 'cn utility',
	description: 'Tailwind-aware className merge helper used by every component.',
	dependencies: ['clsx', 'tailwind-merge'],
	registryDependencies: [],
	files: [
		{
			path: 'lib/utils.ts',
			type: 'registry:lib',
			target: 'src/lib/utils.ts',
			content: readFileSync(join(root, 'src/lib/utils.ts'), 'utf8')
		}
	]
};
writeFileSync(join(OUT_DIR, 'utils.json'), JSON.stringify(utils, null, 2) + '\n');
items.unshift({
	name: 'utils',
	type: 'registry:lib',
	title: utils.title,
	description: utils.description
});

const registry = {
	$schema: REGISTRY_SCHEMA,
	name: 'mizu',
	homepage: HOMEPAGE,
	items
};
writeFileSync(join(OUT_DIR, 'registry.json'), JSON.stringify(registry, null, 2) + '\n');

console.log(`Registry built: ${items.length} items -> static/r/  (base: ${BASE})`);
