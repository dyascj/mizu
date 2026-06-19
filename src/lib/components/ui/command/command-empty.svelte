<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.EmptyProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<CommandPrimitive.Empty
	bind:ref
	class={cn('py-6 text-center text-sm text-muted-foreground', className)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Empty>
