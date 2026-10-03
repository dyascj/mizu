<script lang="ts">
	import { Lens } from '$lib/components/ui/lens';

	type Part = { text: string; source?: number };

	const sources = ['Booking email', 'Airline site', 'Live wait times'];

	// One answer, split where each claim came from. Both layers set the same
	// words in the same boxes; the revealed one only adds marks.
	const answer: Part[] = [
		{ text: 'Your flight to Lisbon ' },
		{ text: 'leaves at 9:40 from Terminal 2', source: 1 },
		{ text: '. ' },
		{ text: 'Check-in closes 45 minutes before departure', source: 2 },
		{ text: ', so aim to arrive by 8:30. ' },
		{ text: 'Security is running about 20 minutes', source: 3 },
		{ text: ' this morning.' }
	];
</script>

{#snippet card(annotated: boolean)}
	<div
		class={[
			'flex size-full flex-col gap-3 p-6',
			annotated ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'
		]}
	>
		<p class={['text-sm font-medium', annotated ? 'opacity-70' : 'text-muted-foreground']}>
			Assistant
		</p>
		<p class="text-base leading-8 text-pretty">
			{#each answer as part, index (index)}
				{#if part.source && annotated}
					{@const [first, ...rest] = part.text.split(' ')}
					<!-- A zero-width anchor, kept on the line of the claim's first word,
					     so the label sits in the gap above it without moving a word. -->
					<span class="bg-primary-foreground/15 rounded-sm"
						><span class="whitespace-nowrap"
							><span class="relative inline-block size-0"
								><span
									class="absolute start-0 bottom-[1.05rem] font-mono text-[10px] leading-none whitespace-nowrap opacity-70"
									>{sources[part.source - 1]}</span
								></span
							>{first}</span
						>{' ' + rest.join(' ')}</span
					>
				{:else}
					{part.text}
				{/if}
			{/each}
		</p>
	</div>
{/snippet}

<Lens
	label="Travel answer"
	description="Under the lens, each claim shows its source: the departure time from your booking email, check-in from the airline site, and security from live wait times."
	class="h-[22rem] max-w-md sm:h-72"
>
	{@render card(false)}
	{#snippet reveal()}
		{@render card(true)}
	{/snippet}
</Lens>
