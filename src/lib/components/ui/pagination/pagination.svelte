<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { setPaginationState } from './context.js';

	let {
		ref = $bindable(null),
		page = $bindable(1),
		class: className,
		...restProps
	}: PaginationPrimitive.RootProps & { class?: string } = $props();

	// Parts that move the page themselves, such as Pagination.Pages, go through
	// here so bound and callback consumers both hear about it.
	setPaginationState({
		get page() {
			return page;
		},
		get totalPages() {
			const count = restProps.count ?? 0;
			const perPage = restProps.perPage ?? 1;
			return count === 0 ? 1 : Math.max(1, Math.ceil(count / perPage));
		},
		setPage(next) {
			if (next === page) return;
			page = next;
			restProps.onPageChange?.(next);
		}
	});
</script>

<PaginationPrimitive.Root
	bind:ref
	bind:page
	class={cn('mx-auto flex w-full flex-col items-center gap-3', className)}
	{...restProps}
/>
