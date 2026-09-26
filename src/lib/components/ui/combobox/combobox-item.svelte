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

<!-- Inside Combobox.Content one gliding pill draws the highlight, so the item
     keeps its own fill only for use outside it. -->
<ComboboxPrimitive.Item
	bind:ref
	{value}
	{label}
	class={cn(
		'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-pointer items-center rounded-lg py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 in-data-[highlight-glide]:data-[highlighted]:bg-transparent',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected })}
		<span aria-hidden="true" class="absolute left-2 flex size-4 items-center justify-center">
			<Check
				class={cn(
					'text-primary size-4 transition-[scale,opacity,filter] motion-reduce:scale-100 motion-reduce:blur-none',
					selected
						? 'blur-none duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)'
						: 'scale-25 opacity-0 blur-[4px] duration-(--duration-fast) ease-in'
				)}
			/>
		</span>
		{#if childrenProp}
			{@render childrenProp()}
		{:else}
			{label ?? value}
		{/if}
	{/snippet}
</ComboboxPrimitive.Item>
