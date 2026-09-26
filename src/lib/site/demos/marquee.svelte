<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { Button } from '$lib/components/ui/button';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Marquee } from '$lib/components/ui/marquee';

	const rows = [
		[
			'Summarize this PDF',
			'Plan a cozy weekend',
			'Explain it like I am five',
			'Draft a polite follow-up',
			'Find a bug in my query'
		],
		[
			'Suggest dinner from my fridge',
			'Turn notes into a slide outline',
			'Compare two job offers',
			'Name my side project',
			'Write a haiku about rain'
		]
	];

	let message = $state('');
	let paused = $state(false);
</script>

<div class="flex w-full max-w-xl min-w-0 flex-col gap-4">
	<div class="flex items-center justify-between gap-3">
		<p class="text-muted-foreground text-sm">Try asking</p>
		<Button
			variant="ghost"
			size="icon"
			class="size-8"
			aria-label={paused ? 'Resume suggestions' : 'Pause suggestions'}
			onclick={() => (paused = !paused)}
		>
			{#if paused}<Play class="size-3.5" />{:else}<Pause class="size-3.5" />{/if}
		</Button>
	</div>
	<div class="flex flex-col gap-1">
		{#each rows as row, i (i)}
			<Marquee direction={i ? 'right' : 'left'} gap="0.5rem" speed={28} {paused} class="py-1.5">
				{#each row as prompt (prompt)}
					<button
						type="button"
						class="bg-card hover:bg-secondary focus-visible:ring-ring rounded-full px-3.5 py-2 text-sm whitespace-nowrap shadow-xs transition-[background-color,scale] outline-none focus-visible:ring-2 active:scale-[0.98]"
						onclick={() => (message = prompt)}
					>
						{prompt}
					</button>
				{/each}
			</Marquee>
		{/each}
	</div>
	<ChatInput bind:value={message} placeholder="Ask anything" />
</div>
