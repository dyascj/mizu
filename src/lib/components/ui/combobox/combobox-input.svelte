<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<ComboboxPrimitive.InputProps> & {
		class?: string;
	} = $props();
</script>

<ComboboxPrimitive.Input
	bind:ref
	class={cn(
		'flex h-10 w-full items-center rounded-full border border-input bg-card px-3.5 py-2 text-sm outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
/>
