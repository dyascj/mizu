<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { Thinking } from '$lib/components/ui/thinking';
</script>

<div class="flex w-full max-w-md flex-col gap-2">
	<ChatBubble role="user">Morning! What should I cook tonight?</ChatBubble>
	<ChatBubble role="assistant">Something cozy. Miso-glazed salmon over rice, twenty minutes.</ChatBubble>
	<div class="pl-4">
		<Thinking variant="dots" label="Typing" />
	</div>
</div>
