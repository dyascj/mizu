<script lang="ts">
	import { Sortable } from '$lib/components/ui/sortable';
	import Code from '@lucide/svelte/icons/code';
	import Languages from '@lucide/svelte/icons/languages';
	import Mail from '@lucide/svelte/icons/mail';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import Plane from '@lucide/svelte/icons/plane';
	import Search from '@lucide/svelte/icons/search';

	let models = $state([
		{ id: 'large', name: 'Large', latency: '1.1s' },
		{ id: 'medium', name: 'Medium', latency: '640ms' },
		{ id: 'small', name: 'Small', latency: '420ms' },
		{ id: 'local', name: 'On device', latency: '180ms' }
	]);

	let assistants = $state([
		{ id: 'research', name: 'Research', icon: Search },
		{ id: 'writer', name: 'Writer', icon: PenLine },
		{ id: 'code', name: 'Code', icon: Code },
		{ id: 'inbox', name: 'Inbox', icon: Mail },
		{ id: 'travel', name: 'Travel', icon: Plane },
		{ id: 'translate', name: 'Translate', icon: Languages }
	]);
</script>

<div class="flex w-full max-w-sm flex-col gap-8">
	<div class="flex flex-col gap-3">
		<p class="text-sm font-medium">Fallback order</p>
		<Sortable bind:items={models} label="Fallback order" getLabel={(model) => model.name}>
			{#snippet children(model)}
				<span class="min-w-0 flex-1 truncate text-sm font-medium">{model.name}</span>
				<span class="text-muted-foreground shrink-0 text-sm tabular-nums">{model.latency}</span>
			{/snippet}
		</Sortable>
	</div>
	<div class="flex flex-col gap-3">
		<p class="text-sm font-medium">Pinned assistants</p>
		<Sortable
			bind:items={assistants}
			layout="grid"
			label="Pinned assistants"
			getLabel={(assistant) => assistant.name}
		>
			{#snippet children(assistant)}
				<assistant.icon class="text-muted-foreground size-6" />
				<span>{assistant.name}</span>
			{/snippet}
		</Sortable>
	</div>
</div>
