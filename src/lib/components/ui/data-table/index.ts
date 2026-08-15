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
