<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.RootProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<TabsPrimitive.Root bind:ref bind:value class={cn('flex flex-col', className)} {...restProps}>
	{@render children?.()}
</TabsPrimitive.Root>
