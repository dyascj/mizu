<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
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
</script>

<SelectPrimitive.Trigger
	bind:ref
	class={cn(
		'bg-secondary focus-visible:ring-ring/35 data-[placeholder]:text-muted-foreground flex h-10 w-full items-center justify-between rounded-full px-3.5 py-2 text-sm transition-[box-shadow,border-color] duration-150 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronsUpDown class="size-4 opacity-60" />
</SelectPrimitive.Trigger>
