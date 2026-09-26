<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { slidingIndicator } from './sliding-indicator.js';

	type Props = Omit<RadioGroupPrimitive.RootProps, 'orientation' | 'child' | 'children'> & {
		/** The value of the selected item. */
		value?: string;
		/** Called with the new value whenever the selection changes. */
		onValueChange?: (value: string) => void;
		/** Track height and label size. */
		size?: 'sm' | 'md';
		/** Stretch across the container and share the width evenly between items. */
		fullWidth?: boolean;
		/** Disables every item. */
		disabled?: boolean;
		/** Names the control for assistive technology when there is no visible label. */
		'aria-label'?: string;
		/** The track element. */
		ref?: HTMLElement | null;
		/** Classes for the track. */
		class?: string;
		/** `SegmentedControl.Item` elements. */
		children: Snippet;
	};

	let {
		value = $bindable(''),
		onValueChange,
		size = 'md',
		fullWidth = false,
		disabled = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();
</script>

<RadioGroupPrimitive.Root
	bind:ref
	bind:value
	{onValueChange}
	{disabled}
	orientation="horizontal"
	data-size={size}
	data-full-width={fullWidth ? '' : undefined}
	class={cn(
		'group/segmented bg-secondary relative isolate max-w-full items-center rounded-full p-1',
		fullWidth ? 'flex w-full' : 'inline-flex',
		className
	)}
	{...restProps}
>
	<span
		aria-hidden="true"
		hidden
		class="bg-card dark:bg-control ease-spring pointer-events-none absolute top-0 left-0 rounded-full shadow-sm transition-[translate,width,height] duration-(--duration-spring) motion-reduce:transition-none"
		{@attach slidingIndicator('[data-radio-group-item][data-state="checked"]')}
	></span>
	{@render children()}
</RadioGroupPrimitive.Root>
