<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<NavigationMenuPrimitive.TriggerProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<NavigationMenuPrimitive.Trigger
	bind:ref
	class={cn(
		'group text-foreground hover:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background data-[state=open]:bg-accent inline-flex h-9 w-max items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium transition-[background-color,scale] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDown
		class="relative top-px size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
		aria-hidden="true"
	/>
</NavigationMenuPrimitive.Trigger>
