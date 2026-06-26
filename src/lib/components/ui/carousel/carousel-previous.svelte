<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import { getCarouselContext } from './context.js';

	type Props = HTMLButtonAttributes & {
		variant?: ButtonVariant;
		class?: string;
		ref?: HTMLButtonElement | null;
	};

	let { variant = 'secondary', class: className, ref = $bindable(null), ...rest }: Props = $props();

	const ctx = getCarouselContext();
</script>

<button
	bind:this={ref}
	class={cn(
		buttonVariants({ variant, size: 'icon' }),
		'absolute z-20 size-9 rounded-full disabled:pointer-events-none disabled:opacity-50',
		ctx.orientation === 'horizontal'
			? '-left-4 top-1/2 -translate-y-1/2'
			: '-top-4 left-1/2 -translate-x-1/2 rotate-90',
		className
	)}
	disabled={!ctx.canScrollPrev}
	onclick={ctx.scrollPrev}
	{...rest}
>
	<ArrowLeftIcon class="relative z-10 size-4" />
	<span class="sr-only">Previous slide</span>
</button>
