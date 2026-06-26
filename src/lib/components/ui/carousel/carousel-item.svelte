<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
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
	bind:this={ref}
	role="group"
	aria-roledescription="slide"
	class={cn(
		'min-w-0 shrink-0 grow-0 basis-full',
		ctx.orientation === 'horizontal' ? 'pl-4' : 'pt-4',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
