<script lang="ts">
	import * as Command from './index.js';

	let {
		open = $bindable(false),
		dialog = false,
		onRun = () => {}
	}: { open?: boolean; dialog?: boolean; onRun?: (label: string) => void } = $props();

	const labels = ['Go to settings', 'Summarize this thread', 'Switch model'];
</script>

{#snippet body()}
	<Command.Input placeholder="Type a command" />
	<Command.List>
		<Command.Empty>No results</Command.Empty>
		<Command.Group heading="Actions">
			{#each labels as label (label)}
				<Command.Item value={label} onSelect={() => onRun(label)}>
					<Command.Match text={label} />
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
{/snippet}

{#if dialog}
	<Command.Dialog bind:open shortcut="k">
		{@render body()}
	</Command.Dialog>
{:else}
	<Command.Root>
		{@render body()}
	</Command.Root>
{/if}
