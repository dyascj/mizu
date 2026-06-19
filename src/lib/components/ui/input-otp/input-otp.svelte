<script lang="ts">
	import { PinInput as PinInputPrimitive, type WithoutChildren } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		maxlength = 6,
		class: className,
		children,
		...restProps
	}: WithoutChildren<PinInputPrimitive.RootProps> & {
		class?: string;
		children: NonNullable<PinInputPrimitive.RootProps['children']>;
	} = $props();
</script>

<PinInputPrimitive.Root
	bind:ref
	bind:value
	{maxlength}
	class={cn('flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50', className)}
	{children}
	{...restProps}
/>
