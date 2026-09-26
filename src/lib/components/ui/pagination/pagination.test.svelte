<script lang="ts">
	import * as Pagination from './index.js';

	let {
		page = $bindable(1),
		count = 200,
		slots,
		onPageChange
	}: {
		page?: number;
		count?: number;
		slots?: number;
		onPageChange?: (page: number) => void;
	} = $props();
</script>

<Pagination.Root {count} perPage={10} bind:page {onPageChange}>
	<Pagination.Content>
		<Pagination.Item><Pagination.PrevButton /></Pagination.Item>
		<Pagination.Pages {slots} />
		<Pagination.Item><Pagination.NextButton /></Pagination.Item>
	</Pagination.Content>
</Pagination.Root>
