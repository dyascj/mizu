<script lang="ts">
	import { DonutChart, type DonutSlice } from '$lib/components/ui/donut-chart';

	const workloads: DonutSlice[] = [
		{ label: 'Chat', value: 48_210 },
		{ label: 'Agents', value: 31_420 },
		{ label: 'Batch jobs', value: 17_640 },
		{ label: 'Evals', value: 11_930 },
		{ label: 'Other', value: 6_380 }
	];
</script>

<div class="flex w-full max-w-[480px] flex-col gap-6">
	<div>
		<p class="font-medium">Requests by workload</p>
		<p class="text-muted-foreground text-sm">Last 30 days</p>
	</div>
	<DonutChart
		data={workloads}
		locale="en-US"
		label="Requests by workload, last 30 days"
		totalLabel="Requests"
	/>
</div>
