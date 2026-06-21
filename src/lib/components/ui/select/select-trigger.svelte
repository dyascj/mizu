<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { ChevronsUpDown } from '@lucide/svelte';
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
		'flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card/70 px-3.5 py-2 text-sm shadow-pressed outline-none transition-[box-shadow,border-color] duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronsUpDown class="size-4 opacity-60" />
</SelectPrimitive.Trigger>
