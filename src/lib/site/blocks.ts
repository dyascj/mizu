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

export const blockCategories = ['Featured', 'Agents', 'App shell', 'Auth'] as const;
export type BlockCategory = (typeof blockCategories)[number];

export type BlockMeta = {
	slug: string;
	name: string;
	category: BlockCategory;
	description: string;
};

export const blocks: BlockMeta[] = [
	{
		slug: 'assistant-chat',
		name: 'Assistant chat',
		category: 'Featured',
		description:
			'The full conversation screen: reasoning, a tool call, a streaming reply with sources and actions, starter prompts, and the composer.'
	},
	{
		slug: 'voice-mode',
		name: 'Voice mode',
		category: 'Featured',
		description:
			'A fullscreen listening surface on a drifting aurora: the orb, a live waveform, and mute and done controls.'
	},
	{
		slug: 'personalize',
		name: 'Personalize',
		category: 'Featured',
		description:
			'Onboarding for a companion: pick a style from aura tiles, set the conversation tone, grant permissions, and create.'
	},
	{
		slug: 'agent-dashboard',
		name: 'Agent dashboard',
		category: 'Agents',
		description:
			'A working session at a glance: your agents, a live plan with a running tool, focus for the day, and a proactive nudge.'
	},
	{
		slug: 'agent-run',
		name: 'Agent run',
		category: 'Agents',
		description:
			'A single run up close: the plan advancing, a live tool call, streaming findings, and pause and stop controls.'
	},
	{
		slug: 'sidebar-layout',
		name: 'Sidebar layout',
		category: 'App shell',
		description:
			'The full app shell: an icon-collapsible sidebar with chats and a group action, and a conversation in the inset.'
	},
	{
		slug: 'login',
		name: 'Login',
		category: 'Auth',
		description: 'A quiet sign-in card with the orb, email and password, and GitHub.'
	},
	{
		slug: 'signup',
		name: 'Sign up',
		category: 'Auth',
		description: 'Account creation ending in the gradient create button.'
	},
	{
		slug: 'otp',
		name: 'Verify code',
		category: 'Auth',
		description: 'Six-digit email verification with resend.'
	}
];

export function getBlock(slug: string): { Component: Component | null; source: string } {
	const key = `./blocks/${slug}.svelte`;
	return { Component: modules[key]?.default ?? null, source: (sources[key] ?? '').trim() };
}
