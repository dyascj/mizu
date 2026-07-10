<script lang="ts" generics="Row extends Record<string, unknown>">
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import * as Table from '$lib/components/ui/table';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import type { DataTableColumn } from './types.js';

	type SortDir = 'asc' | 'desc' | null;
	type RowId = string | number;

	type Props = {
		data: Row[];
		columns: DataTableColumn<Row>[];
		pageSize?: number;
		selectable?: boolean;
		selected?: RowId[];
		getRowId?: (row: Row) => RowId;
		caption?: string;
		class?: string;
		onSortChange?: (detail: { key: string | null; dir: SortDir }) => void;
		onSelectionChange?: (selected: RowId[]) => void;
	};

	let {
		data,
		columns,
		pageSize = 0,
		selectable = false,
		selected = $bindable([]),
		getRowId = (row: Row) => row.id as RowId,
		caption,
		class: className,
		onSortChange,
		onSelectionChange
	}: Props = $props();

	let sortKey = $state<string | null>(null);
	let sortDir = $state<SortDir>(null);
	let page = $state(0);

	const sorted = $derived.by(() => {
		if (!sortKey || !sortDir) return data;
		const key = sortKey;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...data].sort((a, b) => {
			const av = a[key];
			const bv = b[key];
			if (av == null && bv == null) return 0;
			if (av == null) return -dir;
			if (bv == null) return dir;
			if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
			return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
		});
	});

	const paginated = $derived(pageSize > 0);
	const pageCount = $derived(paginated ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1);
	const currentPage = $derived(Math.min(page, pageCount - 1));
	const rows = $derived(
		paginated ? sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize) : sorted
	);

	const pageIds = $derived(rows.map((row) => getRowId(row)));
	const selectedOnPage = $derived(pageIds.filter((id) => selected.includes(id)).length);
	const allSelected = $derived(pageIds.length > 0 && selectedOnPage === pageIds.length);
	const someSelected = $derived(selectedOnPage > 0 && !allSelected);

	function toggleSort(column: DataTableColumn<Row>) {
		if (!column.sortable) return;
		if (sortKey !== column.key) {
			sortKey = column.key;
			sortDir = 'asc';
		} else if (sortDir === 'asc') {
			sortDir = 'desc';
		} else if (sortDir === 'desc') {
			sortKey = null;
			sortDir = null;
		} else {
			sortDir = 'asc';
		}
		page = 0;
		onSortChange?.({ key: sortKey, dir: sortDir });
	}

	function setSelected(next: RowId[]) {
		selected = next;
		onSelectionChange?.(next);
	}

	function toggleAll(value: boolean) {
		if (value) {
			const merged = new Set(selected);
			for (const id of pageIds) merged.add(id);
			setSelected([...merged]);
		} else {
			const remove = new Set(pageIds);
			setSelected(selected.filter((id) => !remove.has(id)));
		}
	}

	function toggleRow(id: RowId, value: boolean) {
		if (value) {
			if (!selected.includes(id)) setSelected([...selected, id]);
		} else {
			setSelected(selected.filter((existing) => existing !== id));
		}
	}

	function ariaSort(column: DataTableColumn<Row>): 'ascending' | 'descending' | 'none' | undefined {
		if (!column.sortable) return undefined;
		if (sortKey !== column.key || !sortDir) return 'none';
		return sortDir === 'asc' ? 'ascending' : 'descending';
	}

	const alignClass = {
		left: 'text-left',
		center: 'text-center',
		right: 'text-right'
	} as const;
</script>

<div
	class={cn(
		'bg-card overflow-hidden rounded-2xl',
		className
	)}
>
	<Table.Root>
		{#if caption}
			<Table.Caption class="mt-3 mb-2 px-4">{caption}</Table.Caption>
		{/if}
		<Table.Header>
			<Table.Row class="hover:bg-transparent">
				{#if selectable}
					<Table.Head class="w-10 pl-4">
						<Checkbox
							checked={allSelected}
							indeterminate={someSelected}
							onCheckedChange={(value) => toggleAll(value)}
							aria-label="Select all rows on this page"
						/>
					</Table.Head>
				{/if}
				{#each columns as column (column.key)}
					{@const align = column.align ?? 'left'}
					<Table.Head class={cn(alignClass[align], column.class)} aria-sort={ariaSort(column)}>
						{#if column.sortable}
							{@const active = sortKey === column.key && sortDir}
							<button
								type="button"
								onclick={() => toggleSort(column)}
								title="Sort by {column.header}"
								class={cn(
									'-mx-2 inline-flex h-8 select-none items-center gap-1.5 rounded-lg px-2 font-semibold whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
									active && 'text-foreground',
									align === 'right' && 'flex-row-reverse'
								)}
							>
								{column.header}
								{#if !active}
									<ChevronsUpDownIcon class="size-3.5 opacity-60" aria-hidden="true" />
								{:else if sortDir === 'asc'}
									<ArrowUpIcon class="size-3.5 text-[color:var(--primary)]" aria-hidden="true" />
								{:else}
									<ArrowDownIcon class="size-3.5 text-[color:var(--primary)]" aria-hidden="true" />
								{/if}
							</button>
						{:else}
							{column.header}
						{/if}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as row (getRowId(row))}
				{@const id = getRowId(row)}
				{@const isSelected = selected.includes(id)}
				<Table.Row data-state={isSelected ? 'selected' : undefined}>
					{#if selectable}
						<Table.Cell class="pl-4">
							<Checkbox
								checked={isSelected}
								onCheckedChange={(value) => toggleRow(id, value)}
								aria-label="Select row"
							/>
						</Table.Cell>
					{/if}
					{#each columns as column (column.key)}
						{@const align = column.align ?? 'left'}
						<Table.Cell
							class={cn(alignClass[align], align === 'right' && 'tabular-nums', column.class)}
						>
							{#if column.cell}
								{@render column.cell(row)}
							{:else}
								{row[column.key]}
							{/if}
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row class="hover:bg-transparent">
					<Table.Cell
						colspan={columns.length + (selectable ? 1 : 0)}
						class="h-24 text-center text-muted-foreground"
					>
						No results.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	<div
		class="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm text-muted-foreground"
	>
		<span class="tabular-nums">
			{#if selectable && selected.length > 0}
				{selected.length} of {data.length} selected
			{:else}
				{data.length}
				{data.length === 1 ? 'row' : 'rows'}
			{/if}
		</span>
		{#if paginated}
			<div class="flex items-center gap-2">
				<span class="tabular-nums">Page {currentPage + 1} of {pageCount}</span>
				<div class="flex items-center gap-1">
					<button
						type="button"
						class={buttonVariants({ variant: 'outline', size: 'icon' })}
						onclick={() => (page = Math.max(0, currentPage - 1))}
						disabled={currentPage === 0}
						title="Previous page"
					>
						<ChevronLeftIcon class="relative z-10 size-4" aria-hidden="true" />
						<span class="sr-only">Previous page</span>
					</button>
					<button
						type="button"
						class={buttonVariants({ variant: 'ghost', size: 'icon' })}
						onclick={() => (page = Math.min(pageCount - 1, currentPage + 1))}
						disabled={currentPage >= pageCount - 1}
						title="Next page"
					>
						<ChevronRightIcon class="relative z-10 size-4" aria-hidden="true" />
						<span class="sr-only">Next page</span>
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
