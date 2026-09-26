<script lang="ts">
	import {
		createSvelteTable,
		DataTableBody,
		DataTableBulkAction,
		DataTableBulkBar,
		DataTableRow,
		DataTableSortButton
	} from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Download from '@lucide/svelte/icons/download';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import {
		createSortedRowModel,
		rowSelectionFeature,
		rowSortingFeature,
		sortFns,
		tableFeatures,
		type ColumnDef
	} from '@tanstack/svelte-table';
	import { cn } from '$lib/utils.js';

	type Status = 'failed' | 'running' | 'queued' | 'done';
	type Run = { id: string; task: string; agent: string; status: Status; tokens: number };

	const all: Run[] = [
		{ id: 'r1', task: 'Trip itinerary', agent: 'Travel', status: 'done', tokens: 4210 },
		{ id: 'r2', task: 'Blog draft', agent: 'Writer', status: 'running', tokens: 12930 },
		{ id: 'r3', task: 'Inbox digest', agent: 'Inbox', status: 'done', tokens: 980 },
		{ id: 'r4', task: 'Fare watch', agent: 'Travel', status: 'queued', tokens: 0 },
		{ id: 'r5', task: 'Churn analysis', agent: 'Research', status: 'failed', tokens: 7620 },
		{ id: 'r6', task: 'Release notes', agent: 'Writer', status: 'done', tokens: 3105 }
	];
	/** Orders by how much attention a run needs, not alphabetically. */
	const rank: Record<Status, number> = { failed: 0, running: 1, queued: 2, done: 3 };
	const statusLabel: Record<Status, string> = {
		failed: 'Failed',
		running: 'Running',
		queued: 'Queued',
		done: 'Done'
	};

	let runs = $state(all);

	// Sorting and selection live in the table's own rune-aware state.
	const features = tableFeatures({
		rowSortingFeature,
		rowSelectionFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns
	});

	const columns: ColumnDef<typeof features, Run>[] = [
		{ id: 'select', enableSorting: false },
		{ accessorKey: 'task', header: 'Task' },
		{ accessorKey: 'agent', header: 'Agent' },
		{
			accessorKey: 'status',
			header: 'Status',
			sortFn: (a, b) => rank[a.original.status] - rank[b.original.status]
		},
		{ accessorKey: 'tokens', header: 'Tokens' }
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
	const selected = $derived(table.getSelectedRowModel().rows.map((row) => row.original.id));
	const total = $derived(runs.reduce((sum, run) => sum + run.tokens, 0));

	function remove() {
		runs = runs.filter((run) => !selected.includes(run.id));
		table.resetRowSelection();
	}
</script>

<div class="flex w-full max-w-xl flex-col items-end gap-2">
	<div class="bg-card relative w-full overflow-hidden rounded-2xl shadow-md">
		<Table.Root class="min-w-[30rem]" aria-label="Agent runs">
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							{@const numeric = header.column.id === 'tokens'}
							<Table.Head
								class={cn(
									header.column.id === 'select' && 'w-12 pl-4',
									numeric && 'pr-5 text-right'
								)}
							>
								{#if header.column.id === 'select'}
									<Checkbox
										aria-label="Select all runs"
										disabled={rows.length === 0}
										checked={table.getIsAllRowsSelected()}
										indeterminate={table.getIsSomeRowsSelected()}
										onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
									/>
								{:else}
									<DataTableSortButton column={header.column} align={numeric ? 'end' : 'start'}>
										{header.column.columnDef.header}
									</DataTableSortButton>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<DataTableBody>
				{#each rows as row (row.id)}
					{@const run = row.original}
					<DataTableRow selected={row.getIsSelected()} onSelect={() => row.toggleSelected()}>
						<Table.Cell class="w-12 pl-4">
							<Checkbox
								aria-label="Select {run.task}"
								checked={row.getIsSelected()}
								onCheckedChange={(value) => row.toggleSelected(!!value)}
							/>
						</Table.Cell>
						<Table.Cell class="font-medium whitespace-nowrap">{run.task}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{run.agent}</Table.Cell>
						<Table.Cell>
							<span class="inline-flex items-center gap-2 whitespace-nowrap">
								<span
									aria-hidden="true"
									class={cn(
										'size-2 rounded-full',
										run.status === 'done' && 'bg-primary',
										run.status === 'failed' && 'bg-destructive',
										run.status === 'queued' && 'ring-border-strong ring-[1.5px] ring-inset',
										// The only row still changing breathes while it works.
										run.status === 'running' &&
											'bg-muted-foreground animate-pulse motion-reduce:animate-none'
									)}
								></span>
								{statusLabel[run.status]}
							</span>
						</Table.Cell>
						<Table.Cell class="text-muted-foreground pr-5 text-right tabular-nums">
							{run.tokens ? run.tokens.toLocaleString('en-US') : '·'}
						</Table.Cell>
					</DataTableRow>
				{/each}
			</DataTableBody>
		</Table.Root>
		{#if rows.length === 0}
			<p class="text-muted-foreground py-10 text-center text-sm">No runs</p>
		{/if}
		<!-- Always there, so the bar rises over it rather than into the rows. -->
		<p class="text-muted-foreground flex h-16 items-center px-4 text-sm tabular-nums">
			{runs.length} runs · {total.toLocaleString('en-US')} tokens
		</p>
		<DataTableBulkBar count={selected.length} onClear={() => table.resetRowSelection()}>
			<DataTableBulkAction icon={Trash2} onclick={remove}>Delete</DataTableBulkAction>
			<DataTableBulkAction icon={Download} doneLabel="Exported">Export</DataTableBulkAction>
		</DataTableBulkBar>
	</div>
	<!-- Always takes its space, so the table never moves when it appears. -->
	<Button
		variant="ghost"
		size="sm"
		inert={runs.length === all.length}
		class={cn(runs.length === all.length && 'opacity-0')}
		onclick={() => (runs = all)}
	>
		Restore deleted runs
	</Button>
</div>
