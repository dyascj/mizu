<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import { getSelectContext } from './context.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> & {
		class?: string;
		children?: Snippet;
	} = $props();
	const context = getSelectContext();

	// The release that ends the opening click lands on the current choice when
	// the list is item-aligned. Swallow it unless the pointer travelled first.
	function guardRelease(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		restProps.onpointerup?.(event);
		const press = context?.press;
		if (press && !press.moved) event.preventDefault();
	}
</script>

<!-- No transition on the highlight: it follows every pointer move, so easing
     would read as lag. -->
<SelectPrimitive.Item
	bind:ref
	{value}
	{label}
	{...restProps}
	onpointerup={guardRelease}
	class={cn(
		'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-pointer items-center rounded-lg py-1.5 ps-8 pe-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
>
	{#snippet children({ selected })}
		<span aria-hidden="true" class="absolute start-2 flex size-4 items-center justify-center">
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
</SelectPrimitive.Item>
