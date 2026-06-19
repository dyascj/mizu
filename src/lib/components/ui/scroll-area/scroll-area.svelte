<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import Scrollbar from './scroll-area-scrollbar.svelte';

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'vertical',
		viewportClass,
		children,
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.RootProps> & {
		class?: string;
		viewportClass?: string;
		orientation?: 'vertical' | 'horizontal' | 'both';
		children: Snippet;
	} = $props();
</script>

<ScrollAreaPrimitive.Root bind:ref class={cn('relative overflow-hidden', className)} {...restProps}>
	<ScrollAreaPrimitive.Viewport class={cn('h-full w-full rounded-[inherit]', viewportClass)}>
		{@render children?.()}
	</ScrollAreaPrimitive.Viewport>
	{#if orientation === 'vertical' || orientation === 'both'}
		<Scrollbar orientation="vertical" />
	{/if}
	{#if orientation === 'horizontal' || orientation === 'both'}
		<Scrollbar orientation="horizontal" />
	{/if}
	<ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>
