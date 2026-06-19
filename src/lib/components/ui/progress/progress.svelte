<script lang="ts">
	import { Progress as ProgressPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(0),
		max = 100,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & { class?: string } = $props();

	const pct = $derived(max ? (100 * (value ?? 0)) / max : 0);
</script>

<ProgressPrimitive.Root
	bind:ref
	{value}
	{max}
	class={cn(
		'relative h-3 w-full overflow-hidden rounded-full bg-muted shadow-pressed',
		className
	)}
	{...restProps}
>
	<div
		class="gradient-primary gloss relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-out"
		style="width: {pct}%"
	></div>
</ProgressPrimitive.Root>
