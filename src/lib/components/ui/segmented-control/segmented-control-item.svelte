<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> & {
		/** The value this item selects. */
		value: string;
		/** Keeps this item from being selected or focused. */
		disabled?: boolean;
		/** The item element. */
		ref?: HTMLElement | null;
		/** Classes for the item. */
		class?: string;
		/** The label: text, an icon, or both. Give icon-only items an `aria-label`. */
		children: Snippet;
	};

	let {
		value,
		disabled = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	{value}
	{disabled}
	class={cn(
		'text-muted-foreground hover:text-foreground data-[state=checked]:text-foreground focus-visible:ring-ring relative inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-[color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
		'group-data-[size=sm]/segmented:h-6 group-data-[size=sm]/segmented:px-2.5 group-data-[size=sm]/segmented:text-xs group-data-[size=sm]/segmented:[&_svg]:size-3.5',
		'group-data-[full-width]/segmented:flex-1',
		// The checked item carries its own fill until the sliding thumb takes over.
		'data-[state=checked]:bg-card dark:data-[state=checked]:bg-control data-[state=checked]:shadow-sm [[data-indicator]_&]:data-[state=checked]:bg-transparent [[data-indicator]_&]:data-[state=checked]:shadow-none',
		className
	)}
	{...restProps}
>
	{@render children()}
</RadioGroupPrimitive.Item>
