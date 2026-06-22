<script lang="ts">
	// A shadcn-style "wall of cards": self-contained Mizu component compositions
	// in a masonry, so the landing shows real, interactive components (wearing the
	// gel + glass) instead of a generic feature grid.
	import {
		Play,
		Pause,
		SkipBack,
		SkipForward,
		Bell,
		Search,
		Droplets,
		Check
	} from '@lucide/svelte';
	import GithubLogo from 'phosphor-svelte/lib/GithubLogo';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Avatar from '$lib/components/ui/avatar';

	// Live state so the wall is actually interactive.
	let playing = $state(true);
	let scrub = $state(38);
	let volume = $state(70);
	let plan = $state('pro');
	let notif = $state({ launches: true, mentions: true, digest: false });
	let cookies = $state({ necessary: true, analytics: true, marketing: false });

	const team = [
		{ name: 'Suiren', email: 'suiren@mizu.dev', role: 'owner', img: 32 },
		{ name: 'Kaito', email: 'kaito@mizu.dev', role: 'editor', img: 13 },
		{ name: 'Nami', email: 'nami@mizu.dev', role: 'viewer', img: 45 }
	];
	const roles = [
		{ value: 'owner', label: 'Owner' },
		{ value: 'editor', label: 'Editor' },
		{ value: 'viewer', label: 'Viewer' }
	];
	const commands = [
		{ name: 'Search components', keys: ['⌘', 'K'] },
		{ name: 'Toggle theme', keys: ['⌘', 'J'] },
		{ name: 'Copy install command', keys: ['⌘', 'C'] },
		{ name: 'Go to docs', keys: ['G', 'D'] }
	];
</script>

<div class="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
	<!-- Create account -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Create your account</Card.Title>
			<Card.Description>Dive in — it takes a few seconds.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				<Label for="lc-email">Email</Label>
				<Input id="lc-email" type="email" placeholder="you@water.com" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="lc-pass">Password</Label>
				<Input id="lc-pass" type="password" placeholder="••••••••" />
			</div>
		</Card.Content>
		<Card.Footer class="flex-col gap-2">
			<Button class="w-full">Create account</Button>
			<Button variant="ghost" class="w-full">
				<GithubLogo class="size-4" />
				Continue with GitHub
			</Button>
		</Card.Footer>
	</Card.Root>

	<!-- Now playing -->
	<Card.Root class="break-inside-avoid">
		<Card.Content class="flex flex-col gap-4 pt-6">
			<div class="flex items-center gap-3">
				<div
					class="grid size-14 shrink-0 place-items-center rounded-2xl gradient-primary gloss text-2xl shadow-aqua"
				>
					🌊
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate font-display font-bold">真夜中のドライブ</p>
					<p class="truncate text-sm text-muted-foreground">Midnight Drive · Mizu</p>
				</div>
				<Badge variant="secondary">FLAC</Badge>
			</div>
			<Slider type="single" bind:value={scrub} max={100} />
			<div class="flex items-center justify-between">
				<span class="text-xs text-muted-foreground tabular-nums">1:24</span>
				<ButtonGroup.Root>
					<Button variant="secondary" size="icon" aria-label="Previous">
						<SkipBack class="size-4" />
					</Button>
					<Button
						size="icon"
						aria-label={playing ? 'Pause' : 'Play'}
						onclick={() => (playing = !playing)}
					>
						{#if playing}<Pause class="size-4" />{:else}<Play class="size-4" />{/if}
					</Button>
					<Button variant="secondary" size="icon" aria-label="Next">
						<SkipForward class="size-4" />
					</Button>
				</ButtonGroup.Root>
				<span class="text-xs text-muted-foreground tabular-nums">3:42</span>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Notifications -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Bell class="size-4 text-[color:var(--primary)]" />
				Notifications
			</Card.Title>
			<Card.Description>Choose what reaches you.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex items-center justify-between gap-4">
				<Label for="n-launches" class="font-normal">New releases</Label>
				<Switch id="n-launches" bind:checked={notif.launches} />
			</div>
			<div class="flex items-center justify-between gap-4">
				<Label for="n-mentions" class="font-normal">Mentions &amp; replies</Label>
				<Switch id="n-mentions" bind:checked={notif.mentions} />
			</div>
			<div class="flex items-center justify-between gap-4">
				<Label for="n-digest" class="font-normal">Weekly digest</Label>
				<Switch id="n-digest" bind:checked={notif.digest} />
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Choose a plan -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Choose a plan</Card.Title>
			<Card.Description>Switch or cancel any time.</Card.Description>
		</Card.Header>
		<Card.Content>
			<RadioGroup.Root bind:value={plan} class="grid gap-2.5">
				{#each [{ v: 'free', t: 'Free', p: '$0', s: 'For side projects' }, { v: 'pro', t: 'Pro', p: '$9', s: 'For indie makers' }, { v: 'team', t: 'Team', p: '$29', s: 'For studios' }] as o (o.v)}
					<Label
						for="plan-{o.v}"
						class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors {plan ===
						o.v
							? 'border-[color:var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]'
							: 'border-border'}"
					>
						<RadioGroup.Item value={o.v} id="plan-{o.v}" />
						<span class="flex-1">
							<span class="block font-semibold text-foreground">{o.t}</span>
							<span class="block text-xs text-muted-foreground">{o.s}</span>
						</span>
						<span class="font-display font-bold tabular-nums"
							>{o.p}<span class="text-xs font-normal text-muted-foreground">/mo</span></span
						>
					</Label>
				{/each}
			</RadioGroup.Root>
		</Card.Content>
		<Card.Footer>
			<Button class="w-full"
				>Upgrade to {plan === 'free' ? 'Pro' : plan.charAt(0).toUpperCase() + plan.slice(1)}</Button
			>
		</Card.Footer>
	</Card.Root>

	<!-- Team members -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Team members</Card.Title>
			<Card.Description>Invite collaborators to your tide pool.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#each team as m (m.email)}
				<div class="flex items-center gap-3">
					<Avatar.Root>
						<Avatar.Image src="https://i.pravatar.cc/80?img={m.img}" alt={m.name} />
						<Avatar.Fallback>{m.name.slice(0, 2)}</Avatar.Fallback>
					</Avatar.Root>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{m.name}</p>
						<p class="truncate text-xs text-muted-foreground">{m.email}</p>
					</div>
					<Select.Root type="single" value={m.role}>
						<Select.Trigger class="h-8 w-24 text-xs">
							{roles.find((r) => r.value === m.role)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each roles as r (r.value)}
								<Select.Item value={r.value} label={r.label}>{r.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>

	<!-- System status -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Reservoir</Card.Title>
			<Card.Description>Live system health.</Card.Description>
		</Card.Header>
		<Card.Content class="flex items-center gap-5">
			<CircularGauge value={72} label="Capacity">
				<Droplets class="size-5 text-primary" />
			</CircularGauge>
			<div class="flex flex-1 flex-col gap-3">
				<div class="flex flex-col gap-1.5">
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Flow rate</span><span class="tabular-nums">84%</span
						>
					</div>
					<Progress value={84} />
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Clarity</span><span class="tabular-nums">61%</span>
					</div>
					<Progress value={61} />
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Command menu -->
	<Card.Root class="break-inside-avoid">
		<Card.Content class="flex flex-col gap-3 pt-6">
			<div
				class="flex items-center gap-2 rounded-xl border border-input bg-card/70 px-3 py-2 shadow-pressed"
			>
				<Search class="size-4 text-muted-foreground" />
				<span class="flex-1 text-sm text-muted-foreground">Type a command…</span>
				<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
			</div>
			<div class="flex flex-col">
				{#each commands as c, i (c.name)}
					{#if i > 0}<Separator />{/if}
					<div class="flex items-center justify-between gap-3 py-2">
						<span class="text-sm">{c.name}</span>
						<KbdGroup
							>{#each c.keys as k (k)}<Kbd>{k}</Kbd>{/each}</KbdGroup
						>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Cookie settings -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Cookie settings</Card.Title>
			<Card.Description>Manage your preferences.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium">Strictly necessary</p>
					<p class="text-xs text-muted-foreground">Required for the site to work.</p>
				</div>
				<Switch checked disabled />
			</div>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium">Analytics</p>
					<p class="text-xs text-muted-foreground">Help us improve Mizu.</p>
				</div>
				<Switch bind:checked={cookies.analytics} />
			</div>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium">Marketing</p>
					<p class="text-xs text-muted-foreground">Personalized content.</p>
				</div>
				<Switch bind:checked={cookies.marketing} />
			</div>
		</Card.Content>
		<Card.Footer>
			<Button variant="secondary" class="w-full">Save preferences</Button>
		</Card.Footer>
	</Card.Root>

	<!-- Volume / quick control -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>One token, your color</Card.Title>
			<Card.Description
				>Every control recolors from <code class="font-mono text-foreground">--primary</code
				>.</Card.Description
			>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-wrap gap-2">
				<Badge>Primary</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="success"><Check class="size-3" />Live</Badge>
			</div>
			<div class="flex flex-col gap-1.5">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Volume</span><span class="tabular-nums"
						>{volume}%</span
					>
				</div>
				<Slider type="single" bind:value={volume} max={100} />
			</div>
		</Card.Content>
	</Card.Root>
</div>
