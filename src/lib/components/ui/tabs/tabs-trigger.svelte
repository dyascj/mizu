<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { getTabsListState } from './context.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.TriggerProps> & {
		class?: string;
		children: Snippet;
	} = $props();

	const list = getTabsListState();
	const underline = $derived(list?.variant === 'underline');
</script>

<TabsPrimitive.Trigger
	bind:ref
	class={cn(
		'text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative shrink-0 rounded-full text-sm outline-none focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
		underline
			? [
					'hover:text-foreground data-[state=active]:text-foreground h-10 px-3 font-medium whitespace-nowrap transition-[color,scale] duration-(--duration-fast) ease-out focus-visible:ring-inset',
					// The active tab draws its own line until the stretching one measures.
					'data-[state=active]:after:bg-primary data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full [[data-indicator]_&]:after:hidden'
				]
			: 'data-[state=active]:bg-primary-muted data-[state=active]:text-primary overflow-hidden px-2 py-1.5 font-semibold transition-[background-color,color,box-shadow] duration-(--duration-base) focus-visible:ring-offset-2 data-[state=active]:shadow-xs sm:px-3 [[data-indicator]_&]:data-[state=active]:bg-transparent [[data-indicator]_&]:data-[state=active]:shadow-none',
		className
	)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</TabsPrimitive.Trigger>
