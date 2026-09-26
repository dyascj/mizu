<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import Viewport from './navigation-menu-viewport.svelte';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		delayDuration = 80,
		class: className,
		viewport = true,
		children,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.RootProps> & {
		/**
		 * Milliseconds the pointer rests on a trigger before its panel opens:
		 * long enough that sweeping across the bar on the way elsewhere never
		 * flashes a panel, short enough to feel immediate.
		 */
		delayDuration?: number;
		/** Classes for the root. */
		class?: string;
		/** Render the shared panel that reshapes and slides between items. */
		viewport?: boolean;
		/** The list, and anything else in the bar. */
		children: Snippet;
	} = $props();
</script>

<NavigationMenuPrimitive.Root
	bind:ref
	bind:value
	{delayDuration}
	class={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
	{...restProps}
>
	{@render children?.()}
	{#if viewport}
		<Viewport />
	{/if}
</NavigationMenuPrimitive.Root>
