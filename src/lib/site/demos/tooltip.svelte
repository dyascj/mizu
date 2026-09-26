<script lang="ts">
	import type { Component } from 'svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Copy from '@lucide/svelte/icons/copy';
	import Volume from '@lucide/svelte/icons/volume-2';
	import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDown from '@lucide/svelte/icons/thumbs-down';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Refresh from '@lucide/svelte/icons/refresh-cw';
	import { cn } from '$lib/utils.js';

	type Action = { key: string; label: string; icon: Component; toggle?: boolean };

	const actions: Action[] = [
		{ key: 'copy', label: 'Copy', icon: Copy },
		{ key: 'read', label: 'Read aloud', icon: Volume, toggle: true },
		{ key: 'good', label: 'Good response', icon: ThumbsUp, toggle: true },
		{ key: 'bad', label: 'Bad response', icon: ThumbsDown, toggle: true },
		{ key: 'branch', label: 'Branch in new chat', icon: GitBranch },
		{ key: 'retry', label: 'Regenerate', icon: Refresh }
	];

	let pressed = $state<Record<string, boolean>>({});
	let active = $state(0);
	const buttons: HTMLElement[] = [];

	function toggle(action: Action) {
		if (!action.toggle) return;
		const next = !pressed[action.key];
		pressed[action.key] = next;
		// A response is good or bad, never both.
		if (next && action.key === 'good') pressed.bad = false;
		if (next && action.key === 'bad') pressed.good = false;
	}

	// One tab stop for the whole toolbar; arrows move within it.
	function onkeydown(event: KeyboardEvent) {
		const last = actions.length - 1;
		const moves: Record<string, number> = {
			ArrowRight: active === last ? 0 : active + 1,
			ArrowLeft: active === 0 ? last : active - 1,
			Home: 0,
			End: last
		};
		const next = moves[event.key];
		if (next === undefined) return;
		event.preventDefault();
		active = next;
		buttons[next]?.focus();
	}
</script>

<div class="flex w-full max-w-sm flex-col items-start gap-10">
	<p class="text-sm leading-relaxed">
		Twenty minutes, one pan: miso-glazed salmon over rice with charred scallions and a squeeze of
		lime.
	</p>
	<Tooltip.Group>
		<div
			role="toolbar"
			aria-label="Response actions"
			tabindex="-1"
			class="bg-card flex max-w-full flex-wrap items-center gap-0.5 rounded-full p-1 shadow-sm"
			{onkeydown}
		>
			{#each actions as action, index (action.key)}
				<Tooltip.GroupTrigger
					content={action.label}
					bind:ref={() => buttons[index] ?? null, (el) => el && (buttons[index] = el)}
					aria-label={action.label}
					aria-pressed={action.toggle ? Boolean(pressed[action.key]) : undefined}
					tabindex={index === active ? 0 : -1}
					onfocus={() => (active = index)}
					onclick={() => toggle(action)}
					class={cn(
						'text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-full transition-[scale,color,background-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.94]',
						pressed[action.key] ? 'bg-primary-muted text-primary' : 'hover:bg-secondary'
					)}
				>
					<action.icon class="size-4" aria-hidden="true" />
				</Tooltip.GroupTrigger>
			{/each}
		</div>
	</Tooltip.Group>
</div>
