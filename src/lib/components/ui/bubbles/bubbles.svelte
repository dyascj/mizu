<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		count?: number;
		color?: string;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		count = 14,
		color = 'rgba(255,255,255,0.5)',
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// Deterministic per-bubble variation derived from the loop index only.
	// No Math.random() so SSR and client render identically (no hydration mismatch).
	type Bubble = {
		left: number; // %
		size: number; // px
		duration: number; // s
		delay: number; // s
		drift: number; // px horizontal sway amplitude
	};

	const bubbles = $derived.by<Bubble[]>(() => {
		const out: Bubble[] = [];
		for (let i = 0; i < count; i++) {
			// simple integer hashes spread the values without RNG
			const left = ((i * 6863) % 100) + ((i % 5) * 0.7);
			const size = 6 + ((i * 7919) % 16); // 6–21px
			const duration = 6 + ((i * 4639) % 70) / 10; // 6.0–12.9s
			const delay = ((i * 3203) % 80) / 10; // 0–7.9s
			const drift = ((i % 2 === 0 ? 1 : -1) * (8 + ((i * 2741) % 14))); // ±8–21px
			out.push({
				left: Math.min(left, 98),
				size,
				duration,
				delay,
				drift
			});
		}
		return out;
	});
</script>

<div
	bind:this={ref}
	aria-hidden="true"
	class={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
	style="--bubble-color: {color};"
	{...rest}
>
	{#each bubbles as b, i (i)}
		<span
			class="mizu-bubble"
			style="
				left: {b.left}%;
				width: {b.size}px;
				height: {b.size}px;
				--bubble-drift: {b.drift}px;
				animation-duration: {b.duration}s;
				animation-delay: {b.delay}s;
			"
		></span>
	{/each}
</div>

<style>
	.mizu-bubble {
		position: absolute;
		bottom: -24px;
		display: block;
		border-radius: 9999px;
		background: radial-gradient(
			circle at 30% 30%,
			rgba(255, 255, 255, 0.9),
			var(--bubble-color) 55%,
			transparent 78%
		);
		box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.6);
		opacity: 0;
		will-change: transform, opacity;
		animation-name: bubbleRise;
		animation-timing-function: ease-in;
		animation-iteration-count: infinite;
	}

	@keyframes bubbleRise {
		0% {
			transform: translate(0, 0) scale(0.6);
			opacity: 0;
		}
		12% {
			opacity: 1;
		}
		50% {
			transform: translate(var(--bubble-drift), -160%) scale(1);
		}
		85% {
			opacity: 1;
		}
		100% {
			transform: translate(0, -320%) scale(1.05);
			opacity: 0;
		}
	}
</style>
