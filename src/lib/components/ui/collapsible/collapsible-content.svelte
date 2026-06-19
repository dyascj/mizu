<script lang="ts">
	import { Collapsible as CollapsiblePrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CollapsiblePrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<CollapsiblePrimitive.Content
	bind:ref
	class="overflow-hidden text-sm transition-[height] duration-200 ease-out data-[state=closed]:h-0 data-[state=open]:h-[var(--bits-collapsible-content-height)]"
	{...restProps}
>
	<div class={cn('pt-2', className)}>
		{@render children?.()}
	</div>
</CollapsiblePrimitive.Content>
