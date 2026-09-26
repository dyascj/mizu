<script lang="ts">
	import { ShortcutRecorder } from '$lib/components/ui/shortcut-recorder';

	const rows = [
		{ id: 'new-chat', label: 'New chat', keys: ['Mod', 'Shift', 'O'] },
		{ id: 'palette', label: 'Ask assistant', keys: ['Mod', 'J'] },
		{ id: 'model', label: 'Switch model', keys: ['Mod', 'M'] }
	];

	let keys = $state<Record<string, string[]>>(
		Object.fromEntries(rows.map((row) => [row.id, row.keys]))
	);

	const same = (a: string[], b: string[]) =>
		a.length === b.length && a.every((token, index) => token === b[index]);
</script>

<div class="bg-card w-full max-w-sm rounded-2xl p-2 shadow-sm">
	<p class="text-muted-foreground px-4 pt-3 pb-1 text-xs font-medium">Keyboard shortcuts</p>
	{#each rows as row (row.id)}
		<ShortcutRecorder
			class="px-4 py-3"
			label={row.label}
			bind:value={keys[row.id]}
			taken={(combo) =>
				rows.find((other) => other.id !== row.id && same(keys[other.id], combo))?.label ?? null}
		/>
	{/each}
</div>
