<script lang="ts">
	import Play from '@lucide/svelte/icons/play';
	import { Button } from '$lib/components/ui/button';
	import { Leaderboard, type LeaderboardItem } from '$lib/components/ui/leaderboard';

	// Seeded, so every visitor sees the same rounds.
	function seeded(seed: number) {
		return () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	let models = $state<LeaderboardItem[]>([
		{ id: 'aster', name: 'Aster 4 Pro', score: 1284 },
		{ id: 'nimbus', name: 'Nimbus Large', score: 1262 },
		{ id: 'kestrel', name: 'Kestrel 2', score: 1251 },
		{ id: 'orca', name: 'Orca Reasoner', score: 1237 },
		{ id: 'lumen', name: 'Lumen Flash', score: 1219 },
		{ id: 'sable', name: 'Sable Mini', score: 1203 }
	]);
	let moves = $state<Record<string, number>>({});
	let round = $state(1);
	const random = seeded(42);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const rankOf = (list: LeaderboardItem[]) =>
		Object.fromEntries(
			[...list]
				.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
				.map((item, i) => [item.id, i])
		);

	function runRound() {
		const before = rankOf(models);
		// Gains overlap the gaps between models, so most rounds reshuffle a few
		// places without turning the whole table upside down.
		const next = models.map((m) => ({ ...m, score: m.score + Math.round(random() ** 1.5 * 40) }));
		const after = rankOf(next);
		models = next;
		moves = Object.fromEntries(next.map((m) => [m.id, before[m.id] - after[m.id]]));
		round += 1;
		clearTimeout(timer);
		// Long enough to spot who moved, gone before the next round is likely.
		timer = setTimeout(() => (moves = {}), 1600);
	}

	$effect(() => () => clearTimeout(timer));

	const leader = $derived(models.reduce((a, b) => (b.score > a.score ? b : a)));
</script>

<div class="flex w-full max-w-md flex-col gap-4">
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="font-medium">Model arena</p>
			<p class="text-muted-foreground text-sm tabular-nums">Round {round} · Elo</p>
		</div>
		<Button variant="secondary" size="sm" onclick={runRound}>
			<Play class="size-3.5" />
			Run round
		</Button>
	</div>
	<Leaderboard items={models} {moves} label="Model arena standings" locale="en-US" />
	<p class="sr-only" aria-live="polite">
		{round > 1 ? `Round ${round}. ${leader.name} leads with ${leader.score} points.` : ''}
	</p>
</div>
