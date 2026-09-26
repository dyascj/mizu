// TanStack Table v9 ships an official Svelte 5 adapter, so this item re-exports
// it instead of vendoring one. `createSvelteTable` stays as the local name for
// continuity with code written against earlier releases; it is the adapter's
// `createTable`. The adapter also re-exports all of @tanstack/table-core, so
// `tableFeatures`, row model factories, sort functions, and types can be
// imported from '@tanstack/svelte-table' directly.
export {
	FlexRender,
	renderComponent,
	renderSnippet,
	createTable as createSvelteTable
} from '@tanstack/svelte-table';

// Parts that make a table feel alive: rows that glide to their new places when
// sorted, a sort button that sets `aria-sort`, and a bulk action bar that rises
// out of the table while rows are selected.
export { default as DataTableBody } from './data-table-body.svelte';
export { default as DataTableRow } from './data-table-row.svelte';
export {
	default as DataTableSortButton,
	type SortableColumn
} from './data-table-sort-button.svelte';
export { default as DataTableBulkBar } from './data-table-bulk-bar.svelte';
export { default as DataTableBulkAction } from './data-table-bulk-action.svelte';
