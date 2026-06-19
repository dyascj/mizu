<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.ItemProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	class={cn(
		'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Item>
