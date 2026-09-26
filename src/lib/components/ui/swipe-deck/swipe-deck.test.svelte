<script lang="ts">
	import SwipeDeck from './swipe-deck.svelte';

	type Card = { id: string; title: string };

	let {
		items,
		loop = false,
		restart = false,
		onSwipe
	}: {
		restart?: boolean;
		items: Card[];
		loop?: boolean;
		onSwipe?: (item: Card, direction: 'left' | 'right') => void;
	} = $props();
</script>

<SwipeDeck {items} {loop} {onSwipe} label="Suggestions" getLabel={(card) => card.title}>
	{#snippet children(card)}
		<p>{card.title}</p>
	{/snippet}
	{#snippet empty()}
		<p>All done</p>
		{#if restart}
			<button type="button">Review again</button>
		{/if}
	{/snippet}
</SwipeDeck>
