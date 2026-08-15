<script lang="ts">
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import {
		createSortedRowModel,
		rowSortingFeature,
		sortFns,
		tableFeatures,
		type ColumnDef
	} from '@tanstack/svelte-table';

	type Run = { agent: string; task: string; status: string; tokens: number };

	const runs: Run[] = [
		{ agent: 'Era', task: 'Trip itinerary', status: 'Done', tokens: 4210 },
		{ agent: 'Fjord', task: 'Blog draft', status: 'Running', tokens: 12930 },
		{ agent: 'Super', task: 'Inbox digest', status: 'Done', tokens: 980 },
		{ agent: 'Era', task: 'Fare watch', status: 'Queued', tokens: 0 },
		{ agent: 'Fjord', task: 'Release notes', status: 'Done', tokens: 3105 }
	];

	// Sorting state lives in the table's own rune-aware atoms, so no external
	// $state or onSortingChange wiring is needed.
	const features = tableFeatures({
		rowSortingFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns
	});

	const columns: ColumnDef<typeof features, Run>[] = [
		{ accessorKey: 'agent', header: 'Agent' },
		{ accessorKey: 'task', header: 'Task' },
		{ accessorKey: 'status', header: 'Status' },
		{
			accessorKey: 'tokens',
			header: 'Tokens',
			cell: ({ getValue }) => (getValue<number>() ? getValue<number>().toLocaleString() : '·')
		}
	];

	const table = createSvelteTable({
		features,
		columns,
		get data() {
			return runs;
		}
	});
</script>

<div class="bg-card w-full max-w-lg overflow-hidden rounded-2xl shadow-md">
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head>
							{#if header.column.id === 'tokens'}
								<Button
									variant="ghost"
									size="sm"
									class="-ml-3 h-8"
									onclick={() => header.column.toggleSorting(header.column.getIsSorted() === 'asc')}
								>
									Tokens
									<ArrowUpDown class="size-3.5" />
								</Button>
							{:else if !header.isPlaceholder}
								<FlexRender {header} />
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getAllCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender {cell} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
