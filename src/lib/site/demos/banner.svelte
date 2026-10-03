<script lang="ts">
	import { onMount } from 'svelte';
	import { Banner } from '$lib/components/ui/banner';
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import { cn } from '$lib/utils.js';

	// Closed on the server and the first frame, then opened, so the entrance plays.
	let open = $state(false);
	let settled = $state(false);
	let bar = $state<HTMLElement | null>(null);
	let again = $state<HTMLButtonElement | null>(null);

	onMount(() => {
		const frame = requestAnimationFrame(() => {
			open = true;
			settled = true;
		});
		return () => cancelAnimationFrame(frame);
	});

	function restore() {
		open = true;
		// Focus can only move once the bar has lost its inert attribute and the
		// browser has caught up with that.
		requestAnimationFrame(() => bar?.focus({ preventScroll: true }));
	}

	const stats = [
		['Chats', '12.4k'],
		['Reply', '1.8 s'],
		['Liked', '96%']
	];
</script>

<div class="bg-card relative h-72 w-full max-w-md overflow-hidden rounded-2xl shadow-sm">
	<!-- The dismiss button is going away; focus goes to the one way back. -->
	<Banner bind:open bind:ref={bar} returnFocus={again ?? undefined}>
		{#snippet icon()}<AudioLines />{/snippet}
		Voice mode is now on for every assistant.
		{#snippet action()}<a href="#voice">Try it</a>{/snippet}
	</Banner>

	<!-- In normal flow under the banner, so it rides the same height change
	     with no animation of its own. -->
	<div class="flex h-12 items-center gap-4 px-5 text-sm whitespace-nowrap">
		<span class="font-semibold tracking-tight">Acme Assist</span>
		<span>Overview</span>
		<span class="text-muted-foreground hidden sm:inline">Settings</span>
		<span aria-hidden="true" class="bg-secondary ms-auto size-7 shrink-0 rounded-full"></span>
	</div>
	<div class="px-5 pt-2">
		<p class="text-lg font-semibold tracking-tight">This week</p>
		<p class="text-muted-foreground text-sm">Your support assistant answered most chats alone.</p>
		<div class="mt-4 grid grid-cols-3 gap-2">
			{#each stats as [name, value] (name)}
				<div class="bg-secondary min-w-0 rounded-xl px-2.5 py-2.5 sm:px-3">
					<p class="text-muted-foreground truncate text-xs">{name}</p>
					<p class="mt-0.5 truncate font-medium tabular-nums">{value}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Pinned to the frame, so it stays under the pointer while the banner
	     reopens and pushes the page down. Arrives once the bar has gone. -->
	<button
		bind:this={again}
		type="button"
		onclick={restore}
		inert={open || !settled}
		class={cn(
			'bg-secondary text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute end-3 bottom-3 inline-flex h-9 items-center rounded-full px-4 text-sm font-medium shadow-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]',
			'transition-[opacity,filter,translate,scale] motion-reduce:translate-y-0 motion-reduce:blur-none',
			open || !settled
				? 'translate-y-1 opacity-0 blur-[2px] duration-(--duration-instant) ease-in'
				: 'translate-y-0 opacity-100 blur-none delay-(--duration-base) duration-(--duration-base) ease-out'
		)}
	>
		Show again
	</button>
</div>
