<script lang="ts">
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';

	let run = $state(0);
</script>

<div class="w-full max-w-md">
	<ChatBubble role="assistant" animate={false} class="min-h-24 w-full max-w-full">
		{#key run}
			<StreamingText
				text="Here is the plan: a slow morning, a long walk by the water, and dinner you do not have to think about. I already found three places nearby with open tables."
				speed={70}
				onComplete={() => setTimeout(() => (run += 1), 2600)}
			/>
		{/key}
	</ChatBubble>
</div>
