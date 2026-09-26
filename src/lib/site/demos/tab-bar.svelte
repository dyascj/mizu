<script lang="ts">
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import House from '@lucide/svelte/icons/house';
	import LibraryBig from '@lucide/svelte/icons/library-big';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import * as TabBar from '$lib/components/ui/tab-bar';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	const tabs = [
		{ id: 'home', label: 'Home', icon: House },
		{ id: 'chats', label: 'Chats', icon: MessageCircle, badge: 3 },
		{ id: 'voice', label: 'Voice', icon: AudioLines },
		{ id: 'library', label: 'Library', icon: LibraryBig },
		{ id: 'profile', label: 'Profile', icon: CircleUser }
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
		library: {
			title: 'Library',
			rows: [
				{ title: 'Saved answers', meta: '24 items' },
				{ title: 'Files and images', meta: '138 items' },
				{ title: 'Shared with you', meta: '6 items' }
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
	let showLabels = $state(true);
	const screen = $derived(screens[current]);
</script>

<div class="flex w-full flex-col items-center gap-5">
	<div
		class="bg-card relative flex h-80 w-[calc(100%+1.5rem)] max-w-[22rem] flex-col overflow-hidden rounded-[2.5rem] shadow-xl max-sm:-mx-3"
	>
		<div class="min-h-0 flex-1 px-5 pt-8">
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

		<TabBar.Root
			{variant}
			labels={showLabels ? 'visible' : 'hidden'}
			class={variant === 'floating' ? 'absolute inset-x-0 bottom-2' : undefined}
		>
			{#each tabs as tab (tab.id)}
				<TabBar.Item
					label={tab.label}
					icon={tab.icon}
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
		<div class="flex items-center gap-2">
			<Switch id="tab-bar-labels" bind:checked={showLabels} />
			<Label for="tab-bar-labels">Labels</Label>
		</div>
	</div>
</div>
