<script lang="ts">
	import * as Combobox from '$lib/components/ui/combobox';

	const agents = [
		{ value: 'research', label: 'Research agent', detail: 'Reads sources and cites them' },
		{ value: 'support', label: 'Support triage', detail: 'Sorts and drafts replies to tickets' },
		{ value: 'review', label: 'Code reviewer', detail: 'Checks pull requests for bugs' },
		{ value: 'analyst', label: 'Data analyst', detail: 'Writes SQL and charts results' },
		{ value: 'scribe', label: 'Meeting scribe', detail: 'Summarizes calls into action items' },
		{ value: 'travel', label: 'Travel planner', detail: 'Builds itineraries and books trips' }
	];

	const uid = $props.id();
	let value = $state('');
	let search = $state('');

	const needle = $derived(search.trim().toLowerCase());
	const filtered = $derived(
		needle
			? agents.filter(
					(a) => a.label.toLowerCase().includes(needle) || a.detail.toLowerCase().includes(needle)
				)
			: agents
	);
</script>

<!-- Dims the rest rather than bolding the match, so names never reflow as you type. -->
{#snippet highlight(text: string)}
	{@const at = needle ? text.toLowerCase().indexOf(needle) : -1}
	{#if at < 0}
		{text}
	{:else}
		<span class="text-muted-foreground"
			>{text.slice(0, at)}<mark class="text-foreground bg-transparent"
				>{text.slice(at, at + needle.length)}</mark
			>{text.slice(at + needle.length)}</span
		>
	{/if}
{/snippet}

<div class="flex w-full max-w-xs flex-col gap-2">
	<label for="{uid}-input" class="text-sm font-medium">Delegate to</label>
	<Combobox.Root
		type="single"
		bind:value
		name="agent"
		onOpenChange={(open) => {
			if (!open) search = '';
		}}
	>
		<div class="relative">
			<Combobox.Input
				id="{uid}-input"
				oninput={(e) => (search = e.currentTarget.value)}
				placeholder="Search agents"
				class="pr-9"
			/>
			<Combobox.Trigger aria-label="Show agents" />
		</div>
		<Combobox.Content>
			{#each filtered as agent (agent.value)}
				<Combobox.Item value={agent.value} label={agent.label}>
					<span class="flex min-w-0 flex-col">
						<span class="truncate">{@render highlight(agent.label)}</span>
						<span class="text-muted-foreground truncate text-xs">{agent.detail}</span>
					</span>
				</Combobox.Item>
			{:else}
				<p class="text-muted-foreground px-2 py-1.5 text-sm">No agent matches "{search.trim()}"</p>
			{/each}
		</Combobox.Content>
	</Combobox.Root>
</div>
