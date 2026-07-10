<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	// Styled single-select segmented group (the common case). For multi-select,
	// use bits-ui's ToggleGroup directly.
	let {
		ref = $bindable(null),
		value = $bindable(''),
		type = 'single',
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLElement | null;
		value?: string;
		type?: 'single';
		disabled?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<ToggleGroupPrimitive.Root
	bind:ref
	{type}
	bind:value
	class={cn('flex items-center gap-1 rounded-full bg-secondary p-1', className)}
	{...restProps}
>
	{@render children?.()}
</ToggleGroupPrimitive.Root>
