<script lang="ts">
	import { Kanban, type KanbanColumn } from '$lib/components/ui/kanban';

	type Task = { id: string; title: string; agent: string };

	let columns = $state<KanbanColumn<Task>[]>([
		{
			id: 'queued',
			title: 'Queued',
			cards: [
				{ id: 'digest', title: 'Weekly inbox digest', agent: 'Inbox' },
				{ id: 'fares', title: 'Watch fares to Lisbon', agent: 'Travel' }
			]
		},
		{
			id: 'running',
			title: 'Running',
			cards: [
				{ id: 'pricing', title: 'Competitor pricing scan', agent: 'Research' },
				{ id: 'tests', title: 'Fix flaky upload tests', agent: 'Code' }
			]
		},
		{
			id: 'review',
			title: 'Review',
			cards: [{ id: 'notes', title: 'Draft release notes', agent: 'Writer' }]
		},
		{
			id: 'done',
			title: 'Done',
			cards: [{ id: 'churn', title: 'Summarise churn calls', agent: 'Research' }]
		}
	]);
</script>

<Kanban bind:columns label="Agent tasks" getLabel={(task) => task.title} class="max-w-2xl">
	{#snippet children(task)}
		<span class="font-medium">{task.title}</span>
		<span class="text-muted-foreground text-xs">{task.agent} agent</span>
	{/snippet}
</Kanban>
