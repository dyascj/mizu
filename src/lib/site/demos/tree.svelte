<script lang="ts">
	import { Tree, type TreeNode } from '$lib/components/ui/tree';

	const items: TreeNode[] = [
		{
			id: 'src',
			label: 'src',
			children: [
				{
					id: 'components',
					label: 'components',
					children: [
						{ id: 'button', label: 'button.svelte' },
						{ id: 'orb', label: 'orb.svelte' }
					]
				},
				{ id: 'app-css', label: 'app.css' }
			]
		},
		{ id: 'static', label: 'static' },
		{ id: 'readme', label: 'README.md' }
	];
</script>

<div class="w-full max-w-xs">
	<Tree {items} defaultExpanded={['src']} selected="button" />
</div>
