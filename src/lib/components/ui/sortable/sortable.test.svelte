<script lang="ts">
	import Sortable from './sortable.svelte';

	type Item = { id: string; name: string };

	let {
		items = $bindable(),
		layout = 'list',
		onReorder
	}: {
		items: Item[];
		layout?: 'list' | 'grid';
		onReorder?: (items: Item[]) => void;
	} = $props();
</script>

<Sortable bind:items {layout} {onReorder} columns={2} label="Steps" getLabel={(item) => item.name}>
	{#snippet children(item)}
		<span>{item.name}</span>
	{/snippet}
</Sortable>
