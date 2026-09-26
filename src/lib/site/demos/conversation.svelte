<script lang="ts">
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Conversation, ConversationMessage } from '$lib/components/ui/conversation';
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';

	type Message = { id: number; role: 'user' | 'assistant'; text: string; stream?: boolean };

	let messages = $state<Message[]>([
		{ id: 0, role: 'user', text: 'Can you check whether the migration finished overnight?' },
		{ id: 1, role: 'assistant', text: 'It did. All 48 tables moved, and the row counts match.' },
		{
			id: 2,
			role: 'assistant',
			text: 'The job took 3 hours 12 minutes, about 20 minutes faster than Tuesday.'
		},
		{ id: 3, role: 'user', text: 'Any errors in the logs?' },
		{
			id: 4,
			role: 'assistant',
			text: 'Two retries on the events table, both recovered on their own.'
		},
		{ id: 5, role: 'user', text: 'Great' },
		{ id: 6, role: 'user', text: 'Can you draft a note for the team?' },
		{
			id: 7,
			role: 'assistant',
			text: 'Here is a draft: "The overnight migration finished cleanly. All tables moved and counts match."'
		}
	]);
	let typing = $state(false);
	let draft = $state('');

	const replies = [
		'Done. I posted it in the release channel and tagged the on-call engineer.',
		'Sure. I will keep an eye on the events table tonight and flag anything unusual.',
		'Good call. I added the retry details to the runbook so the next migration has them.'
	];
	let nextId = messages.length;
	let nextReply = 0;
	let timers: ReturnType<typeof setTimeout>[] = [];

	function send(text: string) {
		messages.push({ id: nextId++, role: 'user', text });
		typing = false;
		// A burst of messages gets one reply, timed from the last of them.
		timers.forEach(clearTimeout);
		timers = [
			setTimeout(() => (typing = true), 500),
			setTimeout(() => {
				typing = false;
				const reply = replies[nextReply++ % replies.length];
				messages.push({ id: nextId++, role: 'assistant', text: reply, stream: true });
			}, 1700)
		];
	}

	$effect(() => () => timers.forEach(clearTimeout));
</script>

<div class="bg-card flex h-[30rem] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-md">
	<div class="flex items-center gap-3 px-4 pt-4 pb-2">
		<VoiceOrb
			state={typing ? 'thinking' : 'idle'}
			size={32}
			role="presentation"
			aria-hidden="true"
		/>
		<div class="min-w-0">
			<p class="truncate text-sm font-semibold tracking-tight">Ops assistant</p>
			<p class="text-muted-foreground truncate text-xs">{typing ? 'Typing' : 'Online'}</p>
		</div>
	</div>

	<Conversation
		label="Conversation with Ops assistant"
		typingLabel="Ops assistant is typing"
		{typing}
		class="flex-1"
	>
		{#each messages as message, i (message.id)}
			<ConversationMessage
				role={message.role}
				grouped={messages[i - 1]?.role === message.role}
				author={message.role === 'user' ? 'You' : 'Ops assistant'}
			>
				{#if message.stream}
					<StreamingText text={message.text} speed={45} class="whitespace-normal" />
				{:else}
					{message.text}
				{/if}
			</ConversationMessage>
		{/each}
	</Conversation>

	<div class="p-2">
		<ChatInput
			bind:value={draft}
			placeholder="Message Ops assistant"
			label="Message Ops assistant"
			onSubmit={send}
		/>
	</div>
</div>
