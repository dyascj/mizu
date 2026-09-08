<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: RangeCalendarPrimitive.CellProps = $props();
</script>

<RangeCalendarPrimitive.Cell
	bind:ref
	class={cn(
		'[&:has([data-selected])]:bg-primary-muted relative size-(--cell-size) p-0 text-center text-sm first:rounded-s-full last:rounded-e-full focus-within:z-20 [&:has([data-range-end])]:rounded-e-full [&:has([data-range-start])]:rounded-s-full',
		className
	)}
	{...restProps}
/>
