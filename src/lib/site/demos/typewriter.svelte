<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { Button } from '$lib/components/ui/button';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Typewriter } from '$lib/components/ui/typewriter';

	let message = $state('');
	let focused = $state(false);
	let paused = $state(false);
</script>

<div class="flex w-full max-w-lg flex-col items-center gap-6">
	<h3 class="font-display text-center text-2xl font-semibold tracking-tight">
		What can I help with?
	</h3>
	<!-- The typed prompts stand in for the placeholder, and step aside as soon
	     as the field has something in it. -->
	<div
		class="relative w-full"
		onfocusin={() => (focused = true)}
		onfocusout={() => (focused = false)}
	>
		<ChatInput bind:value={message} placeholder="" label="Message the assistant" />
		{#if !message}
			<Typewriter
				aria-hidden="true"
				prefix="Ask me to"
				words={['summarize a PDF', 'plan a weekend', 'fix my SQL', 'draft a reply']}
				paused={paused || focused}
				class="text-muted-foreground pointer-events-none absolute top-1/2 right-14 left-[1.125rem] -translate-y-1/2 overflow-hidden text-base whitespace-pre sm:text-sm"
			/>
		{/if}
	</div>
	<Button variant="ghost" size="sm" onclick={() => (paused = !paused)}>
		{#if paused}
			<Play class="size-3.5" />
			Resume examples
		{:else}
			<Pause class="size-3.5" />
			Pause examples
		{/if}
	</Button>
</div>
