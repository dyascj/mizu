<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { getComboboxContext } from './context.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<ComboboxPrimitive.InputProps> & {
		class?: string;
	} = $props();
	const context = getComboboxContext();
</script>

<ComboboxPrimitive.Input
	bind:ref
	aria-controls={context?.open ? context.contentId : undefined}
	class={cn(
		'bg-control placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full items-center rounded-full px-3.5 py-2 text-base transition-[box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
		className
	)}
	{...restProps}
/>
