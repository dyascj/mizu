<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/ui/button';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { Highlight } from '$lib/components/ui/highlight';

	let run = $state(0);
</script>

<div class="flex w-full max-w-md flex-col gap-4">
	<ChatBubble role="user" animate={false}>Can we spend less on software this quarter?</ChatBubble>
	<!-- The answer sits on the page, as assistant replies do, so the ink reads
	     against the lightest surface. -->
	<div class="px-1">
		{#key run}
			<p class="leading-7 text-pretty">
				I went through the last three invoices. You are paying for eleven seats that nobody has
				opened since March, and two tools that overlap. Dropping them would <Highlight tone="aurora"
					>cut the monthly bill by about a third</Highlight
				> without losing anything the team uses.
			</p>
		{/key}
	</div>
	<Button variant="ghost" size="sm" class="self-start" onclick={() => run++}>
		<RotateCcw class="size-3.5" />
		Replay
	</Button>
</div>
