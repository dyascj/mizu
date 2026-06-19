<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Separator } from '$lib/components/ui/separator';
	import { Bubbles } from '$lib/components/ui/bubbles';
	import { Orb } from '$lib/components/ui/orb';

	import ArrowUpRight from 'phosphor-svelte/lib/ArrowUpRight';
	import ArrowDownLeft from 'phosphor-svelte/lib/ArrowDownLeft';
	import PaperPlaneTilt from 'phosphor-svelte/lib/PaperPlaneTilt';
	import HandCoins from 'phosphor-svelte/lib/HandCoins';
	import Plus from 'phosphor-svelte/lib/Plus';
	import TrendUp from 'phosphor-svelte/lib/TrendUp';
	import TrendDown from 'phosphor-svelte/lib/TrendDown';
	import ShoppingCart from 'phosphor-svelte/lib/ShoppingCart';
	import ForkKnife from 'phosphor-svelte/lib/ForkKnife';
	import Receipt from 'phosphor-svelte/lib/Receipt';
	import Lightning from 'phosphor-svelte/lib/Lightning';
	import House from 'phosphor-svelte/lib/House';
	import type { Component } from 'svelte';

	// Weekly spend bars (deterministic, decorative). Heights are % of column.
	const bars = [42, 58, 35, 74, 50, 88, 63];
	const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

	type Txn = {
		icon: Component;
		merchant: string;
		date: string;
		amount: string;
		incoming?: boolean;
		badge?: { label: string; variant: 'success' | 'warning' };
	};

	const transactions: Txn[] = [
		{
			icon: HandCoins,
			merchant: 'Payroll · Mizu Inc',
			date: 'Jun 17',
			amount: '+$4,200.00',
			incoming: true,
			badge: { label: 'Deposit', variant: 'success' }
		},
		{ icon: ForkKnife, merchant: 'Blue Whale Cafe', date: 'Jun 16', amount: '-$18.40' },
		{ icon: ShoppingCart, merchant: 'Reef Market', date: 'Jun 15', amount: '-$96.12' },
		{
			icon: House,
			merchant: 'Tidewater Rent',
			date: 'Jun 14',
			amount: '-$1,850.00',
			badge: { label: 'Pending', variant: 'warning' }
		},
		{ icon: Lightning, merchant: 'Current Energy', date: 'Jun 13', amount: '-$74.30' }
	];
</script>

<div class="flex w-full flex-col gap-4">
	<!-- TOP: card + actions + spending overview -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- Card + quick actions -->
		<div class="flex flex-col gap-4">
			<!-- Virtual payment card -->
			<div
				class="gradient-primary gloss relative isolate flex aspect-[16/10] w-full max-w-sm flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-aqua"
			>
				<Bubbles count={9} />
				<div class="pointer-events-none absolute -top-10 -right-8 -z-10 opacity-70">
					<Orb size={150} spin={false} />
				</div>

				<div class="relative z-10 flex items-start justify-between">
					<div class="flex flex-col">
						<span class="text-[0.7rem] font-semibold tracking-widest text-white/75 uppercase">
							Total balance
						</span>
						<span class="font-display text-3xl font-extrabold tabular-nums drop-shadow-sm">
							$12,480.50
						</span>
					</div>
					<!-- EMV chip -->
					<div
						class="mt-1 h-7 w-9 shrink-0 rounded-md bg-gradient-to-br from-white/90 to-white/55 shadow-bevel ring-1 ring-white/40"
						aria-hidden="true"
					></div>
				</div>

				<div class="relative z-10 flex items-end justify-between">
					<div class="flex flex-col gap-1">
						<span class="font-mono text-base tracking-[0.18em] tabular-nums text-white/95">
							•••• 4242
						</span>
						<span class="text-sm font-semibold text-white/85">C. J. Dyas</span>
					</div>
					<span class="font-display text-sm font-bold tracking-wide text-white/80">MIZU</span>
				</div>
			</div>

			<!-- Quick actions -->
			<div class="grid grid-cols-3 gap-2.5">
				<Button class="w-full" size="sm">
					<PaperPlaneTilt class="size-4" />
					Send
				</Button>
				<Button variant="secondary" class="w-full" size="sm">
					<ArrowDownLeft class="size-4" />
					Request
				</Button>
				<Button variant="secondary" class="w-full" size="sm">
					<Plus class="size-4" />
					Top up
				</Button>
			</div>
		</div>

		<!-- Spending overview -->
		<Card.Root>
			<Card.Header class="flex-row items-center justify-between pb-3">
				<Card.Title class="text-base">Spending</Card.Title>
				<Badge variant="secondary">This week</Badge>
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex items-center gap-4">
					<CircularGauge value={68} size={108} strokeWidth={9} showValue={false} label="Budget">
						<span class="font-display text-2xl font-extrabold tabular-nums">68%</span>
					</CircularGauge>

					<div class="flex flex-1 flex-col gap-3">
						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-col">
								<span class="text-xs font-semibold text-muted-foreground">Income</span>
								<span class="font-display text-lg font-bold tabular-nums">$5,820</span>
							</div>
							<Badge variant="success" class="gap-1">
								<TrendUp class="size-3" /> +8.2%
							</Badge>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-col">
								<span class="text-xs font-semibold text-muted-foreground">Spending</span>
								<span class="font-display text-lg font-bold tabular-nums">$3,940</span>
							</div>
							<Badge variant="destructive" class="gap-1">
								<TrendDown class="size-3" /> +3.1%
							</Badge>
						</div>
					</div>
				</div>

				<!-- Weekly bar chart -->
				<div class="flex h-24 items-end justify-between gap-2 pt-1">
					{#each bars as h, i (i)}
						<div class="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
							<div
								class="gradient-primary gloss relative w-full overflow-hidden rounded-md shadow-bevel"
								style="height: {h}%;"
							></div>
							<span class="text-[0.65rem] font-semibold text-muted-foreground">{days[i]}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- BOTTOM: recent transactions -->
	<Card.Root>
		<Card.Header class="flex-row items-center justify-between pb-2">
			<Card.Title class="text-base">Recent activity</Card.Title>
			<Button variant="ghost" size="sm" class="text-[color:var(--primary)]">
				View all
				<ArrowUpRight class="size-4" />
			</Button>
		</Card.Header>
		<Card.Content class="flex flex-col gap-1.5 pt-0">
			{#each transactions as t (t.merchant)}
				<Item.Root class="border-transparent px-2 py-2 hover:bg-accent">
					<Item.Media
						class="gradient-surface gloss size-10 rounded-xl border border-border text-[color:var(--primary)]"
					>
						<t.icon class="relative z-10 size-5" />
					</Item.Media>
					<Item.Content>
						<Item.Title class="flex items-center gap-2 text-sm font-semibold">
							{t.merchant}
							{#if t.badge}
								<Badge variant={t.badge.variant}>{t.badge.label}</Badge>
							{/if}
						</Item.Title>
						<Item.Description class="text-xs tabular-nums text-muted-foreground">
							{t.date}
						</Item.Description>
					</Item.Content>
					<span
						class={'font-display text-sm font-bold tabular-nums ' +
							(t.incoming ? 'text-[color:var(--success)]' : 'text-foreground')}
					>
						{t.amount}
					</span>
				</Item.Root>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
