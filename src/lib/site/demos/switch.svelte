<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';

	const settings = [
		{ id: 'web-search', name: 'Web search', description: 'Look things up before answering' },
		{ id: 'memory', name: 'Memory', description: 'Remember details across chats' },
		{ id: 'voice', name: 'Voice replies', description: 'Read answers aloud as they stream' }
	];

	let values = $state<Record<string, boolean>>({ 'web-search': true, memory: true, voice: false });
</script>

<div class="bg-card flex w-full max-w-sm flex-col rounded-2xl p-2 shadow-sm">
	{#each settings as setting (setting.id)}
		<div class="flex items-center justify-between gap-4 px-3 py-2.5">
			<div class="flex min-w-0 flex-col gap-0.5">
				<Label for={setting.id}>{setting.name}</Label>
				<p class="text-muted-foreground text-sm">{setting.description}</p>
			</div>
			<Switch id={setting.id} bind:checked={values[setting.id]} />
		</div>
	{/each}
</div>
