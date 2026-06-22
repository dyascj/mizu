<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<CommandPrimitive.Root
	bind:ref
	bind:value
	class={cn(
		'flex h-full w-full flex-col overflow-hidden rounded-xl bg-transparent text-popover-foreground',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Root>
