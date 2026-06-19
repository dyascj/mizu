<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.TriggerProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	class={cn(
		'relative overflow-hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground outline-none transition-[background-image,color,box-shadow] duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=active]:gradient-surface data-[state=active]:gloss data-[state=active]:text-foreground data-[state=active]:shadow-bevel',
		className
	)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</TabsPrimitive.Trigger>
