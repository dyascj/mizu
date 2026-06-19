<script lang="ts">
	import { Accordion as AccordionPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<AccordionPrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	class="overflow-hidden text-sm transition-[height] duration-200 ease-out data-[state=closed]:h-0 data-[state=open]:h-[var(--bits-accordion-content-height)]"
	{...restProps}
>
	<div class={cn('pb-4 text-muted-foreground', className)}>
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
