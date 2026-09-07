<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import DatePickerTrigger from './date-picker-trigger.svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<DatePickerPrimitive.InputProps> & { class?: string } = $props();
</script>

<DatePickerPrimitive.Input
	bind:ref
	class={cn(
		'bg-control text-foreground focus-within:ring-ring data-[invalid]:border-destructive data-[invalid]:ring-destructive flex h-10 w-full items-center rounded-full pr-1.5 pl-3.5 text-sm transition-[box-shadow,border-color] duration-200 outline-none select-none focus-within:ring-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ segments })}
		<div class="flex flex-1 items-center tabular-nums">
			{#each segments as { part, value }, i (i)}
				{#if part === 'literal'}
					<DatePickerPrimitive.Segment {part} class="text-muted-foreground px-px">
						{value}
					</DatePickerPrimitive.Segment>
				{:else}
					<DatePickerPrimitive.Segment
						{part}
						class="hover:bg-accent focus:bg-accent focus:text-accent-foreground aria-[valuetext=Empty]:text-muted-foreground rounded-md px-1 py-0.5 transition-colors duration-200 outline-none"
					>
						{value}
					</DatePickerPrimitive.Segment>
				{/if}
			{/each}
		</div>
		<DatePickerTrigger />
	{/snippet}
</DatePickerPrimitive.Input>
