<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { toCalendarDate } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { getRangePaint } from './context.js';

	let {
		ref = $bindable(null),
		class: className,
		date,
		children: content,
		...restProps
	}: RangeCalendarPrimitive.CellProps = $props();

	const paint = getRangePaint();
	const iso = $derived(toCalendarDate(date).toString());
	const lo = $derived(paint?.lo ?? null);
	const hi = $derived(paint?.hi ?? null);
	const isLo = $derived(iso === lo);
	const isHi = $derived(iso === hi);
	const inRange = $derived(lo !== null && hi !== null && lo !== hi && iso >= lo && iso <= hi);
</script>

<RangeCalendarPrimitive.Cell
	bind:ref
	{date}
	data-prospective={paint?.prospective === iso ? '' : undefined}
	class={cn(
		'group/cell relative size-(--cell-size) p-0 text-center text-sm focus-within:z-20',
		// Composed without the root, there is no painted span; tint selected cells instead.
		!paint &&
			'[&:has([data-selected])]:bg-primary-muted first:rounded-s-full last:rounded-e-full [&:has([data-range-end])]:rounded-e-full [&:has([data-range-start])]:rounded-s-full',
		className
	)}
	{...restProps}
>
	{#snippet children(state)}
		{#if inRange}
			<!-- The band. Each week's row reads as one pill: it rounds off where a
			     week breaks it, and an edge only fills toward the rest of the span,
			     since its own circle is the rounded end. -->
			<span
				aria-hidden="true"
				data-range-band
				class={cn(
					'bg-primary-muted pointer-events-none absolute inset-y-0',
					isLo ? 'start-1/2 group-last/cell:hidden' : 'start-0 group-first/cell:rounded-s-full',
					isHi ? 'end-1/2 group-first/cell:hidden' : 'end-0 group-last/cell:rounded-e-full'
				)}
			></span>
		{/if}
		{@render content?.(state)}
	{/snippet}
</RangeCalendarPrimitive.Cell>
