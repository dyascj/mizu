<script lang="ts">
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import { AudioPlayer, type AudioChapter } from '$lib/components/ui/audio-player';

	const chapters: AudioChapter[] = [
		{ start: 0, title: 'This week at a glance' },
		{ start: 94, title: 'Why the eval scores moved' },
		{ start: 262, title: 'Three customer calls, summarized' },
		{ start: 441, title: 'What to decide on Monday' }
	];
</script>

<div class="flex w-full justify-center">
	<AudioPlayer
		title="Your weekly research briefing"
		subtitle="Audio overview · 6 sources"
		duration={538}
		{chapters}
	>
		{#snippet cover()}
			<div class="aurora-iris text-foreground grid size-full place-items-center">
				<AudioLines class="size-6" aria-hidden="true" />
			</div>
		{/snippet}
	</AudioPlayer>
</div>
