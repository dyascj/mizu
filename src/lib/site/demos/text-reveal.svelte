<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/ui/button';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { TextReveal } from '$lib/components/ui/text-reveal';

	let run = $state(0);
</script>

<div class="flex w-full max-w-md flex-col gap-5">
	{#key run}
		<TextReveal
			as="h3"
			by="character"
			effect="rise"
			text="Your trip is planned."
			class="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
		/>
		<ChatBubble role="assistant" animate={false}>
			<TextReveal
				as="p"
				delay={480}
				text="Three nights in Lisbon, a window seat on the Friday flight, and a table for two at the place with the tiled courtyard. I kept Sunday open on purpose."
			/>
		</ChatBubble>
	{/key}
	<Button variant="ghost" size="sm" class="self-start" onclick={() => run++}>
		<RotateCcw class="size-3.5" />
		Replay
	</Button>
</div>
