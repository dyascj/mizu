<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { SwipeDeck } from '$lib/components/ui/swipe-deck';
	import Brain from '@lucide/svelte/icons/brain';

	type Memory = { id: string; fact: string; source: string };

	const memories: Memory[] = [
		{
			id: 'units',
			fact: 'Prefers metric units in every answer.',
			source: 'From a chat about a 10k plan'
		},
		{
			id: 'tone',
			fact: 'Wants replies short, with the answer first.',
			source: 'From feedback on 4 replies'
		},
		{ id: 'stack', fact: 'Ships with SvelteKit and Postgres.', source: 'From a debugging session' },
		{
			id: 'diet',
			fact: 'Vegetarian, cooks for two on weeknights.',
			source: 'From a meal planning chat'
		},
		{ id: 'tz', fact: 'Works from Lisbon, usually mornings.', source: 'From calendar questions' }
	];

	let round = $state(0);
	let saved = $state(0);
</script>

<div class="flex w-full flex-col items-center gap-4">
	<p class="text-muted-foreground text-sm">
		{saved} saved · swipe right to remember, left to forget
	</p>
	{#key round}
		<SwipeDeck
			items={memories}
			label="Suggested memories"
			getLabel={(memory) => memory.fact}
			acceptLabel="Remember"
			rejectLabel="Forget"
			onSwipe={(_, direction) => direction === 'right' && saved++}
		>
			{#snippet children(memory)}
				<div class="flex h-full flex-col justify-between p-6">
					<span
						class="bg-secondary text-muted-foreground grid size-9 place-items-center rounded-full"
					>
						<Brain class="size-4" />
					</span>
					<div class="flex flex-col gap-2">
						<p class="text-lg font-semibold tracking-tight text-balance">{memory.fact}</p>
						<p class="text-muted-foreground text-sm">{memory.source}</p>
					</div>
				</div>
			{/snippet}
			{#snippet empty()}
				<div class="flex flex-col items-center gap-3 text-center">
					<p class="text-muted-foreground text-sm">No more suggestions</p>
					<Button
						variant="secondary"
						size="sm"
						onclick={() => {
							saved = 0;
							round++;
						}}
					>
						Review again
					</Button>
				</div>
			{/snippet}
		</SwipeDeck>
	{/key}
</div>
