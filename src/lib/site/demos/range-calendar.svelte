<script lang="ts">
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import {
		type DateValue,
		endOfMonth,
		getLocalTimeZone,
		startOfMonth,
		today
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';

	type Range = { start: DateValue | undefined; end: DateValue | undefined };

	const now = today(getLocalTimeZone());
	const presets: { label: string; start: DateValue; end: DateValue }[] = [
		{ label: 'Last 7 days', start: now.subtract({ days: 6 }), end: now },
		{ label: 'Last 30 days', start: now.subtract({ days: 29 }), end: now },
		{ label: 'This month', start: startOfMonth(now), end: endOfMonth(now) }
	];

	let value = $state<Range>({ start: now.subtract({ days: 6 }), end: now });

	const format = (date: DateValue) =>
		date.toDate(getLocalTimeZone()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

	const summary = $derived.by(() => {
		const { start, end } = value;
		if (start && end) {
			const days = end.compare(start) + 1;
			return `${format(start)} to ${format(end)} · ${days} day${days === 1 ? '' : 's'}`;
		}
		return start ? `From ${format(start)}` : 'No dates selected';
	});
	const hint = $derived(
		value.start && value.end ? '' : value.start ? 'Pick an end date' : 'Pick a start date'
	);
</script>

<div class="bg-card flex w-full max-w-xs flex-col gap-3 rounded-2xl p-4 shadow-sm">
	<p class="font-semibold tracking-tight">Token usage</p>
	<div role="group" aria-label="Presets" class="flex flex-wrap gap-1.5">
		{#each presets as preset (preset.label)}
			{@const active =
				!!value.start &&
				!!value.end &&
				value.start.compare(preset.start) === 0 &&
				value.end.compare(preset.end) === 0}
			<button
				type="button"
				aria-pressed={active}
				onclick={() => (value = { start: preset.start, end: preset.end })}
				class={cn(
					'focus-visible:ring-ring focus-visible:ring-offset-background h-8 rounded-full px-3 text-sm whitespace-nowrap transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]',
					active
						? 'bg-primary-muted text-primary font-medium'
						: 'bg-secondary text-muted-foreground hover:text-foreground'
				)}
			>
				{preset.label}
			</button>
		{/each}
	</div>
	<RangeCalendar bind:value class="mx-auto bg-transparent p-0" />
	<div class="min-w-0">
		<p class={cn('truncate text-sm tabular-nums', !value.start && 'text-muted-foreground')}>
			{summary}
		</p>
		<p class="text-muted-foreground h-4 truncate text-xs">{hint}</p>
	</div>
</div>
