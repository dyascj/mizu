/**
 * Scaffold a new Mizu component: source dir, index, demo, and catalog entry.
 *
 * Usage: pnpm new:component <slug> <Name> <Category> "<description>"
 * Example: pnpm new:component tone-picker "Tone Picker" AI "Pick the assistant's voice."
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, name, category, description] = process.argv.slice(2);

const CATEGORIES = [
	'AI',
	'Actions',
	'Forms',
	'Surfaces',
	'Overlays',
	'Menus',
	'Navigation',
	'Feedback'
];

if (!slug || !name || !category || !description) {
	console.error('Usage: pnpm new:component <slug> <Name> <Category> "<description>"');
	process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
	console.error(`Slug must be kebab-case, got: ${slug}`);
	process.exit(1);
}
if (!CATEGORIES.includes(category)) {
	console.error(`Category must be one of: ${CATEGORIES.join(', ')}`);
	process.exit(1);
}

const dir = join(root, 'src/lib/components/ui', slug);
if (existsSync(dir)) {
	console.error(`Component already exists: ${dir}`);
	process.exit(1);
}

const pascal = slug
	.split('-')
	.map((p) => p[0].toUpperCase() + p.slice(1))
	.join('');

mkdirSync(dir, { recursive: true });

writeFileSync(
	join(dir, `${slug}.svelte`),
	`<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let { class: className, ref = $bindable(null), ...rest }: Props = $props();
</script>

<div bind:this={ref} class={cn('', className)} {...rest}>${name}</div>
`
);

writeFileSync(join(dir, 'index.ts'), `export { default as ${pascal} } from './${slug}.svelte';\n`);

writeFileSync(
	join(root, 'src/lib/site/demos', `${slug}.svelte`),
	`<script lang="ts">
	import { ${pascal} } from '$lib/components/ui/${slug}';
</script>

<${pascal} />
`
);

const catalogPath = join(root, 'src/lib/site/components.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
if (catalog.some((c) => c.slug === slug)) {
	console.error(`Catalog already has ${slug}`);
	process.exit(1);
}
// Insert at the end of the chosen category so the sidebar groups stay tidy.
let insertAt = catalog.length;
for (let i = catalog.length - 1; i >= 0; i--) {
	if (catalog[i].category === category) {
		insertAt = i + 1;
		break;
	}
}
catalog.splice(insertAt, 0, { slug, name, category, description });
writeFileSync(catalogPath, JSON.stringify(catalog, null, '\t') + '\n');

console.log(`Scaffolded ${slug}:`);
console.log(`  src/lib/components/ui/${slug}/${slug}.svelte`);
console.log(`  src/lib/components/ui/${slug}/index.ts`);
console.log(`  src/lib/site/demos/${slug}.svelte`);
console.log(`  catalog entry under ${category}`);
console.log('Next: build it, then pnpm registry:build && pnpm check.');
