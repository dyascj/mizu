<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import Viewport from './navigation-menu-viewport.svelte';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		viewport = true,
		children,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.RootProps> & {
		class?: string;
		viewport?: boolean;
		children: Snippet;
	} = $props();
</script>

<NavigationMenuPrimitive.Root
	bind:ref
	bind:value
	class={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
	{...restProps}
>
	{@render children?.()}
	{#if viewport}
		<Viewport />
	{/if}
</NavigationMenuPrimitive.Root>
