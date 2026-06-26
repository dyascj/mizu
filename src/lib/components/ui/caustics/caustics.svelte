<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Color of the dancing light (defaults to an aqua-white). */
		color?: string;
		/** Overall strength of the caustics, 0–1. */
		opacity?: number;
		/** Seconds for the base ripple loop. Larger = slower water. */
		speed?: number;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		color = 'rgba(220,250,255,0.9)',
		opacity = 0.5,
		speed = 14,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();
</script>

<div
	bind:this={ref}
	aria-hidden="true"
	class={cn('mizu-caustics pointer-events-none overflow-hidden', className)}
	style="--caustics-color: {color}; --caustics-speed: {speed}s; opacity: {opacity};"
	{...rest}
>
	<!-- Three stacked gradient sheets drifting at different rates; their overlap
	     is what reads as the moving light at the bottom of a pool. -->
	<div class="mizu-caustics-layer mizu-caustics-1"></div>
	<div class="mizu-caustics-layer mizu-caustics-2"></div>
	<div class="mizu-caustics-layer mizu-caustics-3"></div>
</div>

<style>
	.mizu-caustics {
		position: absolute;
		inset: 0;
		/* Soft radial mask so the shimmer fades into the surface at the edges. */
		-webkit-mask-image: radial-gradient(120% 110% at 50% 40%, #000 38%, transparent 86%);
		mask-image: radial-gradient(120% 110% at 50% 40%, #000 38%, transparent 86%);
	}

	.mizu-caustics-layer {
		position: absolute;
		inset: -40%;
		mix-blend-mode: screen;
		will-change: transform;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
	}

	/* Layer 1 — broad cells, slow drift. */
	.mizu-caustics-1 {
		background:
			radial-gradient(24% 18% at 30% 35%, var(--caustics-color) 0%, transparent 60%),
			radial-gradient(20% 26% at 72% 28%, var(--caustics-color) 0%, transparent 62%),
			radial-gradient(28% 20% at 58% 74%, var(--caustics-color) 0%, transparent 64%);
		filter: blur(8px);
		opacity: 0.55;
		animation-name: caustics-drift-1;
		animation-duration: var(--caustics-speed);
	}

	/* Layer 2 — finer cells, opposite drift, half-strength. */
	.mizu-caustics-2 {
		background:
			radial-gradient(16% 12% at 22% 64%, var(--caustics-color) 0%, transparent 58%),
			radial-gradient(14% 18% at 80% 60%, var(--caustics-color) 0%, transparent 60%),
			radial-gradient(18% 14% at 46% 22%, var(--caustics-color) 0%, transparent 62%),
			radial-gradient(12% 16% at 64% 84%, var(--caustics-color) 0%, transparent 60%);
		filter: blur(6px);
		opacity: 0.45;
		animation-name: caustics-drift-2;
		animation-duration: calc(var(--caustics-speed) * 1.35);
	}

	/* Layer 3 — tiniest glints, fastest, very subtle. */
	.mizu-caustics-3 {
		background:
			radial-gradient(10% 8% at 40% 48%, var(--caustics-color) 0%, transparent 56%),
			radial-gradient(8% 12% at 68% 40%, var(--caustics-color) 0%, transparent 58%),
			radial-gradient(11% 9% at 18% 30%, var(--caustics-color) 0%, transparent 58%);
		filter: blur(4px);
		opacity: 0.4;
		animation-name: caustics-drift-3;
		animation-duration: calc(var(--caustics-speed) * 0.78);
	}

	@keyframes caustics-drift-1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1) rotate(0deg);
		}
		50% {
			transform: translate(6%, -4%) scale(1.12) rotate(3deg);
		}
	}

	@keyframes caustics-drift-2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1.08) rotate(0deg);
		}
		50% {
			transform: translate(-7%, 5%) scale(0.96) rotate(-4deg);
		}
	}

	@keyframes caustics-drift-3 {
		0%,
		100% {
			transform: translate(0, 0) scale(1) rotate(0deg);
		}
		50% {
			transform: translate(5%, 6%) scale(1.1) rotate(2deg);
		}
	}

	/* Self-contained: caustics are purely decorative, so when motion is reduced
	   they hold one calm frame rather than freezing mid-ripple. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-caustics-layer {
			animation: none;
		}
	}
</style>
