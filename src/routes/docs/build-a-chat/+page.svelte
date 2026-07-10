<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { getBlock } from '$lib/site/blocks';
	import { siteConfig } from '$lib/site/config';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { MessageActions } from '$lib/components/ui/message-actions';
	import { PromptSuggestions } from '$lib/components/ui/prompt-suggestions';
	import { Reasoning } from '$lib/components/ui/reasoning';
	import { Sources } from '$lib/components/ui/sources';
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { ToolCall } from '$lib/components/ui/tool-call';

	const block = getBlock('assistant-chat');
	let value = $state('');
	let run = $state(0);

	const installComponents = `npx shadcn-svelte@latest add ${siteConfig.registryBase}/chat-bubble.json ${siteConfig.registryBase}/chat-input.json ${siteConfig.registryBase}/reasoning.json ${siteConfig.registryBase}/tool-call.json ${siteConfig.registryBase}/streaming-text.json ${siteConfig.registryBase}/sources.json ${siteConfig.registryBase}/message-actions.json ${siteConfig.registryBase}/prompt-suggestions.json`;

	const stepMessages = `<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
<\/script>

<div class="flex flex-col gap-2.5">
	<ChatBubble role="user">Find somewhere quiet for dinner Saturday.</ChatBubble>
	<ChatBubble role="assistant">On it. Checking your usual spots first.</ChatBubble>
</div>`;

	const stepWork = `<script lang="ts">
	import { Reasoning } from '$lib/components/ui/reasoning';
	import { ToolCall } from '$lib/components/ui/tool-call';
<\/script>

<Reasoning summary="Thought for 4 seconds">
	Quiet matters more than fancy. Check the corner table at Verde first.
</Reasoning>

<ToolCall name="Checked Verde's availability" detail="Saturday, 7:00 PM" state="done">
	Two openings Saturday evening. The 7:00 slot holds the corner table.
</ToolCall>`;

	const stepStream = `<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { Sources } from '$lib/components/ui/sources';
	import { MessageActions } from '$lib/components/ui/message-actions';

	const reply = 'Booked for Saturday at seven. I picked the corner table you liked.';
<\/script>

<ChatBubble role="assistant" class="w-full max-w-[85%]">
	<StreamingText text={reply} speed={70} />
</ChatBubble>
<Sources items={[{ label: 'verde.rest', url: 'https://verde.rest' }]} />
<MessageActions text={reply} />`;

	const stepComposer = `<script lang="ts">
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { PromptSuggestions } from '$lib/components/ui/prompt-suggestions';

	let value = $state('');
<\/script>

<PromptSuggestions
	items={['Make it 8pm instead', 'Add it to my calendar']}
	onSelect={(p) => (value = p)}
/>
<ChatInput bind:value placeholder="Message Era..." onSubmit={(m) => send(m)} />`;
</script>

<Seo
	title="Build a chat · {siteConfig.name}"
	description="Compose Mizu's AI components into a complete assistant conversation: bubbles, visible reasoning, tool calls, a streaming reply with sources and actions, and the composer."
/>

<article class="max-w-2xl">
	<h1 class="text-3xl font-semibold">Build a chat</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		The AI components are designed to stack into one anatomy: what the user said, what the assistant
		did, and what it answered. This guide composes a complete conversation screen from eight of
		them.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">0. Install the parts</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		One command brings in everything this guide uses, dependencies included.
	</p>
	<CopyCommand command={installComponents} class="w-full" />

	<h2 class="mt-10 mb-3 text-xl font-semibold">1. Messages</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Conversations are two voices: the user on the accent, the assistant on the quiet fill. Bubbles
		animate in on arrival by default.
	</p>
	<div class="mb-3 flex flex-col gap-2.5 rounded-2xl bg-card p-6 shadow-sm" data-no-toc>
		<ChatBubble role="user" animate={false}>Find somewhere quiet for dinner Saturday.</ChatBubble>
		<ChatBubble role="assistant" animate={false}>On it. Checking your usual spots first.</ChatBubble
		>
	</div>
	<CodeBlock code={stepMessages} />

	<h2 class="mt-10 mb-3 text-xl font-semibold">2. Show the work</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Between the question and the answer lives the work. Reasoning folds the chain of thought into a
		quiet disclosure; Tool Call reports each thing the assistant actually did.
	</p>
	<div class="mb-3 flex flex-col gap-2.5 rounded-2xl bg-card p-6 shadow-sm" data-no-toc>
		<Reasoning summary="Thought for 4 seconds">
			Quiet matters more than fancy. Check the corner table at Verde first.
		</Reasoning>
		<ToolCall name="Checked Verde's availability" detail="Saturday, 7:00 PM" state="done">
			Two openings Saturday evening. The 7:00 slot holds the corner table.
		</ToolCall>
	</div>
	<CodeBlock code={stepWork} />

	<h2 class="mt-10 mb-3 text-xl font-semibold">3. The answer, streaming</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Streaming Text types the reply in token by token. Ground it with Sources and finish with Message
		Actions so every answer can be copied, rated, or regenerated.
	</p>
	<div class="mb-3 flex flex-col gap-2 rounded-2xl bg-card p-6 shadow-sm" data-no-toc>
		<ChatBubble role="assistant" animate={false} class="min-h-16 w-full max-w-[85%]">
			{#key run}
				<StreamingText
					text="Booked for Saturday at seven. I picked the corner table you liked."
					speed={70}
					onComplete={() => setTimeout(() => (run += 1), 3200)}
				/>
			{/key}
		</ChatBubble>
		<Sources class="pl-1" items={[{ label: 'verde.rest' }, { label: 'maps' }]} />
		<MessageActions text="Booked for Saturday at seven." class="pl-1" />
	</div>
	<CodeBlock code={stepStream} />

	<h2 class="mt-10 mb-3 text-xl font-semibold">4. The composer</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Prompt Suggestions invite the next message; Chat Input carries attach, voice, and send in one
		pill. Wire <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">onSubmit</code>
		to your model call and you have a working chat.
	</p>
	<div class="mb-3 flex flex-col gap-2.5 rounded-2xl bg-card p-6 shadow-sm" data-no-toc>
		<PromptSuggestions
			items={['Make it 8pm instead', 'Add it to my calendar']}
			onSelect={(p) => (value = p)}
		/>
		<ChatInput bind:value placeholder="Message Era..." />
	</div>
	<CodeBlock code={stepComposer} />

	<h2 class="mt-10 mb-3 text-xl font-semibold">5. All together</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Stacked in order inside a card, the pieces read as one screen: messages, the work, the streaming
		answer, the composer. The finished version ships as the Assistant chat block; grab the whole
		thing with one command or copy its source from the
		<a href="/blocks#assistant-chat" class="font-medium text-primary hover:underline">Blocks page</a
		>.
	</p>
	<CopyCommand
		command={`npx shadcn-svelte@latest add ${siteConfig.registryBase}/assistant-chat.json`}
		class="mb-4 w-full max-w-md"
	/>
	<div
		class="rounded-3xl bg-secondary/50 p-4 [contain-intrinsic-size:auto_36rem] [content-visibility:auto] sm:p-8"
		data-no-toc
	>
		{#if block.Component}
			{@const Block = block.Component}
			<Block />
		{/if}
	</div>
</article>
