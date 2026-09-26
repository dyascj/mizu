<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { glideSelection } from '$lib/components/ui/calendar/calendar-motion.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<DatePickerPrimitive.DayProps> & { class?: string } = $props();
</script>

<DatePickerPrimitive.Day
	bind:ref
	class={cn(
		'text-foreground relative inline-flex size-9 items-center justify-center rounded-full text-sm font-medium transition-[background-color,box-shadow,scale] duration-(--duration-base) ease-out outline-none select-none',
		'hover:bg-accent',
		'data-[today]:ring-1 data-[today]:ring-[color:var(--primary)]',
		'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary-hover data-[selected]:hover:text-primary-foreground data-[selected]:ring-0',
		// The fill behind a selected day is its own layer, so it can glide between
		// days. It inherits the day's background, so a class like
		// data-[selected]:bg-destructive still colors it, and the day clips its own
		// copy to the numeral, where the matching fill hides it, so the new day is
		// not painted before the fill arrives.
		'isolate data-[selected]:bg-clip-text',
		'data-[outside-month]:text-muted-foreground/45 data-[outside-month]:pointer-events-none',
		'data-[unavailable]:text-muted-foreground/50 data-[unavailable]:line-through',
		'data-[disabled]:text-muted-foreground/40 data-[disabled]:pointer-events-none',
		'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.96]',
		className
	)}
	{...restProps}
>
	{#snippet child({ props, day, selected })}
		<div {...props}>
			{#if selected}
				<span
					data-day-fill
					aria-hidden="true"
					class="absolute inset-0 -z-10 rounded-full bg-inherit shadow-sm [transition:translate_var(--duration-spring-snappy)_var(--ease-spring-snappy)] motion-reduce:transition-none"
					{@attach glideSelection}
				></span>
			{/if}
			<span class="relative z-10">{day}</span>
		</div>
	{/snippet}
</DatePickerPrimitive.Day>
