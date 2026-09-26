<script lang="ts">
	import * as DropdownMenu from './index.js';

	let { onPick }: { onPick: (label: string) => void } = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>Chat options</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onSelect={() => onPick('Rename')}>Rename</DropdownMenu.Item>
		<DropdownMenu.Item onSelect={() => onPick('Share')}>Share</DropdownMenu.Item>
		<DropdownMenu.Item variant="destructive" onSelect={() => onPick('Delete')}>
			Delete chat
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
