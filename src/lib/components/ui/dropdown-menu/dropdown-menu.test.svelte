<script lang="ts">
	import * as DropdownMenu from './index.js';

	let { onPick, sub = false }: { onPick: (label: string) => void; sub?: boolean } = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>Chat options</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onSelect={() => onPick('Rename')}>Rename</DropdownMenu.Item>
		<DropdownMenu.Item onSelect={() => onPick('Share')}>Share</DropdownMenu.Item>
		<DropdownMenu.Item variant="destructive" onSelect={() => onPick('Delete')}>
			Delete chat
		</DropdownMenu.Item>
		{#if sub}
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Move to project</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item onSelect={() => onPick('Travel')}>Travel</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
