<script lang="ts">
	import Heart from 'phosphor-svelte/lib/Heart';
	import Drop from 'phosphor-svelte/lib/Drop';
	import Sword from 'phosphor-svelte/lib/Sword';
	import Shield from 'phosphor-svelte/lib/Shield';
	import Sparkle from 'phosphor-svelte/lib/Sparkle';
	import Flask from 'phosphor-svelte/lib/Flask';
	import Scroll from 'phosphor-svelte/lib/Scroll';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Switch } from '$lib/components/ui/switch';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let hp = $state(78);
	let mp = $state(54);
	let bladeOn = $state(true);
	let shieldOn = $state(false);

	const party = [
		{ name: 'Suiren', role: 'Cleric', hp: 92, img: 32 },
		{ name: 'Kaito', role: 'Ranger', hp: 64, img: 13 },
		{ name: 'Nami', role: 'Bard', hp: 41, img: 45 }
	];

	const inventory = [
		{ icon: Flask, qty: 3, name: 'Tidal Elixir', rare: true },
		{ icon: Drop, qty: 9, name: 'Dewdrop', rare: false },
		{ icon: Sparkle, qty: 1, name: 'Star Pearl', rare: true },
		{ icon: Sword, qty: 1, name: 'Aqua Blade', rare: false }
	];

	const quests = [
		{ text: 'Calm the Tidewyrm', done: true },
		{ text: 'Gather 5 moon-shells', done: false },
		{ text: 'Reach the Coral Spire', done: false }
	];
</script>

<Tooltip.Provider>
	<div class="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
		<!-- Hero -->
		<section
			class="relative overflow-hidden rounded-2xl border border-[color:var(--glass-border)] glass-strong gloss p-5"
		>
			<div class="flex items-center justify-between">
				<p class="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
					水 Aqua Quest
				</p>
				<Badge class="gap-1.5"><Sparkle weight="fill" class="size-3" /> Lv 27</Badge>
			</div>

			<div class="mt-4 flex items-center gap-4">
				<div class="relative">
					<Avatar.Root class="size-16 ring-2 ring-[color:var(--primary)]">
						<Avatar.Image src="https://i.pravatar.cc/96?img=5" alt="Mizuki" />
						<Avatar.Fallback>MZ</Avatar.Fallback>
					</Avatar.Root>
					<span
						class="absolute -right-1 -bottom-1 rounded-full bg-[color:var(--primary)] px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-primary-foreground shadow-aqua"
						>27</span
					>
				</div>
				<div class="min-w-0">
					<h3 class="font-display text-lg font-extrabold">Mizuki the Tidecaller</h3>
					<p class="text-sm text-muted-foreground">Hydromancer · Order of the Spring</p>
				</div>
			</div>

			<div class="mt-4 flex flex-col gap-2.5">
				<div class="flex items-center gap-2 text-sm">
					<Heart weight="fill" class="size-4 text-[color:var(--success)]" />
					<Progress value={hp} class="grow" />
					<span class="w-14 text-right font-mono text-xs tabular-nums text-muted-foreground"
						>{hp}/120</span
					>
				</div>
				<div class="flex items-center gap-2 text-sm">
					<Drop weight="fill" class="size-4 text-[color:var(--primary)]" />
					<Progress value={mp} class="grow" />
					<span class="w-14 text-right font-mono text-xs tabular-nums text-muted-foreground"
						>{mp}/100</span
					>
				</div>
			</div>

			<div class="mt-4 grid grid-cols-3 gap-2 text-center">
				{#each [['STR', 18], ['DEX', 24], ['INT', 41]] as [stat, val] (stat)}
					<div class="rounded-xl border border-border bg-secondary/50 py-2">
						<p class="font-mono text-base font-bold tabular-nums">{val}</p>
						<p class="text-[0.65rem] tracking-wider text-muted-foreground">{stat}</p>
					</div>
				{/each}
			</div>

			<div class="mt-4 flex flex-col gap-2">
				<label class="flex items-center justify-between text-sm font-semibold">
					<span class="flex items-center gap-2"><Sword class="size-4" /> Aqua Blade</span>
					<Switch bind:checked={bladeOn} />
				</label>
				<label class="flex items-center justify-between text-sm font-semibold">
					<span class="flex items-center gap-2"><Shield class="size-4" /> Tide Shield</span>
					<Switch bind:checked={shieldOn} />
				</label>
			</div>

			<div class="mt-4 flex flex-wrap gap-2">
				<Button size="sm"><Sword class="size-4" /> Attack</Button>
				<Button size="sm" variant="secondary"><Shield class="size-4" /> Defend</Button>
				<Button size="sm" variant="outline"><Sparkle class="size-4" /> Cast</Button>
			</div>
		</section>

		<!-- Party · inventory · quests -->
		<div class="flex flex-col gap-4">
			<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
				<div class="mb-3 flex items-center justify-between">
					<h4 class="text-sm font-bold">Party</h4>
					<CircularGauge value={68} size={44} strokeWidth={6} label="XP" showValue={false} />
				</div>
				<div class="flex flex-col gap-2.5">
					{#each party as m (m.name)}
						<div class="flex items-center gap-3">
							<Avatar.Root class="size-9">
								<Avatar.Image src="https://i.pravatar.cc/64?img={m.img}" alt={m.name} />
								<Avatar.Fallback>{m.name[0]}</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0 grow">
								<div class="flex items-baseline justify-between">
									<span class="text-sm font-semibold">{m.name}</span>
									<span class="text-[0.7rem] text-muted-foreground">{m.role}</span>
								</div>
								<Progress value={m.hp} class="mt-1 h-1.5" />
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
				<h4 class="mb-3 text-sm font-bold">Inventory</h4>
				<div class="grid grid-cols-4 gap-2">
					{#each inventory as it (it.name)}
						<Tooltip.Root>
							<Tooltip.Trigger
								class="relative flex aspect-square items-center justify-center rounded-xl border border-border bg-secondary/40 shadow-bevel transition-[scale] duration-150 hover:bg-secondary active:scale-[0.95]"
							>
								{@const Icon = it.icon}
								<Icon
									class="size-5 {it.rare ? 'text-[color:var(--primary)]' : 'text-foreground'}"
								/>
								<span
									class="absolute right-1 bottom-0.5 font-mono text-[0.6rem] tabular-nums text-muted-foreground"
									>{it.qty}</span
								>
								{#if it.rare}
									<span
										class="absolute top-1 left-1 size-1.5 rounded-full bg-[color:var(--primary)]"
									></span>
								{/if}
							</Tooltip.Trigger>
							<Tooltip.Content>{it.name}{it.rare ? ' · Rare' : ''}</Tooltip.Content>
						</Tooltip.Root>
					{/each}
				</div>
			</section>

			<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
				<h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
					<Scroll class="size-4 text-[color:var(--primary)]" /> Quest log
				</h4>
				<div class="flex flex-col gap-2">
					{#each quests as q (q.text)}
						<label
							class="flex items-center gap-2.5 text-sm {q.done
								? 'text-muted-foreground line-through'
								: 'text-foreground'}"
						>
							<Checkbox checked={q.done} />
							{q.text}
						</label>
					{/each}
				</div>
				<div class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
					<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
					open spellbook
				</div>
			</section>
		</div>
	</div>
</Tooltip.Provider>
