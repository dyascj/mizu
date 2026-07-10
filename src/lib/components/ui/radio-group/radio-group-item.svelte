<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> & { class?: string } = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	class={cn(
		'relative flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-card outline-none transition-[background-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:shadow-sm',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div
			class={cn(
				'size-2.5 rounded-full bg-primary transition-[scale] duration-150 ease-out',
				checked ? 'scale-100' : 'scale-0'
			)}
		></div>
	{/snippet}
</RadioGroupPrimitive.Item>
