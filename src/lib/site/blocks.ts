import type { Component } from 'svelte';

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

export type BlockMeta = {
	slug: string;
	name: string;
	description: string;
};

export const blocks: BlockMeta[] = [
	{
		slug: 'assistant-chat',
		name: 'Assistant chat',
		description:
			'The full conversation screen: reasoning, a tool call, a streaming reply with sources and actions, starter prompts, and the composer.'
	},
	{
		slug: 'voice-mode',
		name: 'Voice mode',
		description:
			'A fullscreen listening surface on a drifting aurora: the orb, a live waveform, and mute and done controls.'
	},
	{
		slug: 'agent-dashboard',
		name: 'Agent dashboard',
		description:
			'A working session at a glance: your agents, a live plan with a running tool, focus for the day, and a proactive nudge.'
	},
	{
		slug: 'personalize',
		name: 'Personalize',
		description:
			'Onboarding for a companion: pick a style from aura tiles, set the conversation tone, grant permissions, and create.'
	}
];

export function getBlock(slug: string): { Component: Component | null; source: string } {
	const key = `./blocks/${slug}.svelte`;
	return { Component: modules[key]?.default ?? null, source: (sources[key] ?? '').trim() };
}
