<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import * as RangeCalendar from './index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { ButtonVariant } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import { isEqualMonth, toCalendarDate, type DateValue } from '@internationalized/date';
	import CalendarSlide from '$lib/components/ui/calendar/calendar-slide.svelte';
	import { setRangePaint } from './context.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		weekdayFormat = 'short',
		class: className,
		buttonVariant = 'ghost',
		captionLayout = 'label',
		locale = 'en-US',
		months: monthsProp,
		years,
		monthFormat: monthFormatProp,
		yearFormat = 'numeric',
		day,
		disableDaysOutsideMonth = false,
		onpointerover,
		onpointerleave,
		onfocusin,
		onkeydown,
		onValueChange,
		...restProps
	}: WithoutChildrenOrChild<RangeCalendarPrimitive.RootProps> & {
		buttonVariant?: ButtonVariant;
		captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
		months?: RangeCalendarPrimitive.MonthSelectProps['months'];
		years?: RangeCalendarPrimitive.YearSelectProps['years'];
		monthFormat?: RangeCalendarPrimitive.MonthSelectProps['monthFormat'];
		yearFormat?: RangeCalendarPrimitive.YearSelectProps['yearFormat'];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} = $props();

	const iso = (date: DateValue) => toCalendarDate(date).toString();

	/** The day under the pointer or keyboard focus. */
	let hover = $state<string | null>(null);

	const start = $derived(value?.start ? iso(value.start) : null);
	const end = $derived(value?.end ? iso(value.end) : null);
	/** A start is chosen and the second click will commit the end. */
	const picking = $derived(start !== null && end === null);

	// While picking, the span follows the pointer from the start, in either
	// direction; once both ends are committed it rests on them.
	setRangePaint({
		get lo() {
			if (!picking || !hover) return start;
			return hover < start! ? hover : start;
		},
		get hi() {
			if (!picking) return end;
			if (!hover) return start;
			return hover < start! ? start : hover;
		},
		get prospective() {
			return picking && hover !== start ? hover : null;
		}
	});

	function dayUnder(target: EventTarget | null) {
		const day = (target as Element | null)?.closest?.('[data-bits-day]');
		const date = day?.getAttribute('data-value');
		return date && !day?.hasAttribute('data-disabled') ? date.slice(0, 10) : null;
	}

	/** Arrow presses re-sent with the key swapped, so they pass through untouched. */
	const mirrored = new WeakSet<Event>();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith('dropdown')) return 'short';
		return 'long';
	});
</script>

<RangeCalendarPrimitive.Root
	bind:ref
	bind:value
	bind:placeholder
	{weekdayFormat}
	{disableDaysOutsideMonth}
	class={cn(
		'bg-card group/calendar rounded-2xl p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
		className
	)}
	{locale}
	{monthFormat}
	{yearFormat}
	{...restProps}
	{onValueChange}
	onpointerover={(event) => {
		onpointerover?.(event);
		// Touch has no hover; the band waits for the second tap.
		if (event.pointerType !== 'touch') hover = dayUnder(event.target) ?? hover;
	}}
	onpointerleave={(event) => {
		onpointerleave?.(event);
		hover = null;
	}}
	onfocusin={(event) => {
		onfocusin?.(event);
		hover = dayUnder(event.target);
	}}
	onkeydown={(event) => {
		onkeydown?.(event);
		// The grid mirrors in right-to-left text, but bits-ui steps days by the
		// key's name, so the press is re-sent as the arrow that points that way.
		const target = event.target as HTMLElement;
		if (
			(event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
			!event.defaultPrevented &&
			!mirrored.has(event) &&
			target.hasAttribute?.('data-bits-day') &&
			getComputedStyle(event.currentTarget).direction === 'rtl'
		) {
			event.preventDefault();
			event.stopPropagation();
			const swapped = new KeyboardEvent('keydown', {
				key: event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft',
				bubbles: true,
				cancelable: true
			});
			mirrored.add(swapped);
			target.dispatchEvent(swapped);
			return;
		}
		// Escape backs out of a half-picked range, before anything around the
		// calendar, such as a popover, hears it.
		if (event.key === 'Escape' && picking && !event.defaultPrevented) {
			event.preventDefault();
			event.stopPropagation();
			value = { start: undefined, end: undefined };
			onValueChange?.(value);
			hover = null;
		}
	}}
>
	{#snippet children({ months, weekdays })}
		<RangeCalendar.Months>
			<RangeCalendar.Nav>
				<RangeCalendar.PrevButton variant={buttonVariant} />
				<RangeCalendar.NextButton variant={buttonVariant} />
			</RangeCalendar.Nav>
			{#each months as month, monthIndex (monthIndex)}
				<RangeCalendar.Month>
					<RangeCalendar.Header>
						<RangeCalendar.Caption
							{captionLayout}
							months={monthsProp}
							{monthFormat}
							{years}
							{yearFormat}
							month={month.value}
							bind:placeholder
							{locale}
							{monthIndex}
						/>
					</RangeCalendar.Header>

					<CalendarSlide month={month.value}>
						<RangeCalendar.Grid>
							<RangeCalendar.GridHead>
								<RangeCalendar.GridRow class="select-none">
									{#each weekdays as weekday (weekday)}
										<RangeCalendar.HeadCell>
											{weekday.slice(0, 2)}
										</RangeCalendar.HeadCell>
									{/each}
								</RangeCalendar.GridRow>
							</RangeCalendar.GridHead>
							<RangeCalendar.GridBody>
								{#each month.weeks as weekDates (weekDates)}
									<RangeCalendar.GridRow class="mt-2 w-full">
										{#each weekDates as date (date)}
											<RangeCalendar.Cell {date} month={month.value}>
												{#if day}
													{@render day({
														day: date,
														outsideMonth: !isEqualMonth(date, month.value)
													})}
												{:else}
													<RangeCalendar.Day />
												{/if}
											</RangeCalendar.Cell>
										{/each}
									</RangeCalendar.GridRow>
								{/each}
							</RangeCalendar.GridBody>
						</RangeCalendar.Grid>
					</CalendarSlide>
				</RangeCalendar.Month>
			{/each}
		</RangeCalendar.Months>
	{/snippet}
</RangeCalendarPrimitive.Root>
