<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Animate the bars (a live voice) or hold them still. */
		active?: boolean;
		bars?: number;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		active = true,
		bars = 5,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// resting heights arc toward the middle so the idle state still reads as voice
	const heights = $derived(
		Array.from({ length: bars }, (_, i) => {
			const t = bars === 1 ? 1 : i / (bars - 1);
			return 0.35 + 0.65 * Math.sin(Math.PI * t);
		})
	);
</script>

<div
	bind:this={ref}
	role="img"
	aria-label={active ? 'Voice level' : 'Voice idle'}
	class={cn('flex h-8 items-center justify-center gap-1', className)}
	{...rest}
>
	{#each heights as h, i (i)}
		<span
			class={cn('w-1 rounded-full bg-primary', active && 'wave-bar')}
			style="height: {Math.round(h * 100)}%; animation-delay: {i * 120}ms;"
		></span>
	{/each}
</div>

<style>
	.wave-bar {
		animation: wave 1s ease-in-out infinite;
		transform-origin: center;
		will-change: transform;
	}

	@keyframes wave {
		0%,
		100% {
			transform: scaleY(0.5);
		}
		50% {
			transform: scaleY(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wave-bar {
			animation: none;
		}
	}
</style>
