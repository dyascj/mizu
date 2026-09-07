<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<DatePickerPrimitive.DayProps> & { class?: string } = $props();
</script>

<DatePickerPrimitive.Day
	bind:ref
	class={cn(
		'text-foreground relative inline-flex size-9 items-center justify-center overflow-hidden rounded-lg text-sm font-medium transition-[background-color,box-shadow,scale] duration-200 ease-out outline-none select-none',
		'hover:bg-accent',
		'data-[today]:ring-1 data-[today]:ring-[color:var(--primary)]',
		'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-sm data-[selected]:ring-0 data-[selected]:hover:bg-transparent',
		'data-[outside-month]:text-muted-foreground/45 data-[outside-month]:pointer-events-none',
		'data-[unavailable]:text-muted-foreground/50 data-[unavailable]:line-through',
		'data-[disabled]:text-muted-foreground/40 data-[disabled]:pointer-events-none',
		'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.96]',
		className
	)}
	{...restProps}
>
	{#snippet child({ props, day })}
		<div {...props}>
			<span class="relative z-10">{day}</span>
		</div>
	{/snippet}
</DatePickerPrimitive.Day>
