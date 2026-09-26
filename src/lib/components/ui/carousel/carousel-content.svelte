<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import { cn } from '$lib/utils.js';
	import { getCarouselContext } from './context.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** Classes for the track that holds the items. */
		class?: string;
		/** The track element. */
		ref?: HTMLDivElement | null;
		/** The items. */
		children?: Snippet;
	};

	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();

	const ctx = getCarouselContext();
</script>

<div
	class={cn(
		'overflow-hidden',
		// The focus effect fades the edges to hint at more, pads the viewport so
		// the cards' shadows are not clipped, and shows that it can be dragged.
		ctx.effect === 'focus' && 'cursor-grab data-dragging:cursor-grabbing data-dragging:select-none',
		ctx.effect === 'focus' &&
			(ctx.orientation === 'horizontal'
				? '-my-4 [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)] py-4'
				: '-mx-4 [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-2rem),transparent)] px-4')
	)}
	data-slot="carousel-viewport"
	use:emblaCarouselSvelte={{ options: ctx.options, plugins: ctx.plugins }}
	onemblaInit={ctx.onInit}
>
	<div
		bind:this={ref}
		class={cn('flex', ctx.orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</div>
