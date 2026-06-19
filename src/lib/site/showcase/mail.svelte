<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import Archive from 'phosphor-svelte/lib/Archive';
	import Trash from 'phosphor-svelte/lib/Trash';
	import ArrowBendUpLeft from 'phosphor-svelte/lib/ArrowBendUpLeft';
	import PaperPlaneTilt from 'phosphor-svelte/lib/PaperPlaneTilt';
	import Star from 'phosphor-svelte/lib/Star';
	import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
	import DotsThreeVertical from 'phosphor-svelte/lib/DotsThreeVertical';

	type Message = {
		id: string;
		name: string;
		email: string;
		img: string;
		time: string;
		subject: string;
		preview: string;
		unread: boolean;
		label?: { text: string; variant: 'primary' | 'success' | 'warning' };
		body: string[];
	};

	const messages: Message[] = [
		{
			id: 'maya',
			name: 'Maya Okonkwo',
			email: 'maya@mizu.dev',
			img: 'https://i.pravatar.cc/80?img=47',
			time: '9:41 AM',
			subject: 'Registry is live for the whole team',
			preview: 'The component registry shipped this morning. Pull the latest and let me know how the',
			unread: true,
			label: { text: 'Product', variant: 'primary' },
			body: [
				'Hey team, the component registry shipped to production this morning. You can now pull any Mizu component straight into your project with a single command, theming included.',
				'I would love a quick pass from each of you before we announce it more widely. Try installing a few components into a fresh app and note anything that feels rough.',
				'Thanks for the marathon last week. This is a milestone worth celebrating.'
			]
		},
		{
			id: 'devon',
			name: 'Devon Reyes',
			email: 'devon@mizu.dev',
			img: 'https://i.pravatar.cc/80?img=12',
			time: '8:17 AM',
			subject: 'Dark mode polish review',
			preview: 'Pushed the contrast fixes for muted text and input wells. Looks much cleaner on OLED now.',
			unread: true,
			body: [
				'Pushed the contrast fixes for muted text and the recessed input wells. Everything reads much cleaner on OLED screens now.',
				'Mind giving the settings panel a once-over when you have a minute?'
			]
		},
		{
			id: 'aria',
			name: 'Aria Lindqvist',
			email: 'aria@mizu.dev',
			img: 'https://i.pravatar.cc/80?img=32',
			time: 'Yesterday',
			subject: 'Design sync notes',
			preview: 'Recap from the sync: concentric radii everywhere, soft shadows over hard borders, and we',
			unread: false,
			label: { text: 'Design', variant: 'success' },
			body: [
				'Quick recap from the design sync: concentric radii everywhere, soft shadows over hard borders, and tabular numbers anywhere a value can change.',
				'I dropped the updated spacing scale in the shared doc.'
			]
		},
		{
			id: 'kofi',
			name: 'Kofi Mensah',
			email: 'kofi@mizu.dev',
			img: 'https://i.pravatar.cc/80?img=15',
			time: 'Yesterday',
			subject: 'Beta invites are out',
			preview: 'First wave of beta invites went out to 200 builders. Early replies are very positive.',
			unread: false,
			body: [
				'First wave of beta invites went out to 200 builders this afternoon. Early replies are very positive, lots of excitement about the theming story.',
				'I will compile the feedback into a summary by Friday.'
			]
		},
		{
			id: 'nina',
			name: 'Nina Castellano',
			email: 'nina@mizu.dev',
			img: 'https://i.pravatar.cc/80?img=5',
			time: 'Tue',
			subject: 'Docs site deploy',
			preview: 'The docs site is on the new framework now. Build times dropped by half and search is',
			unread: false,
			label: { text: 'Docs', variant: 'warning' },
			body: [
				'The docs site is running on the new framework now. Build times dropped by roughly half and search is instant.',
				'Take a look when you can and tell me if anything reads stale.'
			]
		},
		{
			id: 'theo',
			name: 'Theo Albright',
			email: 'theo@mizu.dev',
			img: 'https://i.pravatar.cc/80?img=68',
			time: 'Mon',
			subject: 'Welcome to the team',
			preview: 'Glad to have you onboard. Here is a short list of repos and channels to get you started.',
			unread: false,
			body: [
				'Glad to have you onboard. Here is a short list of repos and channels to get you started, plus a couple of intro docs.',
				'Reach out any time, no question is too small.'
			]
		}
	];

	let selectedId = $state(messages[0].id);
	const selected = $derived(messages.find((m) => m.id === selectedId) ?? messages[0]);
	let search = $state('');
	let reply = $state('');

	function initials(name: string) {
		return name
			.split(' ')
			.map((p) => p[0])
			.slice(0, 2)
			.join('');
	}
</script>

<Card.Root class="overflow-hidden">
	<div class="flex h-[32rem] max-h-[34rem] min-h-[30rem]">
		<!-- Left pane: message list -->
		<aside class="hidden w-72 shrink-0 flex-col border-r border-border sm:flex">
			<div class="flex items-center gap-2 border-b border-border px-3 py-3">
				<div class="relative flex-1">
					<MagnifyingGlass
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input bind:value={search} placeholder="Search mail" class="h-9 pl-9" />
				</div>
			</div>
			<ScrollArea.Root class="flex-1" viewportClass="px-2 py-2">
				<div class="flex flex-col gap-1">
					{#each messages as m (m.id)}
						{@const active = m.id === selectedId}
						<button
							type="button"
							onclick={() => (selectedId = m.id)}
							aria-pressed={active}
							class={'group flex w-full flex-col gap-1 rounded-lg px-2.5 py-2.5 text-left outline-none transition-[background-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring ' +
								(active ? 'bg-accent shadow-bevel ring-1 ring-primary/40' : 'hover:bg-accent/60')}
						>
							<div class="flex items-center gap-2.5">
								<Avatar class="size-8">
									<AvatarImage src={m.img} alt={m.name} />
									<AvatarFallback>{initials(m.name)}</AvatarFallback>
								</Avatar>
								<span class="min-w-0 flex-1 truncate text-sm font-semibold">{m.name}</span>
								{#if m.unread}
									<span
										class="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
										aria-label="Unread"
									></span>
								{/if}
								<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{m.time}</span>
							</div>
							<p
								class={'truncate text-sm ' +
									(m.unread ? 'font-semibold text-foreground' : 'text-foreground/90')}
							>
								{m.subject}
							</p>
							<p class="truncate text-xs text-muted-foreground">{m.preview}</p>
						</button>
					{/each}
				</div>
			</ScrollArea.Root>
		</aside>

		<!-- Right pane: opened message -->
		<section class="flex min-w-0 flex-1 flex-col">
			<!-- Header -->
			<div class="flex items-center gap-3 px-4 py-3 sm:px-5">
				<Avatar class="size-11">
					<AvatarImage src={selected.img} alt={selected.name} />
					<AvatarFallback>{initials(selected.name)}</AvatarFallback>
				</Avatar>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<p class="truncate font-semibold">{selected.name}</p>
						{#if selected.label}
							<Badge variant={selected.label.variant} class="hidden sm:inline-flex">
								{selected.label.text}
							</Badge>
						{/if}
					</div>
					<p class="truncate text-xs text-muted-foreground">{selected.email}</p>
				</div>
				<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{selected.time}</span>
				<Tooltip.Provider>
					<div class="flex items-center gap-0.5">
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="ghost" size="icon" class="size-9" aria-label="Star">
										<Star class="size-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Star</Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="ghost" size="icon" class="size-9" aria-label="Archive">
										<Archive class="size-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Archive</Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										variant="ghost"
										size="icon"
										class="size-9 hover:text-destructive"
										aria-label="Delete"
									>
										<Trash class="size-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Delete</Tooltip.Content>
						</Tooltip.Root>
						<Button
							variant="ghost"
							size="icon"
							class="hidden size-9 sm:inline-flex"
							aria-label="More"
						>
							<DotsThreeVertical class="size-4" />
						</Button>
					</div>
				</Tooltip.Provider>
			</div>

			<Separator />

			<!-- Body -->
			<ScrollArea.Root class="flex-1" viewportClass="px-4 py-4 sm:px-5">
				<h3 class="font-display text-lg font-extrabold sm:text-xl">{selected.subject}</h3>
				<div class="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
					{#each selected.body as paragraph (paragraph)}
						<p>{paragraph}</p>
					{/each}
					<p class="mt-1 text-muted-foreground">
						Best,<br />
						{selected.name.split(' ')[0]}
					</p>
				</div>
			</ScrollArea.Root>

			<!-- Reply area -->
			<div class="border-t border-border px-4 py-3 sm:px-5">
				<div class="flex items-end gap-2">
					<Textarea bind:value={reply} placeholder="Reply…" class="min-h-12 flex-1 resize-none" />
					<div class="flex flex-col gap-2">
						<Button variant="secondary" size="icon" class="size-10" aria-label="Reply">
							<ArrowBendUpLeft class="size-4" />
						</Button>
						<Button size="icon" class="size-10" aria-label="Send">
							<PaperPlaneTilt class="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</section>
	</div>
</Card.Root>
