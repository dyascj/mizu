<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { getSelectContext } from './context.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.TriggerProps> & {
		class?: string;
		children: Snippet;
	} = $props();
	const context = getSelectContext();
</script>

<SelectPrimitive.Trigger
	bind:ref
	role="combobox"
	aria-controls={context?.open ? context.contentId : undefined}
	class={cn(
		'bg-control focus-visible:ring-ring data-[placeholder]:text-muted-foreground flex h-10 w-full items-center justify-between rounded-full px-3.5 py-2 text-base transition-[box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronsUpDown class="size-4 opacity-60" />
</SelectPrimitive.Trigger>
