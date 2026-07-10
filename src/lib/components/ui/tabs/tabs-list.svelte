<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.ListProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	class={cn(
		'inline-flex items-center gap-1 rounded-full bg-secondary p-1',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.List>
