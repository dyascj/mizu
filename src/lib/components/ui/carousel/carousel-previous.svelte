<script lang="ts">
	import { tick } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import { getCarouselContext } from './context.js';

	type Props = HTMLButtonAttributes & {
		/** Button style. */
		variant?: ButtonVariant;
		/** Classes for the button. */
		class?: string;
		/** The button element. */
		ref?: HTMLButtonElement | null;
	};

	let { variant = 'secondary', class: className, ref = $bindable(null), ...rest }: Props = $props();

	const ctx = getCarouselContext();

	// Reaching the end disables this button, which would drop focus to the
	// page. Focus moves to the other arrow instead.
	$effect.pre(() => {
		if (ctx.canScrollPrev || !ref || document.activeElement !== ref) return;
		const root = ref.closest('[data-slot="carousel"]');
		void tick().then(() =>
			root?.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]:not(:disabled)')?.focus()
		);
	});
</script>

<button
	bind:this={ref}
	type="button"
	data-slot="carousel-previous"
	class={cn(
		buttonVariants({ variant, size: 'icon' }),
		'absolute z-20 size-9 rounded-full disabled:pointer-events-none disabled:opacity-50',
		ctx.orientation === 'horizontal'
			? 'top-1/2 -left-4 -translate-y-1/2'
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
