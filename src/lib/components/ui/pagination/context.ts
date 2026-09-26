import { getContext, setContext } from 'svelte';

export type PaginationState = {
	/** The current page, counted from 1. */
	readonly page: number;
	/** How many pages there are, at least 1. */
	readonly totalPages: number;
	/** Moves to a page and reports it through `onPageChange`. */
	setPage(page: number): void;
};

const KEY = Symbol('mizu-pagination');

export function setPaginationState(state: PaginationState) {
	setContext(KEY, state);
}

export function getPaginationState(): PaginationState {
	const state = getContext<PaginationState | undefined>(KEY);
	if (!state) throw new Error('<Pagination.Pages> must be used within a <Pagination.Root>.');
	return state;
}
