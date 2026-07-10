<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { Thinking } from '$lib/components/ui/thinking';
</script>

<div class="flex w-full max-w-md flex-col gap-2">
	<ChatBubble role="user">Morning! What should I cook tonight?</ChatBubble>
	<ChatBubble role="assistant">
		Something cozy. You have salmon and miso in the fridge, so a quick miso-glazed salmon with rice
		would land perfectly.
	</ChatBubble>
	<div class="pl-4">
		<Thinking variant="dots" label="Typing" />
	</div>
</div>
