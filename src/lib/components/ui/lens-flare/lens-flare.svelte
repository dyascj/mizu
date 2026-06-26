<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Horizontal position of the sun core, in %. */
		x?: number;
		/** Vertical position of the sun core, in %. */
		y?: number;
		/** Diameter of the bright core, in px. */
		size?: number;
		/** Core color; blends out to aqua in the bloom. */
		color?: string;
		/** Overall opacity scale, 0–1. */
		intensity?: number;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		x = 78,
		y = 22,
		size = 140,
		color = 'rgba(255,255,255,0.9)',
		intensity = 1,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// Ghosts march along the diagonal that runs from the sun through the frame
	// center and out the far side — the classic lens-reflection axis. Each ghost's
	// position is a deterministic interpolation; t < 0 sits beyond the sun, t > 0
	// on the opposite side. Sizes/opacities are fixed (no RNG) for SSR stability.
	type Ghost = { x: number; y: number; size: number; opacity: number; aqua: boolean };

	const ghosts = $derived.by<Ghost[]>(() => {
		const cx = 50;
		const cy = 50;
		// Fraction of the way from the sun toward (and past) center, per ghost.
		const stops = [
			{ t: 0.34, size: 0.5, opacity: 0.22, aqua: false },
			{ t: 0.62, size: 0.28, opacity: 0.16, aqua: true },
			{ t: 0.92, size: 0.7, opacity: 0.14, aqua: false },
			{ t: 1.32, size: 0.42, opacity: 0.18, aqua: true }
		];
		return stops.map((s) => ({
			x: x + (cx - x) * s.t,
			y: y + (cy - y) * s.t,
			size: size * s.size,
			opacity: s.opacity,
			aqua: s.aqua
		}));
	});
</script>

<div
	bind:this={ref}
	aria-hidden="true"
	class={cn('mizu-flare pointer-events-none overflow-hidden', className)}
	style="--flare-color: {color}; --flare-intensity: {intensity};"
	{...rest}
>
	<!-- Anamorphic horizontal streak through the sun. -->
	<div
		class="mizu-flare-streak absolute"
		style="left: 0; right: 0; top: {y}%; --flare-x: {x}%;"
	></div>

	<!-- Soft outer bloom. -->
	<div
		class="mizu-flare-bloom mizu-flare-pulse absolute rounded-full"
		style="left: {x}%; top: {y}%; width: {size * 2.6}px; height: {size * 2.6}px;"
	></div>

	<!-- Bright core. -->
	<div
		class="mizu-flare-core mizu-flare-pulse absolute rounded-full"
		style="left: {x}%; top: {y}%; width: {size}px; height: {size}px;"
	></div>

	<!-- Ghost circles along the reflection axis. -->
	{#each ghosts as g, i (i)}
		<div
			class="mizu-flare-ghost absolute rounded-full"
			class:mizu-flare-ghost-aqua={g.aqua}
			style="left: {g.x}%; top: {g.y}%; width: {g.size}px; height: {g.size}px; --ghost-opacity: {g.opacity};"
		></div>
	{/each}
</div>

<style>
	.mizu-flare {
		position: absolute;
		inset: 0;
		opacity: var(--flare-intensity);
	}

	/* Everything positioned by its center. */
	.mizu-flare-core,
	.mizu-flare-bloom,
	.mizu-flare-ghost {
		transform: translate(-50%, -50%);
		mix-blend-mode: screen;
		will-change: transform, opacity;
	}

	.mizu-flare-core {
		background: radial-gradient(
			circle at 50% 50%,
			var(--flare-color) 0%,
			rgba(255, 255, 255, 0.6) 22%,
			color-mix(in oklab, #5cd5ff 70%, transparent) 48%,
			transparent 72%
		);
		filter: blur(2px);
	}

	.mizu-flare-bloom {
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, var(--flare-color) 50%, transparent) 0%,
			color-mix(in oklab, #74e0ff 24%, transparent) 38%,
			transparent 70%
		);
		filter: blur(8px);
		opacity: 0.7;
	}

	.mizu-flare-streak {
		height: 2px;
		transform: translateY(-50%);
		mix-blend-mode: screen;
		/* Brightest at the sun, fading both ways across the frame. */
		background: linear-gradient(
			90deg,
			transparent 0%,
			color-mix(in oklab, var(--flare-color) 35%, transparent) calc(var(--flare-x) - 34%),
			var(--flare-color) var(--flare-x),
			color-mix(in oklab, var(--flare-color) 35%, transparent) calc(var(--flare-x) + 34%),
			transparent 100%
		);
		filter: blur(0.5px);
		opacity: 0.55;
	}

	.mizu-flare-ghost {
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, var(--flare-color) 60%, transparent) 0%,
			color-mix(in oklab, var(--flare-color) 18%, transparent) 46%,
			transparent 70%
		);
		opacity: var(--ghost-opacity);
		filter: blur(1px);
	}

	/* Some ghosts pick up an aqua refraction, like real coated glass. */
	.mizu-flare-ghost-aqua {
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, #97e6ff 60%, transparent) 0%,
			color-mix(in oklab, #cbb6ff 22%, transparent) 48%,
			transparent 72%
		);
	}

	.mizu-flare-pulse {
		animation: flare-breathe 6s ease-in-out infinite;
	}

	@keyframes flare-breathe {
		0%,
		100% {
			opacity: 0.78;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.06);
		}
	}

	/* Self-contained: drop the breathing pulse when motion is reduced; the flare
	   stays bright and centered. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-flare-pulse {
			animation: none;
		}
	}
</style>
