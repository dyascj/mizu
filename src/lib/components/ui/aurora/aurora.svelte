<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Override the drifting blob colors (defaults to the pastel aura palette). */
		colors?: string[];
		/** Seconds for the base drift loop. Larger = slower and dreamier. */
		speed?: number;
		/** Blur radius of the blobs, e.g. '64px'. */
		blur?: string;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	const defaultColors = [
		'#ffd9e8', // pink
		'#e6d9ff', // lavender
		'#cfe9ff', // blue
		'#ffedd6' // peach
	];

	let {
		colors = defaultColors,
		speed = 18,
		blur = '64px',
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// Four drifting blobs, each pulling its color from `colors` (wrapping if fewer
	// are supplied) so the mesh always has something to fade between.
	const blobs = $derived([0, 1, 2, 3].map((i) => colors[i % colors.length]));
</script>

<div
	bind:this={ref}
	aria-hidden="true"
	class={cn('mizu-aurora pointer-events-none overflow-hidden', className)}
	style="--aurora-speed: {speed}s; --aurora-blur: {blur};"
	{...rest}
>
	<div
		class="mizu-aurora-blob mizu-aurora-a absolute rounded-full mix-blend-normal dark:mix-blend-screen"
		style="--aurora-color: {blobs[0]};"
	></div>
	<div
		class="mizu-aurora-blob mizu-aurora-b absolute rounded-full mix-blend-normal dark:mix-blend-screen"
		style="--aurora-color: {blobs[1]};"
	></div>
	<div
		class="mizu-aurora-blob mizu-aurora-c absolute rounded-full mix-blend-normal dark:mix-blend-screen"
		style="--aurora-color: {blobs[2]};"
	></div>
	<div
		class="mizu-aurora-blob mizu-aurora-d absolute rounded-full mix-blend-normal dark:mix-blend-screen"
		style="--aurora-color: {blobs[3]};"
	></div>
</div>

<style>
	.mizu-aurora {
		position: absolute;
		inset: 0;
	}

	.mizu-aurora-blob {
		/* Each blob is a soft radial wash of its color, larger than the frame so
		   the edges always read as glow rather than a hard circle. */
		width: 90%;
		height: 90%;
		background: radial-gradient(circle at 50% 50%, var(--aurora-color) 0%, transparent 68%);
		filter: blur(var(--aurora-blur));
		opacity: 0.5;
		will-change: transform, opacity;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
	}

	/* Four blobs drifting on different paths/rates so the mesh never repeats
	   obviously. Durations are multiples of the base loop for slow cross-fades. */
	.mizu-aurora-a {
		top: -20%;
		left: -15%;
		animation-name: aurora-a;
		animation-duration: var(--aurora-speed);
	}
	.mizu-aurora-b {
		top: -10%;
		right: -20%;
		left: auto;
		animation-name: aurora-b;
		animation-duration: calc(var(--aurora-speed) * 1.45);
	}
	.mizu-aurora-c {
		bottom: -25%;
		left: -10%;
		top: auto;
		animation-name: aurora-c;
		animation-duration: calc(var(--aurora-speed) * 1.2);
	}
	.mizu-aurora-d {
		right: -15%;
		bottom: -15%;
		top: auto;
		left: auto;
		animation-name: aurora-d;
		animation-duration: calc(var(--aurora-speed) * 1.7);
	}

	@keyframes aurora-a {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
			opacity: 0.45;
		}
		50% {
			transform: translate(24%, 18%) scale(1.2);
			opacity: 0.65;
		}
	}

	@keyframes aurora-b {
		0%,
		100% {
			transform: translate(0, 0) scale(1.1);
			opacity: 0.4;
		}
		50% {
			transform: translate(-20%, 22%) scale(0.92);
			opacity: 0.62;
		}
	}

	@keyframes aurora-c {
		0%,
		100% {
			transform: translate(0, 0) scale(0.95);
			opacity: 0.5;
		}
		50% {
			transform: translate(22%, -20%) scale(1.18);
			opacity: 0.3;
		}
	}

	@keyframes aurora-d {
		0%,
		100% {
			transform: translate(0, 0) scale(1.05);
			opacity: 0.4;
		}
		50% {
			transform: translate(-24%, -16%) scale(0.9);
			opacity: 0.6;
		}
	}

	/* Self-contained: when motion is reduced the blobs hold a pleasing static
	   spread instead of drifting, even if copied out without app.css. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-aurora-blob {
			animation: none;
		}
	}
</style>
