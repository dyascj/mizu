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
		'relative inline-flex size-9 select-none items-center justify-center overflow-hidden rounded-lg text-sm font-medium text-foreground outline-none transition-[background-color,box-shadow,scale] duration-150 ease-out',
		'hover:bg-accent',
		'data-[today]:ring-1 data-[today]:ring-[color:var(--primary)]',
		'data-[selected]:gradient-primary data-[selected]:gloss data-[selected]:text-primary-foreground data-[selected]:shadow-aqua data-[selected]:hover:bg-transparent data-[selected]:ring-0',
		'data-[outside-month]:pointer-events-none data-[outside-month]:text-muted-foreground/45',
		'data-[unavailable]:text-muted-foreground/50 data-[unavailable]:line-through',
		'data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground/40',
		'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.96]',
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
