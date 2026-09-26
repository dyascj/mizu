<script lang="ts">
	import DragSelect from './drag-select.svelte';

	let {
		selected = $bindable([]),
		onSelectionChange,
		count = 5
	}: {
		selected?: string[];
		onSelectionChange?: (ids: string[]) => void;
		count?: number;
	} = $props();

	const items = $derived(
		['Roadmap', 'Pricing', 'Brief', 'Survey', 'Notes'].slice(0, count).map((name) => ({
			id: name.toLowerCase(),
			name
		}))
	);
</script>

<DragSelect {items} bind:selected {onSelectionChange} label="Sources">
	{#snippet children(item)}
		<span>{item.name}</span>
	{/snippet}
</DragSelect>
