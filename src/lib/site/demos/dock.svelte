<script lang="ts">
	import * as Dock from '$lib/components/ui/dock';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import BotIcon from '@lucide/svelte/icons/bot';
	import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
	import LibraryIcon from '@lucide/svelte/icons/library';

	const apps = [
		{ label: 'Chat', icon: MessageSquareIcon },
		{ label: 'Agents', icon: BotIcon },
		{ label: 'Voice', icon: AudioLinesIcon },
		{ label: 'Library', icon: LibraryIcon }
	];

	// Chat and Library start with their lights on; the rest launch on click.
	let running = $state<Record<string, boolean>>({ Chat: true, Library: true });
</script>

<!-- Extra top padding so the lifted, magnified tiles never clip the frame. -->
<div class="flex w-full items-end justify-center pt-20 pb-6">
	<Dock.Root>
		{#each apps as app (app.label)}
			<Dock.Item
				label={app.label}
				bind:running={() => running[app.label] ?? false, (value) => (running[app.label] = value)}
			>
				<app.icon class="size-5" />
			</Dock.Item>
		{/each}
	</Dock.Root>
</div>
