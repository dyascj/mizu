import type { Component } from 'svelte';
import data from './blocks.json';

// Blocks are full screens and flows, not single components. Each is a
// self-contained .svelte file under ./blocks so the Code tab can hand the
// visitor the complete source to copy into their app.
const modules = import.meta.glob('./blocks/*.svelte', { eager: true }) as Record<
	string,
	{ default: Component }
>;
const sources = import.meta.glob('./blocks/*.svelte', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

export const blockCategories = ['Featured', 'Agents', 'App shell', 'Auth'] as const;
export type BlockCategory = (typeof blockCategories)[number];

export type BlockMeta = {
	slug: string;
	name: string;
	category: BlockCategory;
	description: string;
};

export const blocks: BlockMeta[] = data as BlockMeta[];

export function getBlock(slug: string): { Component: Component | null; source: string } {
	const key = `./blocks/${slug}.svelte`;
	return { Component: modules[key]?.default ?? null, source: (sources[key] ?? '').trim() };
}
