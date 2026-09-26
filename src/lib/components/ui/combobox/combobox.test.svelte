<script lang="ts">
	import * as Combobox from './index.js';

	let { value = $bindable('') }: { value?: string } = $props();

	const agents = [
		{ value: 'research', label: 'Research agent' },
		{ value: 'scribe', label: 'Meeting scribe' }
	];
</script>

<Combobox.Root type="single" bind:value>
	<Combobox.Input aria-label="Delegate to" />
	<Combobox.Content>
		{#each agents as agent (agent.value)}
			<Combobox.Item value={agent.value} label={agent.label} />
		{/each}
	</Combobox.Content>
</Combobox.Root>
