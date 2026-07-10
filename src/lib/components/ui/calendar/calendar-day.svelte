<script lang="ts">
	import { Calendar as CalendarPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<CalendarPrimitive.DayProps> & { class?: string } = $props();
</script>

<CalendarPrimitive.Day
	bind:ref
	class={cn(
		'relative inline-flex size-9 select-none items-center justify-center overflow-hidden rounded-lg text-sm font-medium text-foreground outline-none transition-[background-color,box-shadow,scale] duration-150 ease-out',
		// hover (non-selected days)
		'hover:bg-accent',
		// today: aqua ring
		'data-[today]:ring-1 data-[today]:ring-[color:var(--primary)]',
		// selected: aqua gel (the sheen sits in ::before, day number lifted above)
		'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-sm data-[selected]:hover:bg-transparent data-[selected]:ring-0',
		// outside month
		'data-[outside-month]:pointer-events-none data-[outside-month]:text-muted-foreground/45',
		// unavailable + disabled
		'data-[unavailable]:text-muted-foreground/50 data-[unavailable]:line-through',
		'data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground/40',
		// focus + press
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
</CalendarPrimitive.Day>
