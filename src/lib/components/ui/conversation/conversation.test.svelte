<script lang="ts">
	import { Conversation, ConversationMessage } from './index.js';

	let {
		messages = [],
		typing = false
	}: {
		messages?: { id: number; role: 'user' | 'assistant'; text: string }[];
		typing?: boolean;
	} = $props();
</script>

<Conversation label="Chat with Ops" typingLabel="Ops is typing" {typing} class="h-96">
	{#each messages as message, i (message.id)}
		<ConversationMessage
			role={message.role}
			grouped={messages[i - 1]?.role === message.role}
			author={message.role === 'assistant' ? 'Ops' : undefined}
		>
			{message.text}
		</ConversationMessage>
	{/each}
</Conversation>
