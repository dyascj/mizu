<script lang="ts">
	import { BarChart } from '$lib/components/ui/bar-chart';
	import * as SegmentedControl from '$lib/components/ui/segmented-control';

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	// Millions of tokens per day across every assistant in the workspace.
	const weeks: Record<string, number[]> = {
		'This week': [4.2, 5.1, 3.6, 6.4, 5.8, 1.9, 1.1],
		'Last week': [3.4, 4.0, 4.9, 3.8, 4.4, 2.6, 0.7]
	};

	let week = $state('This week');
	const values = $derived(weeks[week]);
	const total = $derived(values.reduce((sum, v) => sum + v, 0));
	const data = $derived(days.map((label, i) => ({ label, value: values[i] })));
</script>

<div class="flex w-full max-w-[520px] flex-col gap-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="text-muted-foreground text-sm">Tokens used</p>
			<p class="text-3xl font-semibold tracking-tight tabular-nums">{total.toFixed(1)}M</p>
		</div>
		<SegmentedControl.Root bind:value={week} size="sm" aria-label="Week">
			{#each Object.keys(weeks) as option (option)}
				<SegmentedControl.Item value={option}>{option}</SegmentedControl.Item>
			{/each}
		</SegmentedControl.Root>
	</div>
	<BarChart
		{data}
		max={8}
		ticks={[0, 4, 8]}
		format={(v) => (v ? `${v}M` : '0')}
		unit="million tokens"
		label="Tokens used per day, {week.toLowerCase()}"
	/>
</div>
