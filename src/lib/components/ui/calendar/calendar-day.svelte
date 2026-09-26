<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { glideSelection } from './calendar-motion.js';

	let {
		ref = $bindable(null),
		class: className,
		children: content,
		...restProps
	}: CalendarPrimitive.DayProps = $props();
</script>

<CalendarPrimitive.Day
	bind:ref
	class={cn(
		buttonVariants({ variant: 'ghost', size: 'icon' }),
		'relative isolate flex size-(--cell-size) flex-col items-center justify-center gap-1 p-0 leading-none font-normal whitespace-nowrap select-none',
		'[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground [&[data-today][data-disabled]]:text-muted-foreground',
		'data-[selected]:bg-primary data-[selected]:hover:bg-primary-hover data-[selected]:hover:text-primary-foreground data-[selected]:text-primary-foreground',
		// The fill behind a selected day is its own layer, so it can glide between
		// days. It inherits the day's background, so a class like
		// data-[selected]:bg-destructive still colors it, and the day clips its own
		// copy to the numerals, where the matching fill hides it, so the new day is
		// not painted before the fill arrives.
		'data-[selected]:bg-clip-text',
		// Outside months
		'[&[data-outside-month]:not([data-selected])]:text-muted-foreground [&[data-outside-month]:not([data-selected])]:hover:text-accent-foreground',
		// Disabled
		'data-[disabled]:text-muted-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		// Unavailable
		'data-[unavailable]:text-muted-foreground data-[unavailable]:line-through',
		// focus
		'focus:border-ring focus:ring-ring/50',
		// inner spans
		'[&>span:not([data-day-fill])]:text-xs [&>span:not([data-day-fill])]:opacity-70',
		className
	)}
	{...restProps}
>
	{#snippet children(state)}
		{#if state.selected}
			<span
				data-day-fill
				aria-hidden="true"
				class="absolute inset-0 -z-10 rounded-full bg-inherit [transition:translate_var(--duration-spring-snappy)_var(--ease-spring-snappy)] motion-reduce:transition-none"
				{@attach glideSelection}
			></span>
		{/if}
		{#if content}
			{@render content(state)}
		{:else}
			{state.day}
		{/if}
	{/snippet}
</CalendarPrimitive.Day>
