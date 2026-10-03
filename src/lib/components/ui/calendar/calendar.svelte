<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import * as Calendar from './index.js';
	import { cn } from '$lib/utils.js';
	import type { ButtonVariant } from '../button/button.svelte';
	import { isEqualMonth, type DateValue } from '@internationalized/date';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = 'short',
		buttonVariant = 'ghost',
		captionLayout = 'label',
		locale = 'en-US',
		months: monthsProp,
		years,
		monthFormat: monthFormatProp,
		yearFormat = 'numeric',
		day,
		disableDaysOutsideMonth = false,
		type = 'single',
		...restProps
	}: {
		/* bits-ui's Calendar root props form a discriminated union that TS cannot
		   flatten through $props(); we type the surface we use and pass the rest. */
		type?: 'single' | 'multiple';
		value?: DateValue | DateValue[];
		placeholder?: DateValue;
		ref?: HTMLElement | null;
		class?: string;
		weekdayFormat?: 'narrow' | 'short' | 'long';
		disableDaysOutsideMonth?: boolean;
		locale?: string;
		buttonVariant?: ButtonVariant;
		captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
		months?: CalendarPrimitive.MonthSelectProps['months'];
		years?: CalendarPrimitive.YearSelectProps['years'];
		monthFormat?: CalendarPrimitive.MonthSelectProps['monthFormat'];
		yearFormat?: CalendarPrimitive.YearSelectProps['yearFormat'];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} & Record<string, unknown> = $props();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith('dropdown')) return 'short';
		return 'long';
	});

	/**
	 * Right to left, the week runs from the right, but bits-ui always reads
	 * ArrowLeft as the previous day. A mirrored key is swapped for its twin
	 * before the grid sees it, so a day arrow moves the way it points.
	 */
	const swapped = new WeakSet<Event>();
	function mirrorArrows(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		const day = event.target as HTMLElement;
		if (swapped.has(event) || !day.hasAttribute?.('data-bits-day')) return;
		if (getComputedStyle(day).direction !== 'rtl') return;
		event.preventDefault();
		event.stopPropagation();
		const twin = new KeyboardEvent('keydown', {
			key: event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft',
			bubbles: true,
			cancelable: true
		});
		swapped.add(twin);
		day.dispatchEvent(twin);
	}
</script>

<!--
Bits UI couples the selection type with its value type. Both are forwarded together.
-->
<CalendarPrimitive.Root
	type={type as never}
	bind:value={value as never}
	bind:ref
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
	onkeydowncapture={mirrorArrows}
	{...restProps as Record<string, unknown>}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Months>
			<Calendar.Nav>
				<Calendar.PrevButton variant={buttonVariant} />
				<Calendar.NextButton variant={buttonVariant} />
			</Calendar.Nav>
			{#each months as month, monthIndex (monthIndex)}
				<Calendar.Month>
					<Calendar.Header>
						<Calendar.Caption
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
					</Calendar.Header>
					<Calendar.Slide month={month.value}>
						<Calendar.Grid>
							<Calendar.GridHead>
								<Calendar.GridRow class="select-none">
									{#each weekdays as weekday (weekday)}
										<Calendar.HeadCell>
											{weekday.slice(0, 2)}
										</Calendar.HeadCell>
									{/each}
								</Calendar.GridRow>
							</Calendar.GridHead>
							<Calendar.GridBody>
								{#each month.weeks as weekDates (weekDates)}
									<Calendar.GridRow class="mt-2 w-full">
										{#each weekDates as date (date)}
											<Calendar.Cell {date} month={month.value}>
												{#if day}
													{@render day({
														day: date,
														outsideMonth: !isEqualMonth(date, month.value)
													})}
												{:else}
													<Calendar.Day />
												{/if}
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							</Calendar.GridBody>
						</Calendar.Grid>
					</Calendar.Slide>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
	{/snippet}
</CalendarPrimitive.Root>
