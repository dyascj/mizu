<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import BarChart3 from '@lucide/svelte/icons/chart-bar';
	import FileText from '@lucide/svelte/icons/file-text';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import MessageSquarePlus from '@lucide/svelte/icons/message-square-plus';
	import Moon from '@lucide/svelte/icons/moon';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import Search from '@lucide/svelte/icons/search';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Cpu from '@lucide/svelte/icons/cpu';
	import type { Component } from 'svelte';

	type Entry = { label: string; icon: Component; shortcut?: string };
	const groups: { heading: string; items: Entry[] }[] = [
		{
			heading: 'Assistant',
			items: [
				{ label: 'Summarize this thread', icon: Sparkles },
				{ label: 'Draft a reply', icon: PenLine },
				{ label: 'Explain the last answer', icon: FileText }
			]
		},
		{
			heading: 'Go to',
			items: [
				{ label: 'Chats', icon: MessageSquare, shortcut: 'G C' },
				{ label: 'Usage and billing', icon: BarChart3, shortcut: 'G U' },
				{ label: 'API keys', icon: KeyRound, shortcut: 'G K' }
			]
		},
		{
			heading: 'Actions',
			items: [
				{ label: 'New chat', icon: MessageSquarePlus, shortcut: '⌘N' },
				{ label: 'Switch model', icon: Cpu },
				{ label: 'Toggle dark mode', icon: Moon }
			]
		}
	];

	let open = $state(false);
	let ran = $state<{ n: number; label: string } | null>(null);

	function run(label: string) {
		open = false;
		ran = { n: (ran?.n ?? 0) + 1, label };
	}
</script>

<div class="flex flex-col items-center gap-3">
	<button
		type="button"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = true)}
		class="bg-control text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-64 max-w-full items-center gap-2 rounded-full px-3.5 text-sm transition-[scale,color] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-colors"
	>
		<Search class="size-4 shrink-0" />
		<span class="flex-1 truncate text-left">Ask or search</span>
	</button>
	<!-- Height reserved up front, so the confirmation never shifts the trigger. -->
	<p class="text-muted-foreground h-5 text-sm" aria-live="polite">
		{#if ran}
			{#key ran.n}
				<span class="block" in:blurIn={{ duration: duration.base, blur: 4, y: 2 }}>
					Ran <span class="text-foreground">{ran.label}</span>
				</span>
			{/key}
		{/if}
	</p>
</div>

<Command.Dialog bind:open title="Command palette" description="Ask the assistant or run a command.">
	<Command.Input placeholder="Type a command or search" />
	<Command.List>
		<Command.Empty>No results</Command.Empty>
		{#each groups as group (group.heading)}
			<Command.Group heading={group.heading}>
				{#each group.items as item (item.label)}
					<Command.Item value={item.label} onSelect={() => run(item.label)}>
						<item.icon class="text-muted-foreground" />
						<Command.Match text={item.label} />
						{#if item.shortcut}
							<Command.Shortcut>{item.shortcut}</Command.Shortcut>
						{/if}
					</Command.Item>
				{/each}
			</Command.Group>
		{/each}
	</Command.List>
</Command.Dialog>
