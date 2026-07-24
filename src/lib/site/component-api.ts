import { parseProps } from './props.js';

/** A single documented prop, as parsed from component source. */
export type PropRow = ReturnType<typeof parseProps>['props'][number];

/** API for one part of a component (a single `.svelte` file). */
export type ApiPart = {
	/** Display name, e.g. `Button` or `Dialog.Content`. */
	title: string;
	props: PropRow[];
	extendsTypes: string[];
};

/** A source file for the "Source" section. */
export type SourceFile = { file: string; lang: 'svelte' | 'ts'; code: string };

// Raw component source, split into per-file lazy modules for the docs site.
// A component page fetches only the current slug's source and API inputs.
const raw = import.meta.glob(
	['../components/ui/**/*.{svelte,ts}', '!../components/ui/**/*.{test,spec}.{svelte,ts}'],
	{
		query: '?raw',
		import: 'default'
	}
) as Record<string, () => Promise<string>>;

/** key → { slug, file } where key is `…/ui/<slug>/<file>`. */
function locate(key: string): { slug: string; file: string } | null {
	const m = key.match(/\/ui\/([^/]+)\/(.+)$/);
	return m ? { slug: m[1], file: m[2] } : null;
}

const pascal = (s: string) =>
	s
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');

/**
 * Turn a filename into the name a consumer imports it as. Single-file
 * components read as the component name (`Button`); compound parts read as
 * `Namespace.Part` (`Dialog.Content`, `Dialog.Root`).
 */
function partTitle(slug: string, file: string, single: boolean): string {
	const base = file.replace(/\.svelte$/, '');
	const ns = pascal(slug);
	if (single) return ns;
	if (base === slug) return `${ns}.Root`;
	if (base.startsWith(`${slug}-`)) return `${ns}.${pascal(base.slice(slug.length + 1))}`;
	return pascal(base);
}

function filesFor(slug: string): { file: string; key: string }[] {
	return Object.keys(raw)
		.map((key) => ({ key, loc: locate(key) }))
		.filter((x): x is { key: string; loc: { slug: string; file: string } } =>
			Boolean(x.loc && x.loc.slug === slug)
		)
		.map((x) => ({ file: x.loc.file, key: x.key }));
}

// Root file (`<slug>.svelte`) first, then alphabetical; `.ts` (barrels) last.
function order(a: { file: string }, b: { file: string }, slug: string) {
	const rank = (f: string) => (f === `${slug}.svelte` ? 0 : f.endsWith('.ts') ? 2 : 1);
	return rank(a.file) - rank(b.file) || a.file.localeCompare(b.file);
}

/** Parsed, presentable API for each documentable part of a component. */
export async function getComponentApi(slug: string): Promise<ApiPart[]> {
	const svelte = filesFor(slug)
		.filter((f) => f.file.endsWith('.svelte'))
		.sort((a, b) => order(a, b, slug));
	const single = svelte.length === 1;
	const parts = await Promise.all(
		svelte.map(async ({ file, key }) => {
			const source = await raw[key]();
			const { props, extendsTypes } = parseProps(source);
			return { title: partTitle(slug, file, single), props, extendsTypes };
		})
	);
	return parts.filter((part) => part.props.length > 0 || part.extendsTypes.length > 0);
}

/** Every source file of a component, for the collapsible "Source" section. */
export async function getComponentSource(slug: string): Promise<SourceFile[]> {
	return Promise.all(
		filesFor(slug)
			.sort((a, b) => order(a, b, slug))
			.map(async ({ file, key }) => ({
				file,
				lang: file.endsWith('.ts') ? 'ts' : 'svelte',
				code: (await raw[key]()).trim()
			}))
	);
}
