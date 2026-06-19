<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<TabsPrimitive.Content bind:ref class={cn('mt-3 outline-none', className)} {...restProps}>
	{@render children?.()}
</TabsPrimitive.Content>
