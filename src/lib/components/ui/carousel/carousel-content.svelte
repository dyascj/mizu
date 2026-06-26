<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import { cn } from '$lib/utils.js';
	import { getCarouselContext } from './context.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();

	const ctx = getCarouselContext();
</script>

<div
	class="overflow-hidden"
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
