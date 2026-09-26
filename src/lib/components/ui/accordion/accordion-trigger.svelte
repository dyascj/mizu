<script lang="ts">
	import { Accordion as AccordionPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<AccordionPrimitive.TriggerProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<AccordionPrimitive.Header class="flex">
	<AccordionPrimitive.Trigger
		bind:ref
		class={cn(
			'group/accordion-trigger hover:text-primary focus-visible:text-primary focus-visible:ring-ring focus-visible:ring-offset-background flex w-full items-center justify-between gap-5 rounded-lg py-4 text-left font-semibold transition-colors duration-(--duration-fast) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<ChevronDown
			class="text-muted-foreground group-hover/accordion-trigger:text-foreground group-data-[state=open]/accordion-trigger:text-foreground size-4 shrink-0 transition-[rotate,color] duration-(--duration-base) ease-out motion-reduce:transition-[color]"
			aria-hidden="true"
		/>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
