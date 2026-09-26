<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: RangeCalendarPrimitive.DayProps = $props();
</script>

<RangeCalendarPrimitive.Day
	bind:ref
	class={cn(
		buttonVariants({ variant: 'ghost', size: 'icon' }),
		'relative flex size-(--cell-size) flex-col items-center justify-center gap-1 p-0 leading-none font-normal whitespace-nowrap select-none',
		'[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground [&[data-today][data-disabled]]:text-muted-foreground',
		// Days inside the span sit on the band, so today's tint and the hover
		// circle only show where there is no band.
		'data-[range-middle]:hover:bg-primary/10 data-[range-middle]:bg-transparent',
		// The day that would close the span while the end is picked: marked,
		// but not yet filled.
		'in-data-[prospective]:bg-[color-mix(in_srgb,var(--primary)_30%,var(--background))] in-data-[prospective]:hover:bg-[color-mix(in_srgb,var(--primary)_30%,var(--background))]',
		// range Start
		'data-[range-start]:bg-primary data-[range-start]:hover:bg-primary-hover data-[range-start]:hover:text-primary-foreground data-[range-start]:text-primary-foreground',
		// range End
		'data-[range-end]:bg-primary data-[range-end]:hover:bg-primary-hover data-[range-end]:hover:text-primary-foreground data-[range-end]:text-primary-foreground',
		// Outside months
		'[&[data-outside-month]:not([data-selected])]:text-muted-foreground [&[data-outside-month]:not([data-selected])]:hover:text-accent-foreground',
		// Disabled
		'data-[disabled]:text-muted-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		// Unavailable
		'data-[unavailable]:line-through',
		// focus
		'focus:border-ring focus:ring-ring/50',
		// inner spans
		'[&>span]:text-xs [&>span]:opacity-70',
		className
	)}
	{...restProps}
/>
