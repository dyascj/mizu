<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/**
		 * How the placeholder shows it is still waiting. `shimmer` passes a faint
		 * highlight across and then rests for a beat, so it reads as calm rather
		 * than busy. `pulse` fades in and out. `none` holds still.
		 */
		animation?: 'shimmer' | 'pulse' | 'none';
		/** The placeholder element. */
		ref?: HTMLDivElement | null;
		class?: string;
	};

	let { animation = 'shimmer', ref = $bindable(null), class: className, ...rest }: Props = $props();
</script>

<div
	bind:this={ref}
	data-animation={animation}
	class={cn(
		'bg-muted/70 rounded-md',
		animation === 'pulse' && 'animate-pulse',
		animation === 'shimmer' && 'skeleton-shimmer relative overflow-hidden',
		className
	)}
	{...rest}
></div>

<style>
	/* The highlight is barely darker than the bone and crawls across it, then
	   rests for the last 30% of each loop. */
	.skeleton-shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--foreground) 6%, transparent),
			transparent
		);
		translate: -100% 0;
		animation: skeleton-shimmer calc(var(--duration-ambient) * 0.9) var(--ease-in-out) infinite;
	}

	@keyframes skeleton-shimmer {
		70%,
		100% {
			translate: 100% 0;
		}
	}

	/* Right to left, it crawls the way the line reads. */
	.skeleton-shimmer:dir(rtl)::after {
		translate: 100% 0;
		animation-name: skeleton-shimmer-rtl;
	}

	@keyframes skeleton-shimmer-rtl {
		70%,
		100% {
			translate: -100% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-shimmer::after {
			display: none;
		}
	}
</style>
