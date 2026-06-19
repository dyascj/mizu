<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { toggleVariants, type ToggleVariant, type ToggleSize } from '../toggle/toggle.svelte';

	let {
		ref = $bindable(null),
		variant = 'default',
		size = 'md',
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<ToggleGroupPrimitive.ItemProps> & {
		variant?: ToggleVariant;
		size?: ToggleSize;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	class={cn(
		toggleVariants({ variant, size }),
		'hover:bg-secondary/70 data-[state=on]:gradient-surface data-[state=on]:gloss data-[state=on]:shadow-bevel',
		className
	)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</ToggleGroupPrimitive.Item>
