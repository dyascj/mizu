<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import PaperPlaneTilt from 'phosphor-svelte/lib/PaperPlaneTilt';
	import Phone from 'phosphor-svelte/lib/Phone';
	import VideoCamera from 'phosphor-svelte/lib/VideoCamera';
	import Paperclip from 'phosphor-svelte/lib/Paperclip';
	import Smiley from 'phosphor-svelte/lib/Smiley';
	import Checks from 'phosphor-svelte/lib/Checks';

	type Conversation = {
		name: string;
		img: string;
		preview: string;
		time: string;
		online: boolean;
		active?: boolean;
		unread?: number;
	};

	const conversations: Conversation[] = [
		{
			name: 'Maya Okafor',
			img: 'https://i.pravatar.cc/96?img=47',
			preview: 'Pushed the new bubble sheen — take a look 🫧',
			time: '9:41',
			online: true,
			active: true
		},
		{
			name: 'Design Guild',
			img: 'https://i.pravatar.cc/96?img=15',
			preview: 'Theo: shipping the dark mode pass today',
			time: '9:12',
			online: true,
			unread: 3
		},
		{
			name: 'Leo Tanaka',
			img: 'https://i.pravatar.cc/96?img=33',
			preview: 'Sounds good, let’s sync after standup',
			time: 'Yesterday',
			online: false
		},
		{
			name: 'Priya Nair',
			img: 'https://i.pravatar.cc/96?img=5',
			preview: 'The gradient tokens look 🔥 in the demo',
			time: 'Mon',
			online: true
		}
	];

	type Message = {
		from: 'them' | 'me';
		text: string;
		time: string;
		read?: boolean;
	};

	const messages: Message[] = [
		{ from: 'them', text: 'Morning! Did the new component registry land yet?', time: '9:32' },
		{
			from: 'me',
			text: 'Yep — merged it last night. The whole showcase pulls from it now.',
			time: '9:34',
			read: true
		},
		{
			from: 'them',
			text: 'Amazing. The glass cards feel so much more alive with the gloss sheen on top 🫧',
			time: '9:36'
		},
		{
			from: 'me',
			text: 'Right? I tuned the highlight so it only sits on raised surfaces. Keeps text readable.',
			time: '9:38',
			read: true
		},
		{
			from: 'them',
			text: 'Pushed the new bubble sheen — take a look when you get a sec.',
			time: '9:41'
		},
		{
			from: 'me',
			text: 'On it now. Hopping into a call to walk through the radius system 👇',
			time: '9:42',
			read: false
		}
	];
</script>

<Card.Root class="flex h-[32rem] w-full overflow-hidden p-0">
	<!-- Conversation sidebar -->
	<aside class="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
		<div class="flex items-center justify-between px-4 pt-4 pb-3">
			<span class="font-display text-base font-extrabold">Messages</span>
			<Badge variant="secondary" class="tabular-nums">4</Badge>
		</div>
		<ScrollArea class="flex-1" viewportClass="px-2 pb-2">
			<div class="flex flex-col gap-1">
				{#each conversations as c (c.name)}
					<button
						type="button"
						class={'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-[background-color,box-shadow] duration-150 ' +
							(c.active ? 'bg-card shadow-bevel ring-1 ring-primary/40' : 'hover:bg-accent/60')}
					>
						<div class="relative shrink-0">
							<Avatar.Root class="size-10">
								<Avatar.Image src={c.img} alt={c.name} />
								<Avatar.Fallback>{c.name.slice(0, 2)}</Avatar.Fallback>
							</Avatar.Root>
							{#if c.online}
								<span
									class="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-[color:var(--success)] shadow-[0_0_6px_var(--success)]"
								></span>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<span class="truncate text-sm font-semibold">{c.name}</span>
								<span class="shrink-0 text-[11px] text-muted-foreground tabular-nums">{c.time}</span
								>
							</div>
							<div class="flex items-center justify-between gap-2">
								<span class="truncate text-xs text-muted-foreground">{c.preview}</span>
								{#if c.unread}
									<Badge
										class="size-5 shrink-0 justify-center rounded-full p-0 text-[11px] tabular-nums"
									>
										{c.unread}
									</Badge>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>
		</ScrollArea>
	</aside>

	<!-- Main chat pane -->
	<section class="flex min-w-0 flex-1 flex-col">
		<!-- Header -->
		<header class="flex items-center gap-3 px-4 py-3">
			<div class="relative shrink-0">
				<Avatar.Root class="size-10">
					<Avatar.Image src="https://i.pravatar.cc/96?img=47" alt="Maya Okafor" />
					<Avatar.Fallback>MO</Avatar.Fallback>
				</Avatar.Root>
				<span
					class="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-[color:var(--success)] shadow-[0_0_6px_var(--success)]"
				></span>
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold">Maya Okafor</p>
				<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span class="size-1.5 rounded-full bg-[color:var(--success)]"></span>
					Online
				</p>
			</div>
			<Tooltip.Provider delayDuration={200}>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} size="icon" variant="ghost" aria-label="Voice call">
								<Phone class="size-[1.15rem]" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Voice call</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} size="icon" variant="ghost" aria-label="Video call">
								<VideoCamera class="size-[1.15rem]" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Video call</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</header>

		<Separator />

		<!-- Conversation -->
		<ScrollArea class="flex-1" viewportClass="px-4 py-4">
			<div class="flex flex-col gap-3">
				{#each messages as m (m.text)}
					{#if m.from === 'them'}
						<div class="flex max-w-[78%] flex-col items-start gap-1 self-start">
							<div
								class="glass rounded-2xl rounded-bl-md border border-[color:var(--glass-border)] px-3.5 py-2.5 text-sm leading-relaxed shadow-bevel"
							>
								{m.text}
							</div>
							<span class="px-1 text-[11px] text-muted-foreground tabular-nums">{m.time}</span>
						</div>
					{:else}
						<div class="flex max-w-[78%] flex-col items-end gap-1 self-end">
							<div
								class="gradient-primary gloss relative overflow-hidden rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-aqua"
							>
								<span class="relative z-10">{m.text}</span>
							</div>
							<span
								class="flex items-center gap-1 px-1 text-[11px] text-muted-foreground tabular-nums"
							>
								{m.time}
								<Checks
									class={'size-3.5 ' +
										(m.read ? 'text-[color:var(--primary)]' : 'text-muted-foreground/60')}
								/>
							</span>
						</div>
					{/if}
				{/each}
			</div>
		</ScrollArea>

		<Separator />

		<!-- Input row -->
		<div class="flex items-center gap-2 px-3 py-3">
			<Button size="icon" variant="ghost" aria-label="Attach file">
				<Paperclip class="size-[1.15rem]" />
			</Button>
			<div class="relative flex-1">
				<Input placeholder="Message…" class="pr-10" />
				<button
					type="button"
					aria-label="Add emoji"
					class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-[background-color,color] duration-150 hover:bg-accent hover:text-foreground"
				>
					<Smiley class="size-[1.15rem]" />
				</button>
			</div>
			<Button size="icon" aria-label="Send message">
				<PaperPlaneTilt weight="fill" class="size-[1.15rem]" />
			</Button>
		</div>
	</section>
</Card.Root>
