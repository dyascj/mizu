<script lang="ts">
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import Brain from '@lucide/svelte/icons/brain';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import House from '@lucide/svelte/icons/house';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Scale from '@lucide/svelte/icons/scale';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Zap from '@lucide/svelte/icons/zap';
	import { Button } from '$lib/components/ui/button';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { HoldButton } from '$lib/components/ui/hold-button';
	import { Label } from '$lib/components/ui/label';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { Presence, type PresenceState } from '$lib/components/ui/presence';
	import * as SegmentedControl from '$lib/components/ui/segmented-control';
	import { Switch } from '$lib/components/ui/switch';
	import * as TabBar from '$lib/components/ui/tab-bar';
	import { TextReveal } from '$lib/components/ui/text-reveal';
	import { Thinking } from '$lib/components/ui/thinking';
	import { ToolCall } from '$lib/components/ui/tool-call';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import PlaygroundCard from './playground-card.svelte';
	import { playground } from './autoplay.svelte';

	// Presence
	const moods: PresenceState[] = ['idle', 'listening', 'thinking', 'speaking', 'happy'];
	let mood = $state<PresenceState>('idle');

	// Voice
	const voices = ['idle', 'listening', 'thinking', 'speaking'] as const;
	let voice = $state<(typeof voices)[number]>('listening');

	// Conversation
	let draft = $state('');
	let sent = $state<string | null>(null);
	let replying = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	function send(message: string) {
		sent = message;
		draft = '';
		replying = true;
		clearTimeout(timer);
		timer = setTimeout(() => {
			replying = false;
			timer = setTimeout(() => (sent = null), 3200);
		}, 1600);
	}
	$effect(() => () => clearTimeout(timer));

	// Controls
	let memory = $state(true);
	let notify = $state(false);
	let mode = $state('balanced');
	const modes = [
		{ value: 'fast', label: 'Fast', icon: Zap },
		{ value: 'balanced', label: 'Balanced', icon: Scale },
		{ value: 'thorough', label: 'Thorough', icon: Brain }
	];
	let tokens = $state(18_420);
	let deleted = $state(false);
	let tab = $state('home');
	const tabs = [
		{ id: 'home', label: 'Home', icon: House },
		{ id: 'chats', label: 'Chats', icon: MessageCircle, badge: 2 },
		{ id: 'voice', label: 'Voice', icon: AudioLines },
		{ id: 'profile', label: 'Profile', icon: CircleUser }
	];
	let toolState = $state<'running' | 'done'>('running');

	const chip =
		'text-muted-foreground aria-pressed:bg-secondary aria-pressed:text-foreground focus-visible:ring-ring rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-(--duration-fast) outline-none focus-visible:ring-2';
</script>

<section aria-labelledby="playground-title" class="mx-auto max-w-[1376px] px-4 sm:px-6">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
		<div>
			<h2 id="playground-title" class="text-2xl font-semibold tracking-tight sm:text-3xl">
				Touch everything
			</h2>
			<p class="text-muted-foreground mt-2 max-w-md">
				Every card is a live component. Take the cursor, or let the demos play.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Label for="playground-autoplay" class="text-muted-foreground text-sm">Autoplay</Label>
			<Switch id="playground-autoplay" bind:checked={playground.autoplay} />
		</div>
	</div>

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<div class="flex flex-col gap-3 [&>*]:flex-1">
			<PlaygroundCard
				label="Presence"
				href="/docs/components/presence"
				class="min-h-[28rem]"
				steps={[
					{ target: '[data-mood="listening"]', wait: 1600 },
					{ target: '[data-mood="thinking"]', wait: 2000 },
					{ target: '[data-mood="speaking"]', wait: 1600 },
					{ target: '[data-mood="happy"]', wait: 1800 },
					{ target: '[data-mood="idle"]', wait: 1400 }
				]}
			>
				<div class="flex flex-col items-center gap-8">
					<Presence state={mood} size={140} volume={mood === 'speaking' ? 0.6 : 0.3} />
					<div
						class="bg-card flex flex-wrap justify-center gap-1 rounded-full p-1 shadow-xs"
						role="group"
						aria-label="Mood"
					>
						{#each moods as item (item)}
							<button
								type="button"
								data-mood={item}
								aria-pressed={mood === item}
								onclick={() => (mood = item)}
								class={chip}>{item}</button
							>
						{/each}
					</div>
				</div>
			</PlaygroundCard>

			<PlaygroundCard
				label="Chat input"
				href="/docs/components/chat-input"
				cursor="#ff7a59"
				steps={[
					{ target: 'input', action: 'type', text: 'Summarize the design review', wait: 300 },
					{ target: 'button[aria-label="Send"]', wait: 5600 }
				]}
			>
				<div class="flex w-full max-w-sm flex-col gap-4">
					<div class="flex min-h-28 flex-col justify-end gap-3">
						{#if sent}
							<p
								class="bg-card animate-rise-in ml-auto max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs"
							>
								{sent}
							</p>
							{#if replying}
								<Thinking label="Reading the notes" />
							{:else}
								<TextReveal
									as="p"
									class="text-sm leading-relaxed"
									text="Three decisions, two open questions, and one owner for each task."
								/>
							{/if}
						{/if}
					</div>
					<ChatInput bind:value={draft} onSubmit={send} placeholder="Ask anything" />
				</div>
			</PlaygroundCard>

			<PlaygroundCard
				label="Copy button"
				href="/docs/components/copy-button"
				cursor="#2f9bff"
				class="min-h-64"
				steps={[{ target: 'button', wait: 2600 }]}
			>
				<div
					class="bg-card flex w-full max-w-xs items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4 shadow-xs"
				>
					<code class="text-muted-foreground min-w-0 flex-1 truncate text-sm"
						>sk-live-7f3a9c21e84b4d06</code
					>
					<CopyButton value="sk-live-7f3a9c21e84b4d06" label="Copy key" />
				</div>
			</PlaygroundCard>
		</div>

		<div class="flex flex-col gap-3 [&>*]:flex-1">
			<PlaygroundCard
				label="Voice orb"
				href="/docs/components/voice-orb"
				cursor="#a36bff"
				class="min-h-[26rem]"
				steps={[
					{ target: '[data-voice="speaking"]', wait: 2400 },
					{ target: '[data-voice="thinking"]', wait: 2000 },
					{ target: '[data-voice="listening"]', wait: 2000 }
				]}
			>
				<div class="flex flex-col items-center gap-8">
					<VoiceOrb state={voice} size={152} volume={voice === 'speaking' ? 0.45 : 0.15} />
					<div
						class="bg-card flex gap-1 rounded-full p-1 shadow-xs"
						role="group"
						aria-label="Voice"
					>
						{#each voices as item (item)}
							<button
								type="button"
								data-voice={item}
								aria-pressed={voice === item}
								onclick={() => (voice = item)}
								class={chip}>{item}</button
							>
						{/each}
					</div>
				</div>
			</PlaygroundCard>

			<PlaygroundCard
				label="Segmented control"
				href="/docs/components/segmented-control"
				cursor="#20b28a"
				class="min-h-64"
				steps={[
					{ target: '[data-mode="thorough"]', wait: 1400 },
					{ target: '[data-mode="fast"]', wait: 1400 },
					{ target: '[data-mode="balanced"]', wait: 1800 }
				]}
			>
				<SegmentedControl.Root bind:value={mode} aria-label="Response mode" class="bg-card">
					{#each modes as item (item.value)}
						{@const Icon = item.icon}
						<SegmentedControl.Item value={item.value} data-mode={item.value}>
							<Icon class="size-4" />
							{item.label}
						</SegmentedControl.Item>
					{/each}
				</SegmentedControl.Root>
			</PlaygroundCard>

			<PlaygroundCard
				label="Hold button"
				href="/docs/components/hold-button"
				cursor="#ff5c7a"
				class="min-h-72"
				steps={[
					{ target: '[data-hold] button', action: 'hold', hold: 1600, wait: 2600 },
					{ target: '[data-restore]', wait: 1200 }
				]}
			>
				<div class="bg-card flex w-full max-w-xs flex-col gap-4 rounded-3xl p-5 shadow-sm">
					<div>
						<p class="text-sm font-medium">Kyoto trip itinerary</p>
						<p class="text-muted-foreground mt-0.5 text-xs">38 messages · 2 days ago</p>
					</div>
					{#if deleted}
						<div class="animate-fade-in flex items-center justify-between gap-2">
							<p class="text-muted-foreground text-sm">Conversation deleted</p>
							<Button variant="ghost" size="sm" data-restore onclick={() => (deleted = false)}
								>Undo</Button
							>
						</div>
					{:else}
						<div data-hold>
							<HoldButton size="sm" onConfirm={() => setTimeout(() => (deleted = true), 900)}
								>Hold to delete</HoldButton
							>
						</div>
					{/if}
				</div>
			</PlaygroundCard>
		</div>

		<div
			class="flex flex-col gap-3 sm:col-span-2 sm:grid sm:grid-cols-2 lg:col-span-1 lg:flex [&>*]:flex-1"
		>
			<PlaygroundCard
				label="Number ticker"
				href="/docs/components/number-ticker"
				cursor="#ffb020"
				steps={[
					{ target: '[data-run]', wait: 1300 },
					{ target: '[data-run]', wait: 1300 },
					{ target: '[data-run]', wait: 2000 }
				]}
			>
				<div class="bg-card w-full max-w-xs rounded-3xl p-5 shadow-sm">
					<p class="text-muted-foreground text-sm">Tokens today</p>
					<NumberTicker value={tokens} class="mt-1 block text-4xl font-semibold tracking-tight" />
					<Button
						variant="secondary"
						size="sm"
						class="mt-4"
						data-run
						onclick={() => (tokens += 400 + Math.round(Math.random() * 2400))}
						><Sparkles class="size-3.5" /> Run a prompt</Button
					>
				</div>
			</PlaygroundCard>

			<PlaygroundCard
				label="Tab bar"
				href="/docs/components/tab-bar"
				cursor="#626afb"
				steps={[
					{ target: '[data-tab="chats"]', wait: 1200 },
					{ target: '[data-tab="voice"]', wait: 1200 },
					{ target: '[data-tab="profile"]', wait: 1200 },
					{ target: '[data-tab="home"]', wait: 1600 }
				]}
			>
				<TabBar.Root labels="hidden" label="Demo app">
					{#each tabs as item (item.id)}
						<TabBar.Item
							label={item.label}
							icon={item.icon}
							badge={item.badge}
							active={tab === item.id}
							data-tab={item.id}
							onclick={() => (tab = item.id)}
						/>
					{/each}
				</TabBar.Root>
			</PlaygroundCard>

			<PlaygroundCard
				label="Switch"
				href="/docs/components/switch"
				cursor="#2f9bff"
				steps={[
					{ target: '#pg-notify', wait: 1200 },
					{ target: '#pg-memory', wait: 1400 },
					{ target: '#pg-memory', wait: 900 },
					{ target: '#pg-notify', wait: 1400 }
				]}
			>
				<div class="bg-card flex w-full max-w-xs flex-col gap-5 rounded-3xl p-5 shadow-sm">
					<div class="flex items-center justify-between gap-4">
						<div>
							<Label for="pg-memory">Remember context</Label>
							<p class="text-muted-foreground mt-0.5 text-xs">Pick up where you left off</p>
						</div>
						<Switch id="pg-memory" bind:checked={memory} />
					</div>
					<div class="flex items-center justify-between gap-4">
						<div>
							<Label for="pg-notify">Notify when done</Label>
							<p class="text-muted-foreground mt-0.5 text-xs">For long running tasks</p>
						</div>
						<Switch id="pg-notify" bind:checked={notify} />
					</div>
				</div>
			</PlaygroundCard>

			<PlaygroundCard
				label="Tool call"
				href="/docs/components/tool-call"
				cursor="#20b28a"
				steps={[{ target: '[data-tool]', wait: 2600 }]}
			>
				<div class="flex w-full max-w-xs flex-col gap-3">
					<ToolCall
						name={toolState === 'running' ? 'Searching the web' : 'Searched the web'}
						detail="12 sources"
						state={toolState}
					/>
					<Button
						variant="ghost"
						size="sm"
						class="w-fit"
						data-tool
						onclick={() => (toolState = toolState === 'running' ? 'done' : 'running')}
						>{toolState === 'running' ? 'Finish' : 'Run again'}</Button
					>
				</div>
			</PlaygroundCard>
		</div>
	</div>
</section>
