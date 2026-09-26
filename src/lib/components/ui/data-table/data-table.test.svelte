<script lang="ts">
	import {
		createSvelteTable,
		DataTableBody,
		DataTableBulkAction,
		DataTableBulkBar,
		DataTableRow,
		DataTableSortButton
	} from './index.js';
	import {
		createSortedRowModel,
		rowSelectionFeature,
		rowSortingFeature,
		sortFns,
		tableFeatures,
		type ColumnDef
	} from '@tanstack/svelte-table';

	type Run = { id: string; task: string; tokens: number };

	let { onExport }: { onExport?: () => void } = $props();

	let runs = $state<Run[]>([
		{ id: 'a', task: 'Blog draft', tokens: 300 },
		{ id: 'b', task: 'Inbox digest', tokens: 100 },
		{ id: 'c', task: 'Trip itinerary', tokens: 200 }
	]);

	const features = tableFeatures({
		rowSortingFeature,
		rowSelectionFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns
	});
	const columns: ColumnDef<typeof features, Run>[] = [
		{ accessorKey: 'task', header: 'Task' },
		{ accessorKey: 'tokens', header: 'Tokens', sortDescFirst: false }
	];
	const table = createSvelteTable({
		features,
		columns,
		getRowId: (run) => run.id,
		get data() {
			return runs;
		}
	});
	const rows = $derived(table.getRowModel().rows);
	const selected = $derived(table.getSelectedRowModel().rows.map((row) => row.id));
</script>

<div class="relative overflow-hidden">
	<table>
		<thead>
			<tr>
				{#each table.getHeaderGroups()[0].headers as header (header.id)}
					<th>
						<DataTableSortButton column={header.column}>
							{header.column.columnDef.header}
						</DataTableSortButton>
					</th>
				{/each}
			</tr>
		</thead>
		<DataTableBody>
			{#each rows as row (row.id)}
				<DataTableRow selected={row.getIsSelected()} onSelect={() => row.toggleSelected()}>
					<td>{row.original.task}</td>
					<td><button type="button">Open {row.original.task}</button></td>
				</DataTableRow>
			{/each}
		</DataTableBody>
	</table>
	<DataTableBulkBar count={selected.length} onClear={() => table.resetRowSelection()}>
		<DataTableBulkAction
			onclick={() => {
				runs = runs.filter((run) => !selected.includes(run.id));
				table.resetRowSelection();
			}}>Delete</DataTableBulkAction
		>
		<DataTableBulkAction doneLabel="Exported" onclick={onExport}>Export</DataTableBulkAction>
	</DataTableBulkBar>
</div>
