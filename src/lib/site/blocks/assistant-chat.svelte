<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { MessageActions } from '$lib/components/ui/message-actions';
	import { PromptSuggestions } from '$lib/components/ui/prompt-suggestions';
	import { Reasoning } from '$lib/components/ui/reasoning';
	import { Sources } from '$lib/components/ui/sources';
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { ToolCall } from '$lib/components/ui/tool-call';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import * as Select from '$lib/components/ui/select';

	let value = $state('');
	let run = $state(0);
	let model = $state('era-3');
	const models = [
		{ value: 'era-3', label: 'Era 3.0' },
		{ value: 'fjord-3', label: 'Fjord 3.0' },
		{ value: 'super-2', label: 'Super 2.4' }
	];

	const reply =
		'Booked for Saturday at seven. I picked the corner table you liked last time, and the walk over is fifteen minutes if you leave at a quarter to.';
</script>

<div class="mx-auto flex h-[38rem] w-full max-w-xl flex-col rounded-3xl bg-card shadow-md">
	<!-- header -->
	<header class="flex items-center gap-3 px-5 pt-5 pb-3">
		<VoiceOrb state="idle" size={36} />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold">Era</p>
			<p class="text-xs text-muted-foreground">Online now</p>
		</div>
		<Select.Root type="single" bind:value={model}>
			<Select.Trigger class="h-8 w-28 text-xs">
				{models.find((m) => m.value === model)?.label}
			</Select.Trigger>
			<Select.Content>
				{#each models as m (m.value)}
					<Select.Item value={m.value} label={m.label}>{m.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</header>

	<!-- conversation -->
	<div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-3">
		<ChatBubble role="user" animate={false}>
			Find somewhere quiet for dinner Saturday and book it.
		</ChatBubble>

		<Reasoning summary="Thought for 4 seconds" class="pl-1">
			Quiet matters more than fancy here. They loved the corner table at Verde in March, so I will
			check availability there first before widening the search.
		</Reasoning>

		<ToolCall name="Checked Verde's availability" detail="Saturday, 7:00 PM, table for two" state="done">
			Two openings Saturday evening: 7:00 and 9:15. The 7:00 slot holds the corner table.
		</ToolCall>

		<ChatBubble role="assistant" animate={false} class="min-h-16 w-full max-w-[85%]">
			{#key run}
				<StreamingText
					text={reply}
					speed={70}
					onComplete={() => setTimeout(() => (run += 1), 4200)}
				/>
			{/key}
		</ChatBubble>

		<Sources
			class="pl-1"
			items={[{ label: 'verde.rest', url: 'https://example.com' }, { label: 'maps' }]}
		/>
		<MessageActions text={reply} class="pl-1" />
	</div>

	<!-- composer -->
	<footer class="flex flex-col gap-2.5 px-5 pt-1 pb-5">
		<PromptSuggestions
			items={['Make it 8pm instead', 'Add it to my calendar', 'What should I wear?']}
		/>
		<ChatInput bind:value placeholder="Message Era..." />
	</footer>
</div>
