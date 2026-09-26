<script lang="ts">
	import { StoryProgress } from '$lib/components/ui/story-progress';

	const stories = [
		{ value: '1,284', caption: 'Messages you sent your assistant in September.' },
		{ value: '42 h', caption: 'Saved on drafts, summaries, and code review.' },
		{ value: '61%', caption: 'Of your chats ran in Fast mode, your favorite.' },
		{ value: '318', caption: 'Agent runs finished without a single retry.' },
		{ value: '9 pm', caption: 'When you chat the most. Night owl.' }
	];
</script>

<StoryProgress count={stories.length} label="Your month with the assistant">
	{#snippet children(index)}
		<div class="flex h-full flex-col justify-end gap-2 p-6">
			<p class="text-muted-foreground text-sm">Your month · September</p>
			<p class="text-6xl font-semibold tracking-tight tabular-nums">{stories[index].value}</p>
			<p class="text-muted-foreground text-base text-pretty">{stories[index].caption}</p>
		</div>
	{/snippet}
</StoryProgress>
