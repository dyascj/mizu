<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getCarouselContext } from './context.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** Classes for the slide. Set a basis below `basis-full` to show neighbours. */
		class?: string;
		/** The slide element. */
		ref?: HTMLDivElement | null;
		/**
		 * The slide's content. With the focus effect, the first element scales
		 * and fades with the slide's distance from the center.
		 */
		children?: Snippet;
	};

	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();

	const ctx = getCarouselContext();
</script>

<div
	bind:this={ref}
	role="group"
	aria-roledescription="slide"
	data-slot="carousel-item"
	class={cn(
		'carousel-item min-w-0 shrink-0 grow-0 basis-full',
		// Takes focus only when the selection moves out from under a focused
		// control; the ring then goes on the card, not the gutter.
		'focus-visible:*:ring-ring outline-none focus-visible:*:ring-2',
		ctx.orientation === 'horizontal' ? 'ps-4' : 'pt-4',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>

<style>
	/* The slide snaps and its content moves, so the scale never changes what
	   the snap points measure. Linear in the distance from the center, like a
	   scroll-driven animation: full size in the middle, 0.9 and half faded by
	   the time it leaves. Opacity never overshoots; reduced motion keeps the
	   fade and drops the scale. */
	:global([data-carousel-effect='focus']) .carousel-item > :global(*) {
		scale: calc(0.9 + 0.1 * var(--carousel-focus, 1));
		opacity: calc(0.5 + 0.5 * var(--carousel-focus, 1));
	}
	@media (prefers-reduced-motion: reduce) {
		:global([data-carousel-effect='focus']) .carousel-item > :global(*) {
			scale: none;
		}
	}
	/* Only the centered slide plays, and only while the carousel is on screen:
	   the neighbours hold whatever frame they reached, so a slide picks its
	   loop back up the moment it arrives in the middle. */
	:global([data-carousel-effect='focus']) .carousel-item :global(*) {
		animation-play-state: paused;
	}
	:global([data-carousel-effect='focus'][data-onscreen])
		.carousel-item:global([data-active])
		:global(*) {
		animation-play-state: running;
	}
</style>
