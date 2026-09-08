<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import DatePickerDay from './date-picker-day.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
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
</script>

<DatePickerPrimitive.Portal {...portalProps}>
	<DatePickerPrimitive.Content
		bind:ref
		role="dialog"
		aria-label="Choose a date"
		{sideOffset}
		class={cn(
			' text-popover-foreground bg-popover z-50 max-h-[calc(100dvh-2rem)] w-fit max-w-[calc(100vw-2rem)] overflow-auto rounded-2xl p-3 shadow-xl transition-[opacity,transform] duration-200 outline-none data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		<DatePickerPrimitive.Calendar class="relative z-10">
			{#snippet children({ months, weekdays })}
				<div class="flex flex-col gap-3">
					<DatePickerPrimitive.Header class="flex items-center justify-between">
						<DatePickerPrimitive.PrevButton
							class={cn(
								buttonVariants({ variant: 'ghost', size: 'icon' }),
								'size-8 rounded-lg [&_svg]:size-4'
							)}
						>
							<ChevronLeftIcon />
							<span class="sr-only">Previous month</span>
						</DatePickerPrimitive.PrevButton>
						<DatePickerPrimitive.Heading
							class="font-display text-foreground text-sm font-semibold tabular-nums"
						/>
						<DatePickerPrimitive.NextButton
							class={cn(
								buttonVariants({ variant: 'ghost', size: 'icon' }),
								'size-8 rounded-lg [&_svg]:size-4'
							)}
						>
							<ChevronRightIcon />
							<span class="sr-only">Next month</span>
						</DatePickerPrimitive.NextButton>
					</DatePickerPrimitive.Header>

					<div class="flex flex-col gap-4 sm:flex-row">
						{#each months as month (month.value)}
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
						{/each}
					</div>
				</div>
			{/snippet}
		</DatePickerPrimitive.Calendar>
	</DatePickerPrimitive.Content>
</DatePickerPrimitive.Portal>
