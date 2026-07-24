import type { Component } from 'svelte';
import data from './blocks.json';

// Blocks are full screens and flows, not single components. Each is a
// self-contained .svelte file under ./blocks so the Code tab can hand the
// visitor the complete source to copy into their app.
const modules = import.meta.glob('./blocks/*.svelte') as Record<
	string,
	() => Promise<{ default: Component }>
>;
const sources = import.meta.glob('./blocks/*.svelte', {
	query: '?raw',
	import: 'default'
}) as Record<string, () => Promise<string>>;

export const blockCategories = ['Featured', 'Agents', 'App shell', 'Auth'] as const;
export type BlockCategory = (typeof blockCategories)[number];

export type BlockMeta = {
	slug: string;
	name: string;
	category: BlockCategory;
	description: string;
};

export const blocks: BlockMeta[] = data as BlockMeta[];

export async function getBlock(slug: string): Promise<{
	Component: Component | null;
	source: string;
}> {
	const key = `./blocks/${slug}.svelte`;
	const [module, source] = await Promise.all([modules[key]?.(), sources[key]?.()]);
	return { Component: module?.default ?? null, source: (source ?? '').trim() };
}
