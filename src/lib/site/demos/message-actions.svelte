<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { MessageActions } from '$lib/components/ui/message-actions';
	import { toast } from '$lib/components/ui/toast';

	const reply =
		'Twenty minutes, one pan: miso-glazed salmon over rice with charred scallions.';
</script>

<div class="flex w-full max-w-md flex-col gap-1.5">
	<ChatBubble role="assistant" animate={false}>{reply}</ChatBubble>
	<MessageActions
		text={reply}
		class="pl-1"
		onRegenerate={() => toast.info('Regenerating...')}
		onFeedback={(f) => toast.success({ title: 'Thanks', description: `Marked ${f}.` })}
	/>
</div>
