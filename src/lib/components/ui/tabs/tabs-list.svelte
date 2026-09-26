<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { slidingIndicator } from './sliding-indicator.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.ListProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	class={cn(
		'bg-secondary relative inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl p-1',
		className
	)}
	{...restProps}
>
	<span
		aria-hidden="true"
		hidden
		class="bg-primary-muted ease-spring-snappy pointer-events-none absolute top-0 left-0 rounded-full shadow-xs transition-[translate,width,height] duration-(--duration-spring-snappy) motion-reduce:transition-none"
		{@attach slidingIndicator('[data-tabs-trigger][data-state="active"]')}
	></span>
	{@render children?.()}
</TabsPrimitive.List>
