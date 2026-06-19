<script lang="ts">
	import * as Pagination from '$lib/components/ui/pagination';

	let page = $state(1);
</script>

<Pagination.Root count={60} perPage={10} bind:page>
	{#snippet children({ pages })}
		<Pagination.Content>
			<Pagination.Item>
				<Pagination.PrevButton />
			</Pagination.Item>
			{#each pages as p (p.key)}
				{#if p.type === 'ellipsis'}
					<Pagination.Item>
						<Pagination.Ellipsis />
					</Pagination.Item>
				{:else}
					<Pagination.Item>
						<Pagination.Page page={p} />
					</Pagination.Item>
				{/if}
			{/each}
			<Pagination.Item>
				<Pagination.NextButton />
			</Pagination.Item>
		</Pagination.Content>
	{/snippet}
</Pagination.Root>
