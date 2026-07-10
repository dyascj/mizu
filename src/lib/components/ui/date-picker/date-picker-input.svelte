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
		'flex h-10 w-full select-none items-center rounded-xl border border-input bg-card/70 pl-3.5 pr-1.5 text-sm text-foreground outline-none transition-[box-shadow,border-color] duration-150 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-destructive/35',
		className
	)}
	{...restProps}
>
	{#snippet children({ segments })}
		<div class="flex flex-1 items-center tabular-nums">
			{#each segments as { part, value }, i (i)}
				{#if part === 'literal'}
					<DatePickerPrimitive.Segment {part} class="px-px text-muted-foreground">
						{value}
					</DatePickerPrimitive.Segment>
				{:else}
					<DatePickerPrimitive.Segment
						{part}
						class="rounded-md px-1 py-0.5 outline-none transition-colors duration-150 hover:bg-accent focus:bg-accent focus:text-accent-foreground aria-[valuetext=Empty]:text-muted-foreground"
					>
						{value}
					</DatePickerPrimitive.Segment>
				{/if}
			{/each}
		</div>
		<DatePickerTrigger />
	{/snippet}
</DatePickerPrimitive.Input>
