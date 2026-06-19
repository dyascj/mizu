<script lang="ts">
	import * as Combobox from '$lib/components/ui/combobox';

	const sources = [
		{ value: 'spring', label: 'Spring water' },
		{ value: 'ocean', label: 'Ocean' },
		{ value: 'lake', label: 'Lake' },
		{ value: 'river', label: 'River' },
		{ value: 'rain', label: 'Rainfall' },
		{ value: 'glacier', label: 'Glacier melt' }
	];

	let value = $state('');
	let search = $state('');

	const filtered = $derived(
		search ? sources.filter((s) => s.label.toLowerCase().includes(search.toLowerCase())) : sources
	);
</script>

<Combobox.Root type="single" bind:value name="source">
	<div class="relative w-64">
		<Combobox.Input
			oninput={(e) => (search = e.currentTarget.value)}
			placeholder="Search water sources..."
			class="pr-9"
		/>
		<Combobox.Trigger aria-label="Toggle sources" />
	</div>
	<Combobox.Content>
		<Combobox.Group>
			<Combobox.GroupHeading>Sources</Combobox.GroupHeading>
			{#each filtered as source (source.value)}
				<Combobox.Item value={source.value} label={source.label}>
					{source.label}
				</Combobox.Item>
			{/each}
		</Combobox.Group>
	</Combobox.Content>
</Combobox.Root>
