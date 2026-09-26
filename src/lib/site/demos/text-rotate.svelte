<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { Button } from '$lib/components/ui/button';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { TextRotate } from '$lib/components/ui/text-rotate';

	let paused = $state(false);
</script>

<div class="flex w-full max-w-lg flex-col items-center gap-6">
	<h3 class="font-display text-center text-2xl font-semibold tracking-tight sm:text-3xl">
		What should we <TextRotate
			words={['explore', 'build', 'write', 'ship', 'learn']}
			{paused}
			class="text-muted-foreground"
		/>?
	</h3>
	<ChatInput placeholder="Ask anything" />
	<Button variant="ghost" size="sm" onclick={() => (paused = !paused)}>
		{#if paused}
			<Play class="size-3.5" />
			Resume animation
		{:else}
			<Pause class="size-3.5" />
			Pause animation
		{/if}
	</Button>
</div>
