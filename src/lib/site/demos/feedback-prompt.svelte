<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { FeedbackPrompt } from '$lib/components/ui/feedback-prompt';

	let saved = $state('');
</script>

<div class="flex w-full max-w-md flex-col items-start gap-3">
	<ChatBubble role="user" animate={false}>How do I validate a form before it submits?</ChatBubble>
	<ChatBubble role="assistant" animate={false}>
		Listen for the form's submit event, check each field, and call preventDefault when one fails.
		Show the message next to the field so people can fix it without scrolling.
	</ChatBubble>
	<FeedbackPrompt
		onAnswer={(helpful, note) => (saved = helpful ? 'Saved: helpful' : `Saved: "${note}"`)}
		onUndo={() => (saved = '')}
	/>
	<p class="text-muted-foreground min-h-5 pl-1 text-xs">{saved}</p>
</div>
