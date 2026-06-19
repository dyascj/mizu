<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<ComboboxPrimitive.ItemProps> & {
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<ComboboxPrimitive.Item
	bind:ref
	{value}
	{label}
	class={cn(
		'relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pr-2 pl-8 text-sm outline-none transition-colors duration-100 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected })}
		{#if selected}
			<span class="absolute left-2 flex size-4 items-center justify-center">
				<Check class="size-4 text-primary" />
			</span>
		{/if}
		{#if childrenProp}
			{@render childrenProp()}
		{:else}
			{label ?? value}
		{/if}
	{/snippet}
</ComboboxPrimitive.Item>
