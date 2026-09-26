<script lang="ts">
	import House from '@lucide/svelte/icons/house';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Mic from '@lucide/svelte/icons/mic';
	import User from '@lucide/svelte/icons/user';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import * as TabBar from '$lib/components/ui/tab-bar';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	const tabs = [
		{ id: 'home', label: 'Home', icon: House },
		{ id: 'chats', label: 'Chats', icon: MessageCircle, badge: 3 },
		{ id: 'voice', label: 'Voice', icon: Mic },
		{ id: 'profile', label: 'Profile', icon: User }
	];

	const screens: Record<string, { title: string; rows: { title: string; meta: string }[] }> = {
		home: {
			title: 'Good evening',
			rows: [
				{ title: 'Plan a slow weekend in Kyoto', meta: 'Travel · 2 min ago' },
				{ title: 'Summarize the launch notes', meta: 'Work · 1 hr ago' },
				{ title: 'Draft a reply to Priya', meta: 'Email · Yesterday' },
				{ title: 'Weekly grocery list', meta: 'Home · Monday' }
			]
		},
		chats: {
			title: 'Chats',
			rows: [
				{ title: 'Trip budget', meta: '3 new replies' },
				{ title: 'Hiring loop feedback', meta: '1 new reply' },
				{ title: 'Recipe for tonight', meta: 'Read' },
				{ title: 'Quarterly planning', meta: 'Read' }
			]
		},
		voice: {
			title: 'Voice',
			rows: [
				{ title: 'Morning briefing', meta: '4 min · Today' },
				{ title: 'Practice the pitch', meta: '12 min · Tuesday' },
				{ title: 'Spanish conversation', meta: '9 min · Sunday' }
			]
		},
		profile: {
			title: 'Profile',
			rows: [
				{ title: 'Personalization', meta: 'Tone, language, and voice' },
				{ title: 'Memory', meta: 'What the assistant remembers' },
				{ title: 'Data controls', meta: 'Export and delete' }
			]
		}
	};

	let current = $state('home');
	let variant = $state<'floating' | 'docked'>('floating');
	let labels = $state<'active' | 'visible' | 'hidden'>('active');
	const screen = $derived(screens[current]);
</script>

<div class="flex w-full flex-col items-center gap-5">
	<div
		class="bg-card relative flex h-80 w-[calc(100%+1.5rem)] max-w-[22rem] flex-col overflow-hidden rounded-[2.5rem] shadow-xl max-sm:-mx-3"
	>
		<!-- Each screen resolves in place, so the outgoing one never competes. -->
		{#key current}
			<div class="min-h-0 flex-1 px-5 pt-8" in:blurIn={{ duration: duration.base, blur: 4, y: 6 }}>
				<h3 class="text-xl font-semibold tracking-tight">{screen.title}</h3>
				<ul class="mt-4 flex flex-col gap-2">
					{#each screen.rows as row (row.title)}
						<li class="bg-secondary rounded-2xl px-4 py-3">
							<p class="truncate text-sm font-medium">{row.title}</p>
							<p class="text-muted-foreground mt-0.5 truncate text-xs">{row.meta}</p>
						</li>
					{/each}
				</ul>
			</div>
		{/key}

		<TabBar.Root
			{variant}
			{labels}
			class={variant === 'floating' ? 'absolute inset-x-0 bottom-2' : undefined}
		>
			{#each tabs as tab (tab.id)}
				<TabBar.Item
					label={tab.label}
					icon={tab.icon}
					fill
					badge={tab.badge}
					active={current === tab.id}
					onclick={() => (current = tab.id)}
				/>
			{/each}
		</TabBar.Root>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
		<ToggleGroup.Root
			type="single"
			aria-label="Tab bar style"
			bind:value={() => variant, (value) => value && (variant = value as typeof variant)}
		>
			<ToggleGroup.Item size="sm" value="floating">Floating</ToggleGroup.Item>
			<ToggleGroup.Item size="sm" value="docked">Docked</ToggleGroup.Item>
		</ToggleGroup.Root>
		<ToggleGroup.Root
			type="single"
			aria-label="Labels"
			bind:value={() => labels, (value) => value && (labels = value as typeof labels)}
		>
			<ToggleGroup.Item size="sm" value="active">Active</ToggleGroup.Item>
			<ToggleGroup.Item size="sm" value="visible">All</ToggleGroup.Item>
			<ToggleGroup.Item size="sm" value="hidden">None</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>
</div>
