<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<ComboboxPrimitive.TriggerProps> & {
		class?: string;
	} = $props();
</script>

<ComboboxPrimitive.Trigger
	bind:ref
	class={cn(
		'text-muted-foreground absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md transition-[scale] duration-150 outline-none active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	<ChevronsUpDown class="size-4 opacity-60" />
</ComboboxPrimitive.Trigger>
