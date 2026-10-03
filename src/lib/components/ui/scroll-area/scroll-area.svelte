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

	// bits-ui writes `dir="ltr"` on the root unless told otherwise, which would
	// undo a right-to-left page inside the area. Without a `dir` prop, follow
	// the surrounding direction instead.
	let inherited = $state<'ltr' | 'rtl'>('ltr');
	$effect(() => {
		const parent = ref?.parentElement;
		if (parent) inherited = getComputedStyle(parent).direction === 'rtl' ? 'rtl' : 'ltr';
	});
</script>

<ScrollAreaPrimitive.Root
	bind:ref
	class={cn('relative overflow-hidden', className)}
	{...restProps}
	dir={restProps.dir ?? inherited}
>
	<ScrollAreaPrimitive.Viewport
		tabindex={0}
		class={cn(
			'focus-visible:ring-ring h-full w-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset',
			viewportClass
		)}
	>
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
