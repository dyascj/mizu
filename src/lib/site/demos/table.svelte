<script lang="ts">
	import * as Table from '$lib/components/ui/table';

	const sources = [
		{ source: 'Rainfall', volume: '1,240 L', status: 'Clear' },
		{ source: 'Spring', volume: '860 L', status: 'Clear' },
		{ source: 'Reservoir', volume: '3,500 L', status: 'Filtered' }
	];
</script>

<div class="w-full max-w-md">
	<Table.Root>
		<Table.Caption>Water collected this week.</Table.Caption>
		<Table.Header>
			<Table.Row>
				<Table.Head>Source</Table.Head>
				<Table.Head>Volume</Table.Head>
				<Table.Head>Status</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each sources as row (row.source)}
				<Table.Row>
					<Table.Cell class="font-medium">{row.source}</Table.Cell>
					<Table.Cell>{row.volume}</Table.Cell>
					<Table.Cell>{row.status}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
