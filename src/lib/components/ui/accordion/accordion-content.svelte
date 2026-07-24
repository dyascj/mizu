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
	class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
	{...restProps}
>
	<div class={cn('text-muted-foreground pb-4', className)}>
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
