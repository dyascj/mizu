<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import TrendUp from 'phosphor-svelte/lib/TrendUp';
	import TrendDown from 'phosphor-svelte/lib/TrendDown';
	import Users from 'phosphor-svelte/lib/Users';
	import CurrencyDollar from 'phosphor-svelte/lib/CurrencyDollar';
	import Export from 'phosphor-svelte/lib/Export';
	import ChartBar from 'phosphor-svelte/lib/ChartBar';
	import Target from 'phosphor-svelte/lib/Target';
	import DotsThree from 'phosphor-svelte/lib/DotsThree';
	import Calendar from 'phosphor-svelte/lib/Calendar';

	type Stat = {
		label: string;
		value: string;
		delta: string;
		trend: 'up' | 'down';
		progress: number;
	};

	const stats: Stat[] = [
		{ label: 'Revenue', value: '$48.2k', delta: '+12%', trend: 'up', progress: 72 },
		{ label: 'Active users', value: '2,401', delta: '+5%', trend: 'up', progress: 58 },
		{ label: 'Conversion', value: '3.4%', delta: '+0.8%', trend: 'up', progress: 41 },
		{ label: 'Churn', value: '1.2%', delta: '-0.3%', trend: 'down', progress: 18 }
	];

	// Static bar-chart data (height % per month). Tallest month is highlighted.
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const bars = [42, 55, 48, 63, 58, 71, 66, 82, 76, 90, 84, 97];
	const peakIndex = bars.indexOf(Math.max(...bars));

	type Activity = {
		name: string;
		handle: string;
		img: string;
		plan: string;
		status: 'active' | 'trial';
		mrr: string;
	};

	const activity: Activity[] = [
		{ name: 'Marina Wells', handle: 'marina', img: 'https://i.pravatar.cc/64?img=47', plan: 'Scale', status: 'active', mrr: '$1,290' },
		{ name: 'Koa Rivers', handle: 'koa', img: 'https://i.pravatar.cc/64?img=12', plan: 'Pro', status: 'active', mrr: '$420' },
		{ name: 'Delta Brooks', handle: 'delta', img: 'https://i.pravatar.cc/64?img=32', plan: 'Starter', status: 'trial', mrr: '$0' },
		{ name: 'Sage Pond', handle: 'sage', img: 'https://i.pravatar.cc/64?img=5', plan: 'Pro', status: 'active', mrr: '$420' }
	];
</script>

<div class="flex w-full flex-col gap-4">
	<!-- Header -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2.5">
			<div
				class="gradient-primary gloss relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-aqua"
			>
				<ChartBar class="relative z-10 size-5 text-white" />
			</div>
			<h2 class="font-display text-2xl font-extrabold tracking-tight">Overview</h2>
			<Badge variant="secondary" class="ml-1 gap-1.5">
				<Calendar class="size-3" /> Last 30 days
			</Badge>
		</div>
		<Button size="sm">
			<Export class="size-4" />
			Export
		</Button>
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each stats as s (s.label)}
			<Card.Root>
				<Card.Content class="flex flex-col gap-2 pt-6">
					<span class="text-xs font-bold tracking-widest text-muted-foreground uppercase">
						{s.label}
					</span>
					<div class="flex items-end justify-between gap-2">
						<span class="font-display text-3xl font-extrabold tabular-nums">{s.value}</span>
						{#if s.trend === 'up'}
							<Badge variant="success" class="gap-1"><TrendUp class="size-3" /> {s.delta}</Badge>
						{:else}
							<Badge variant="destructive" class="gap-1"><TrendDown class="size-3" /> {s.delta}</Badge>
						{/if}
					</div>
					<Progress value={s.progress} class="mt-1 h-2" />
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Chart + gauge -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Bar chart -->
		<Card.Root class="lg:col-span-2">
			<Card.Header class="flex-row items-center justify-between pb-4">
				<div class="flex items-center gap-2">
					<CurrencyDollar class="size-4 text-[color:var(--primary)]" />
					<Card.Title class="text-base">Revenue</Card.Title>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="success" class="gap-1"><TrendUp class="size-3" /> +12%</Badge>
					<Button size="icon" variant="ghost" aria-label="More" class="size-8">
						<DotsThree class="size-5" />
					</Button>
				</div>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				<div class="flex h-44 items-end justify-between gap-1.5">
					{#each bars as h, i (months[i])}
						<div class="flex h-full flex-1 flex-col items-stretch justify-end">
							<div
								class={'gloss relative w-full overflow-hidden rounded-md transition-[height] duration-500 ease-out ' +
									(i === peakIndex
										? 'gradient-primary shadow-aqua'
										: 'gradient-primary opacity-55')}
								style="height: {h}%"
							></div>
						</div>
					{/each}
				</div>
				<Separator />
				<div class="flex justify-between text-[0.65rem] font-medium text-muted-foreground tabular-nums">
					{#each months as m (m)}
						<span class="flex-1 text-center">{m}</span>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Goal gauge -->
		<Card.Root>
			<Card.Header class="flex-row items-center gap-2 pb-2">
				<Target class="size-4 text-[color:var(--primary)]" />
				<Card.Title class="text-base">Quarterly goal</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col items-center gap-4 pt-2">
				<CircularGauge value={78} size={148} showValue={false} label="of target">
					<span class="font-display text-4xl font-extrabold tabular-nums">78%</span>
				</CircularGauge>
				<div class="flex w-full items-center justify-between text-sm">
					<span class="text-muted-foreground">$312k</span>
					<span class="font-semibold tabular-nums">$400k goal</span>
				</div>
				<Progress value={78} class="h-2 w-full" />
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Recent activity table -->
	<Card.Root>
		<Card.Header class="flex-row items-center justify-between pb-2">
			<div class="flex items-center gap-2">
				<Users class="size-4 text-[color:var(--primary)]" />
				<Card.Title class="text-base">Recent activity</Card.Title>
			</div>
			<Button size="sm" variant="ghost">View all</Button>
		</Card.Header>
		<Card.Content class="pt-0 pb-2">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head>Customer</Table.Head>
						<Table.Head>Plan</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">MRR</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each activity as a (a.handle)}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-3">
									<Avatar class="size-8">
										<AvatarImage src={a.img} alt={a.name} />
										<AvatarFallback>{a.name.slice(0, 2)}</AvatarFallback>
									</Avatar>
									<div class="flex min-w-0 flex-col leading-tight">
										<span class="truncate font-semibold">{a.name}</span>
										<span class="truncate text-xs text-muted-foreground">@{a.handle}</span>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell class="font-medium">{a.plan}</Table.Cell>
							<Table.Cell>
								{#if a.status === 'active'}
									<Badge variant="success">Active</Badge>
								{:else}
									<Badge variant="warning">Trial</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right font-semibold tabular-nums">{a.mrr}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
