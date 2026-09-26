<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { SendButton } from '$lib/components/ui/send-button';

	let value = $state('');
	let messages = $state<string[]>(['Summarize the launch notes in three bullets.']);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const message = value.trim();
		if (!message) return;
		messages = [...messages.slice(-1), message];
		value = '';
	}
</script>

<div class="flex w-full max-w-md flex-col gap-6">
	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-2">
			{#each messages as message, index (index + message)}
				<ChatBubble role="user">{message}</ChatBubble>
			{/each}
		</div>
		<form
			onsubmit={submit}
			class="bg-control focus-within:ring-ring flex w-full items-center gap-1 rounded-full p-1.5 pl-2 focus-within:ring-2"
		>
			<input
				bind:value
				aria-label="Message"
				placeholder="Ask anything"
				class="text-foreground placeholder:text-muted-foreground h-9 min-w-0 flex-1 bg-transparent px-2.5 text-base outline-none sm:text-sm"
			/>
			<SendButton type="submit" iconOnly disabled={!value.trim()} label="Send message" />
		</form>
	</div>
	<div class="flex flex-wrap items-center justify-center gap-3">
		<SendButton label="Send to agent" />
		<SendButton variant="secondary" label="Send invite" sentLabel="Invited" />
	</div>
</div>
