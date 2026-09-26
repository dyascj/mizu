<script lang="ts">
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { Button } from '$lib/components/ui/button';
	import { Stat } from '$lib/components/ui/stat';

	// Seeded, so the server and the browser agree on the first render.
	function seeded(seed: number) {
		return () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	const metrics = [
		{
			label: 'Tokens used',
			format: { notation: 'compact', maximumFractionDigits: 1 },
			base: 4_820_000,
			swing: 0.12,
			goodWhen: 'up'
		},
		{
			label: 'Requests',
			format: { maximumFractionDigits: 0 },
			base: 12_480,
			swing: 0.08,
			goodWhen: 'up'
		},
		{
			label: 'Eval pass rate',
			format: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
			base: 0.914,
			swing: 0.03,
			goodWhen: 'up'
		},
		{
			label: 'Latency, p50',
			format: { style: 'unit', unit: 'millisecond', maximumFractionDigits: 0 },
			base: 412,
			swing: 0.1,
			goodWhen: 'down'
		}
	] as const;
	const POINTS = 12;

	// A walk per metric. Each refresh drops the oldest day and adds a new one,
	// so the line reads as time moving on rather than a new chart.
	const start = seeded(7);
	let series = $state(
		metrics.map((m) => {
			const out: number[] = [m.base];
			for (let i = 1; i < POINTS; i++) out.unshift(out[0] * (1 + (start() - 0.5) * m.swing));
			return out;
		})
	);
	let turns = $state(0);
	const next = seeded(99);

	function refresh() {
		turns += 1;
		series = series.map((s, i) => [
			...s.slice(1),
			s[s.length - 1] * (1 + (next() - 0.45) * metrics[i].swing * 2)
		]);
	}
</script>

<div class="flex w-full max-w-[640px] flex-col gap-4">
	<div class="flex items-center justify-between gap-3">
		<div>
			<p class="font-medium">Workspace usage</p>
			<p class="text-muted-foreground text-sm">Compared with the previous day</p>
		</div>
		<Button variant="secondary" size="sm" onclick={refresh}>
			<!-- Half a turn per press, so repeated presses keep turning the same way. -->
			<RefreshCw
				aria-hidden="true"
				class="size-3.5 transition-[rotate] duration-(--duration-slow) ease-out motion-reduce:transition-none"
				style="rotate: {turns * 180}deg"
			/>
			Refresh
		</Button>
	</div>
	<div class="@container">
		<div class="grid grid-cols-2 gap-3 @min-[560px]:grid-cols-4">
			{#each metrics as metric, i (metric.label)}
				{@const s = series[i]}
				<Stat
					label={metric.label}
					value={s[s.length - 1]}
					format={metric.format}
					locale="en-US"
					trend={s[s.length - 1] / s[s.length - 2] - 1}
					goodWhen={metric.goodWhen}
					series={s}
					index={i}
				/>
			{/each}
		</div>
	</div>
	<p class="sr-only" aria-live="polite">
		{turns ? `Updated ${turns} ${turns === 1 ? 'time' : 'times'}` : ''}
	</p>
</div>
