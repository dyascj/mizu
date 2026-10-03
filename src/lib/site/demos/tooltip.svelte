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

	const reply =
		'Twenty minutes, one pan: miso-glazed salmon over rice with charred scallions and a squeeze of lime.';

	let pressed = $state<Record<string, boolean>>({});
	let active = $state(0);
	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;
	const buttons: HTMLElement[] = [];

	$effect(() => () => clearTimeout(copiedTimer));

	function toggle(action: Action) {
		if (action.key === 'copy') {
			// The tooltip turns into Copied while it shows, once the clipboard accepts.
			navigator.clipboard?.writeText(reply).then(
				() => {
					copied = true;
					clearTimeout(copiedTimer);
					copiedTimer = setTimeout(() => (copied = false), 1500);
				},
				() => {}
			);
			return;
		}
		if (!action.toggle) return;
		const next = !pressed[action.key];
		pressed[action.key] = next;
		// A response is good or bad, never both.
		if (next && action.key === 'good') pressed.bad = false;
		if (next && action.key === 'bad') pressed.good = false;
	}

	// One tab stop for the whole toolbar; arrows move within it.
	function onkeydown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
		const last = actions.length - 1;
		const forward = active === last ? 0 : active + 1;
		const back = active === 0 ? last : active - 1;
		// The row mirrors in RTL, so each arrow keeps moving the way it points.
		const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		const moves: Record<string, number> = {
			ArrowRight: rtl ? back : forward,
			ArrowLeft: rtl ? forward : back,
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
		{reply}
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
					content={action.key === 'copy' && copied ? 'Copied' : action.label}
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
