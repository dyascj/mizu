import type { Component } from 'svelte';

// Each demo is a tiny .svelte file under ./demos. We load both the runnable
// component (for the live Preview) and its raw source (for the Code tab).
const modules = import.meta.glob('./demos/*.svelte', { eager: true }) as Record<
	string,
	{ default: Component }
>;
const sources = import.meta.glob('./demos/*.svelte', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

export function getDemo(slug: string): { Component: Component | null; source: string } {
	const key = `./demos/${slug}.svelte`;
	return { Component: modules[key]?.default ?? null, source: (sources[key] ?? '').trim() };
}

export function hasDemo(slug: string): boolean {
	return `./demos/${slug}.svelte` in modules;
}
