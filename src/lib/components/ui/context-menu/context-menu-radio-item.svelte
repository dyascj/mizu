<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { Circle } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChildrenOrChild<ContextMenuPrimitive.RadioItemProps> & {
		children?: Snippet;
	} = $props();
</script>

<ContextMenuPrimitive.RadioItem
	bind:ref
	class={cn(
		'relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pr-2 pl-8 text-sm outline-none transition-colors duration-100 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span class="absolute left-2 flex size-4 items-center justify-center">
			{#if checked}
				<Circle class="size-2 fill-primary text-primary" />
			{/if}
		</span>
		{@render childrenProp?.()}
	{/snippet}
</ContextMenuPrimitive.RadioItem>
