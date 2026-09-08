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
		'text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background data-[state=active]:bg-primary-muted data-[state=active]:text-primary relative overflow-hidden rounded-full px-2 py-1.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs sm:px-3',
		className
	)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</TabsPrimitive.Trigger>
