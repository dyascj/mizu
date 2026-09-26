<script lang="ts">
	import Kanban from './kanban.svelte';
	import type { KanbanColumn } from './types.js';

	type Task = { id: string; title: string };

	let {
		columns = $bindable(),
		onChange
	}: { columns: KanbanColumn<Task>[]; onChange?: (columns: KanbanColumn<Task>[]) => void } =
		$props();
</script>

<Kanban bind:columns {onChange} label="Agent tasks" getLabel={(task) => task.title}>
	{#snippet children(task)}
		<span>{task.title}</span>
	{/snippet}
</Kanban>
