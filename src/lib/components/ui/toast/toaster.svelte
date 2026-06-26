<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils.js';
	import Toast from './toast.svelte';
	import { toaster } from './toast-state.svelte.js';

	type Position =
		| 'top-left'
		| 'top-center'
		| 'top-right'
		| 'bottom-left'
		| 'bottom-center'
		| 'bottom-right';

	let { position = 'bottom-right', class: className }: { position?: Position; class?: string } =
		$props();

	const isTop = $derived(position.startsWith('top'));

	const regionClass = $derived(
		cn(
			'pointer-events-none fixed z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5 p-0',
			isTop ? 'top-4 flex-col' : 'bottom-4 flex-col-reverse',
			position.endsWith('left') && 'left-4',
			position.endsWith('right') && 'right-4',
			position.endsWith('center') && 'left-1/2 -translate-x-1/2',
			className
		)
	);

	// Respect reduced motion: collapse the slide so toasts just fade.
	const reduce =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const flyY = $derived(reduce ? 0 : isTop ? -20 : 20);
</script>

<div class={regionClass} role="region" aria-label="Notifications" tabindex="-1">
	{#each toaster.toasts as toast (toast.id)}
		<div
			animate:flip={{ duration: reduce ? 0 : 280, easing: cubicOut }}
			in:fly={{ y: flyY, duration: reduce ? 0 : 280, easing: cubicOut }}
			out:fly={{ y: flyY * 0.6, duration: reduce ? 0 : 180, easing: cubicOut }}
		>
			<Toast {toast} />
		</div>
	{/each}
</div>
