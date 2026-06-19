<script lang="ts">
	import * as Select from '$lib/components/ui/select';

	const sources = [
		{ value: 'ocean', label: 'Ocean' },
		{ value: 'lake', label: 'Lake' },
		{ value: 'river', label: 'River' },
		{ value: 'rain', label: 'Rain' }
	];

	let value = $state('');

	const selectedLabel = $derived(sources.find((s) => s.value === value)?.label);
</script>

<Select.Root type="single" bind:value>
	<Select.Trigger class="w-56">
		{selectedLabel ?? 'Pick a water source'}
	</Select.Trigger>
	<Select.Content>
		{#each sources as source (source.value)}
			<Select.Item value={source.value} label={source.label}>
				{source.label}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
