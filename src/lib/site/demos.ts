import type { Component } from 'svelte';

// Each demo is a tiny .svelte file under ./demos. We load both the runnable
// component (for the live Preview) and its raw source (for the Code tab).
const modules = import.meta.glob('./demos/*.svelte') as Record<
	string,
	() => Promise<{ default: Component }>
>;
const sources = import.meta.glob('./demos/*.svelte', {
	query: '?raw',
	import: 'default'
}) as Record<string, () => Promise<string>>;

export async function getDemo(slug: string): Promise<{
	Component: Component | null;
	source: string;
}> {
	const key = `./demos/${slug}.svelte`;
	const [module, source] = await Promise.all([modules[key]?.(), sources[key]?.()]);
	return { Component: module?.default ?? null, source: (source ?? '').trim() };
}

export async function getDemoComponent(slug: string): Promise<Component | null> {
	return (await modules[`./demos/${slug}.svelte`]?.())?.default ?? null;
}

export function hasDemo(slug: string): boolean {
	return `./demos/${slug}.svelte` in modules;
}
