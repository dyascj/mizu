<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/ui/button';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Greeting } from '$lib/components/ui/greeting';

	let run = $state(0);
</script>

<div class="flex w-full max-w-md flex-col gap-5">
	<div class="flex flex-col gap-1.5">
		{#key run}
			<Greeting as="h2" name="Ada" class="text-2xl font-semibold" />
		{/key}
		<p class="text-muted-foreground text-sm">Pick up the launch plan, or start something new.</p>
	</div>
	<ChatInput placeholder="Ask anything" label="Message the assistant" />
	<Button variant="ghost" size="sm" class="-ms-2 self-start" onclick={() => (run += 1)}>
		<RotateCcw class="size-3.5" />
		Replay
	</Button>
</div>
