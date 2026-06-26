import type { Snippet } from 'svelte';

export type DataTableColumn<Row extends Record<string, unknown>> = {
	key: keyof Row & string;
	header: string;
	sortable?: boolean;
	align?: 'left' | 'right' | 'center';
	class?: string;
	cell?: Snippet<[Row]>;
};
