<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.ListProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<CommandPrimitive.List
	bind:ref
	class={cn('max-h-80 overflow-y-auto p-1', className)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.List>
