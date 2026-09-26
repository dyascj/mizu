<script lang="ts">
	import { Tree, type TreeNode } from '$lib/components/ui/tree';

	const items: TreeNode[] = [
		{
			id: 'agents',
			label: 'agents',
			children: [
				{
					id: 'research',
					label: 'research',
					children: [
						{ id: 'research-prompt', label: 'system-prompt.md' },
						{ id: 'research-tools', label: 'tools.json' },
						{ id: 'research-evals', label: 'evals.yaml' }
					]
				},
				{
					id: 'support',
					label: 'support',
					children: [
						{ id: 'support-prompt', label: 'system-prompt.md' },
						{ id: 'support-tools', label: 'tools.json' }
					]
				}
			]
		},
		{
			id: 'runs',
			label: 'runs',
			children: [
				{ id: 'run-0412', label: 'run-0412.jsonl' },
				{ id: 'run-0413', label: 'run-0413.jsonl' }
			]
		},
		{ id: 'models', label: 'models.yaml' },
		{ id: 'readme', label: 'README.md' }
	];
</script>

<div class="bg-card w-full max-w-xs rounded-2xl p-1.5 shadow-sm">
	<Tree
		{items}
		aria-label="Agent workspace"
		defaultExpanded={['agents', 'research']}
		selected="research-prompt"
	/>
</div>
