<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import DatePickerDay from './date-picker-day.svelte';
	import { getPickerDirection } from './date-picker.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import CalendarSlide from '$lib/components/ui/calendar/calendar-slide.svelte';
	import { titleFade } from '$lib/components/ui/calendar/calendar-motion.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		portalProps,
		...restProps
	}: WithoutChildrenOrChild<DatePickerPrimitive.ContentProps> & {
		class?: string;
		portalProps?: DatePickerPrimitive.PortalProps;
	} = $props();

	const direction = getPickerDirection();

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

<DatePickerPrimitive.Portal {...portalProps}>
	<DatePickerPrimitive.Content
		bind:ref
		role="dialog"
		aria-label="Choose a date"
		dir={direction?.rtl ? 'rtl' : 'ltr'}
		{sideOffset}
		class={cn(
			' text-popover-foreground bg-popover z-50 max-h-[calc(100dvh-2rem)] w-fit max-w-[calc(100vw-2rem)] overflow-auto rounded-2xl p-3 shadow-xl transition-[opacity,transform] duration-(--duration-base) outline-none data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		<DatePickerPrimitive.Calendar class="relative z-10" onkeydowncapture={mirrorArrows}>
			{#snippet children({ months, weekdays })}
				<div class="flex flex-col gap-3">
					<DatePickerPrimitive.Header class="flex items-center justify-between">
						<DatePickerPrimitive.PrevButton
							class={cn(
								buttonVariants({ variant: 'ghost', size: 'icon' }),
								'size-8 rounded-lg [&_svg]:size-4'
							)}
						>
							<ChevronLeftIcon class="rtl:rotate-180" />
							<span class="sr-only">Previous month</span>
						</DatePickerPrimitive.PrevButton>
						<DatePickerPrimitive.Heading
							class="font-display text-foreground grid justify-items-center text-sm font-semibold tabular-nums"
						>
							{#snippet children({ headingValue })}
								<!-- Old and new titles share one cell and crossfade. -->
								{#key headingValue}
									<span
										class="col-start-1 row-start-1 whitespace-nowrap"
										in:titleFade
										out:titleFade
									>
										{headingValue}
									</span>
								{/key}
							{/snippet}
						</DatePickerPrimitive.Heading>
						<DatePickerPrimitive.NextButton
							class={cn(
								buttonVariants({ variant: 'ghost', size: 'icon' }),
								'size-8 rounded-lg [&_svg]:size-4'
							)}
						>
							<ChevronRightIcon class="rtl:rotate-180" />
							<span class="sr-only">Next month</span>
						</DatePickerPrimitive.NextButton>
					</DatePickerPrimitive.Header>

					<div class="flex flex-col gap-4 sm:flex-row">
						{#each months as month, index (index)}
							<CalendarSlide month={month.value}>
								<DatePickerPrimitive.Grid class="w-full border-collapse space-y-1 select-none">
									<DatePickerPrimitive.GridHead>
										<DatePickerPrimitive.GridRow class="flex">
											{#each weekdays as weekday, i (i)}
												<DatePickerPrimitive.HeadCell
													class="text-muted-foreground w-9 text-xs font-medium"
												>
													{weekday.slice(0, 2)}
												</DatePickerPrimitive.HeadCell>
											{/each}
										</DatePickerPrimitive.GridRow>
									</DatePickerPrimitive.GridHead>
									<DatePickerPrimitive.GridBody>
										{#each month.weeks as weekDates, weekIndex (weekIndex)}
											<DatePickerPrimitive.GridRow class="mt-1 flex w-full">
												{#each weekDates as date (date)}
													<DatePickerPrimitive.Cell
														{date}
														month={month.value}
														class="p-0 text-center text-sm"
													>
														<DatePickerDay />
													</DatePickerPrimitive.Cell>
												{/each}
											</DatePickerPrimitive.GridRow>
										{/each}
									</DatePickerPrimitive.GridBody>
								</DatePickerPrimitive.Grid>
							</CalendarSlide>
						{/each}
					</div>
				</div>
			{/snippet}
		</DatePickerPrimitive.Calendar>
	</DatePickerPrimitive.Content>
</DatePickerPrimitive.Portal>
