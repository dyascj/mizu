<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import House from '@lucide/svelte/icons/house';
	import LibraryBig from '@lucide/svelte/icons/library-big';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { NetworkStatus } from '$lib/components/ui/network-status';
	import { Presence, type PresenceState } from '$lib/components/ui/presence';
	import * as TabBar from '$lib/components/ui/tab-bar';
	import { TextReveal } from '$lib/components/ui/text-reveal';
	import { Thinking } from '$lib/components/ui/thinking';

	// A phone-sized assistant app: greeting, starters, recent chats, a composer,
	// and bottom navigation. Replace the timers in `ask` with your model call.

	const tabs = [
		{ id: 'home', label: 'Home', icon: House },
		{ id: 'chats', label: 'Chats', icon: MessageCircle, badge: 2 },
		{ id: 'voice', label: 'Voice', icon: AudioLines },
		{ id: 'library', label: 'Library', icon: LibraryBig },
		{ id: 'profile', label: 'Profile', icon: CircleUser }
	];
	const starters = [
		{ title: 'Plan my week', detail: 'From my calendar and notes' },
		{ title: 'Explain a concept', detail: 'In five minutes or less' },
		{ title: 'Draft a reply', detail: 'Warm, short, and clear' }
	];
	const recent = [
		{ title: 'Kyoto in the slow season', meta: 'Travel · 2 min ago' },
		{ title: 'Launch notes, summarized', meta: 'Work · 1 hr ago' },
		{ title: 'Reply to Priya about Friday', meta: 'Email · Yesterday' }
	];

	let tab = $state('home');
	let draft = $state('');
	let question = $state<string | null>(null);
	let answer = $state<string | null>(null);
	let offline = $state(false);
	const mood = $derived<PresenceState>(
		question && !answer ? 'thinking' : answer ? 'speaking' : draft ? 'listening' : 'idle'
	);

	let timer: ReturnType<typeof setTimeout> | undefined;
	function ask(message: string) {
		question = message;
		answer = null;
		draft = '';
		clearTimeout(timer);
		timer = setTimeout(() => {
			answer =
				'Monday is for deep work, so I moved the design review to Tuesday morning. Wednesday stays open, and Friday ends at three.';
		}, 1600);
	}
	function reset() {
		clearTimeout(timer);
		question = null;
		answer = null;
	}
	$effect(() => () => clearTimeout(timer));
</script>

<div class="flex w-full justify-center">
	<div
		class="bg-background relative flex h-[44rem] w-full max-w-[24rem] flex-col overflow-hidden rounded-[2.75rem] shadow-xl dark:shadow-[0_0_0_1px_var(--border)]"
	>
		<NetworkStatus
			forceStatus={offline ? 'offline' : 'online'}
			offlineLabel="Offline. Messages will send when you reconnect."
			class="top-4"
		/>

		<div class="flex-1 overflow-y-auto px-5 pt-10 pb-4">
			{#if question}
				<button
					type="button"
					onclick={reset}
					class="text-muted-foreground hover:text-foreground -ms-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm transition-colors"
				>
					<ArrowLeft class="size-4 rtl:rotate-180" /> Home
				</button>
				<div class="mt-6 flex flex-col gap-5">
					<p
						class="bg-secondary animate-rise-in ms-auto max-w-[85%] rounded-3xl px-4 py-2.5 text-sm"
					>
						{question}
					</p>
					<div class="flex gap-3">
						<Presence state={mood} size={32} interactive={false} />
						<div class="min-w-0 flex-1 pt-1.5 text-sm leading-relaxed">
							{#if answer}
								<TextReveal text={answer} />
							{:else}
								<Thinking label="Checking your calendar" />
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-3">
					<Presence state={mood} size={44} />
					<div>
						<p class="text-muted-foreground text-sm">Good evening, Maya</p>
						<h2 class="text-xl font-semibold tracking-tight">What should we do?</h2>
					</div>
				</div>

				<div
					class="-mx-5 mt-7 flex snap-x scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-1"
				>
					{#each starters as starter, index (starter.title)}
						<button
							type="button"
							onclick={() => ask(starter.title)}
							class="bg-secondary hover:bg-accent animate-rise-in stagger flex w-40 shrink-0 snap-start flex-col justify-start rounded-3xl p-4 text-start transition-[background-color,scale] duration-(--duration-fast) active:scale-[0.97]"
							style:--index={index}
						>
							<span class="block text-sm font-medium">{starter.title}</span>
							<span class="text-muted-foreground mt-1 block text-xs leading-relaxed"
								>{starter.detail}</span
							>
						</button>
					{/each}
				</div>

				<div class="mt-8 flex items-center justify-between">
					<h3 class="text-sm font-medium">Recent</h3>
					<button
						type="button"
						onclick={() => (offline = !offline)}
						class="text-muted-foreground hover:text-foreground -me-2 min-h-11 rounded-full px-2 text-xs transition-colors"
						>{offline ? 'Go online' : 'Go offline'}</button
					>
				</div>
				<ul class="mt-2 flex flex-col">
					{#each recent as chat (chat.title)}
						<li>
							<button
								type="button"
								onclick={() => ask(chat.title)}
								class="hover:bg-secondary -mx-3 flex w-[calc(100%+1.5rem)] flex-col rounded-2xl px-3 py-3 text-start transition-colors"
							>
								<span class="truncate text-sm font-medium">{chat.title}</span>
								<span class="text-muted-foreground mt-0.5 text-xs">{chat.meta}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="px-4 pb-3">
			<ChatInput bind:value={draft} onSubmit={ask} placeholder="Ask anything" label="Message" />
		</div>
		<TabBar.Root variant="docked" label="App">
			{#each tabs as item (item.id)}
				<TabBar.Item
					label={item.label}
					icon={item.icon}
					badge={item.badge}
					active={tab === item.id}
					onclick={() => (tab = item.id)}
				/>
			{/each}
		</TabBar.Root>
	</div>
</div>
