<script lang="ts">
	import { Calendar as CalendarPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CalendarDay from './calendar-day.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = 'short',
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & { class?: string } = $props();
</script>

<CalendarPrimitive.Root
	bind:ref
	bind:value={value as never}
	bind:placeholder
	{weekdayFormat}
	class={cn(
		'gloss relative w-fit rounded-2xl border border-[color:var(--glass-border)] p-3 shadow-glass glass-strong',
		className
	)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<div class="relative z-10 flex flex-col gap-3">
			<!-- Header: prev / month-year / next -->
			<CalendarPrimitive.Header class="flex items-center justify-between">
				<CalendarPrimitive.PrevButton
					class={cn(
						buttonVariants({ variant: 'ghost', size: 'icon' }),
						'size-8 rounded-lg [&_svg]:size-4'
					)}
				>
					<ChevronLeftIcon />
					<span class="sr-only">Previous month</span>
				</CalendarPrimitive.PrevButton>
				<CalendarPrimitive.Heading
					class="font-display text-sm font-semibold tabular-nums text-foreground"
				/>
				<CalendarPrimitive.NextButton
					class={cn(
						buttonVariants({ variant: 'ghost', size: 'icon' }),
						'size-8 rounded-lg [&_svg]:size-4'
					)}
				>
					<ChevronRightIcon />
					<span class="sr-only">Next month</span>
				</CalendarPrimitive.NextButton>
			</CalendarPrimitive.Header>

			<!-- Month grids -->
			<div class="flex flex-col gap-4 sm:flex-row">
				{#each months as month (month.value)}
					<CalendarPrimitive.Grid class="w-full border-collapse select-none space-y-1">
						<CalendarPrimitive.GridHead>
							<CalendarPrimitive.GridRow class="flex">
								{#each weekdays as weekday, i (i)}
									<CalendarPrimitive.HeadCell
										class="w-9 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground"
									>
										{weekday.slice(0, 2)}
									</CalendarPrimitive.HeadCell>
								{/each}
							</CalendarPrimitive.GridRow>
						</CalendarPrimitive.GridHead>
						<CalendarPrimitive.GridBody>
							{#each month.weeks as weekDates, weekIndex (weekIndex)}
								<CalendarPrimitive.GridRow class="mt-1 flex w-full">
									{#each weekDates as date (date)}
										<CalendarPrimitive.Cell
											{date}
											month={month.value}
											class="p-0 text-center text-sm"
										>
											<CalendarDay />
										</CalendarPrimitive.Cell>
									{/each}
								</CalendarPrimitive.GridRow>
							{/each}
						</CalendarPrimitive.GridBody>
					</CalendarPrimitive.Grid>
				{/each}
			</div>
		</div>
	{/snippet}
</CalendarPrimitive.Root>
