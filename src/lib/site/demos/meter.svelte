<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Meter } from '$lib/components/ui/meter';

	const gb = (v: number) => `${v.toFixed(1)} GB`;
	const CACHE = 2.4;

	let cleared = $state(false);
	const segments = $derived([
		{ id: 'files', label: 'Files', value: 14.2 },
		{ id: 'history', label: 'Chat history', value: 11.6 },
		{ id: 'embeddings', label: 'Embeddings', value: 6.3 },
		{ id: 'cache', label: 'Prompt cache', value: cleared ? 0 : CACHE }
	]);
</script>

<div class="bg-card w-full max-w-md rounded-2xl p-5 shadow-sm sm:p-6">
	<Meter label="Workspace storage" {segments} max={64} format={gb} />
	<div class="mt-4 flex items-center justify-between gap-3">
		<p class="text-muted-foreground text-sm">
			{cleared ? `Freed ${gb(CACHE)}` : `${gb(CACHE)} can be cleared`}
		</p>
		<Button
			size="sm"
			variant={cleared ? 'secondary' : 'primary'}
			onclick={() => (cleared = !cleared)}
		>
			{cleared ? 'Undo' : 'Clear cache'}
		</Button>
	</div>
</div>
