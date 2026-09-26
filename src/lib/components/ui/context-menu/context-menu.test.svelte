<script lang="ts">
	import * as ContextMenu from './index.js';

	let { onPick }: { onPick: (label: string) => void } = $props();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger tabindex={0} role="group" aria-label="Assistant reply">
		Reply text
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onSelect={() => onPick('Copy')}>Copy text</ContextMenu.Item>
		<ContextMenu.Item variant="destructive" onSelect={() => onPick('Delete')}
			>Delete</ContextMenu.Item
		>
	</ContextMenu.Content>
</ContextMenu.Root>
