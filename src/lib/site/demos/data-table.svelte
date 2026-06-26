<script lang="ts">
	import { DataTable, type DataTableColumn } from '$lib/components/ui/data-table';
	import { Badge } from '$lib/components/ui/badge';

	type Source = {
		id: number;
		name: string;
		volume: number;
		status: 'Clear' | 'Filtering' | 'Standby';
		updated: string;
	};

	const sources: Source[] = [
		{ id: 1, name: 'Rainfall Basin', volume: 1240, status: 'Clear', updated: '2m ago' },
		{ id: 2, name: 'Highland Spring', volume: 860, status: 'Clear', updated: '8m ago' },
		{ id: 3, name: 'North Reservoir', volume: 3500, status: 'Filtering', updated: '14m ago' },
		{ id: 4, name: 'Coastal Intake', volume: 2110, status: 'Standby', updated: '31m ago' },
		{ id: 5, name: 'Glacier Melt', volume: 540, status: 'Clear', updated: '1h ago' },
		{ id: 6, name: 'Aquifer Well', volume: 1780, status: 'Filtering', updated: '2h ago' },
		{ id: 7, name: 'Mist Collector', volume: 320, status: 'Standby', updated: '3h ago' }
	];

	const statusVariant = {
		Clear: 'success',
		Filtering: 'info',
		Standby: 'warning'
	} as const;

	let selected = $state<(string | number)[]>([1, 3]);

	const columns: DataTableColumn<Source>[] = [
		{ key: 'name', header: 'Source', sortable: true },
		{ key: 'volume', header: 'Volume', sortable: true, align: 'right', cell: volumeCell },
		{ key: 'status', header: 'Status', cell: statusCell },
		{ key: 'updated', header: 'Updated', align: 'right', class: 'text-muted-foreground' }
	];
</script>

{#snippet volumeCell(row: Source)}
	<span class="font-medium tabular-nums">{row.volume.toLocaleString()} L</span>
{/snippet}

{#snippet statusCell(row: Source)}
	<Badge variant={statusVariant[row.status]}>{row.status}</Badge>
{/snippet}

<div class="w-full max-w-2xl">
	<DataTable
		data={sources}
		{columns}
		pageSize={5}
		selectable
		bind:selected
		caption="Water sources monitored across the network."
	/>
</div>
