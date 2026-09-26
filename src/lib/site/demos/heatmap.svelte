<script lang="ts">
	import { Heatmap, type HeatmapDay } from '$lib/components/ui/heatmap';

	// A seeded year, so the server and the browser agree on every square.
	function seeded(seed: number) {
		return () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	// 53 weeks from a Sunday, ending on Saturday, September 26, 2026.
	const random = seeded(4);
	const start = Date.UTC(2025, 8, 21);
	const days: HeatmapDay[] = Array.from({ length: 53 * 7 }, (_, i) => {
		const weekend = i % 7 === 0 || i % 7 === 6;
		// Adoption grows through the year; weekends stay quiet.
		const busy = (0.25 + (i / 371) * 0.75) * (weekend ? 0.3 : 1);
		const count = random() < busy ? Math.round(random() * busy * 16) : 0;
		return { date: new Date(start + i * 86_400_000).toISOString().slice(0, 10), count };
	});
	const total = days.reduce((sum, day) => sum + day.count, 0);
</script>

<div class="flex w-fit max-w-full flex-col gap-4">
	<p class="text-muted-foreground text-sm">
		<span class="text-foreground font-semibold tabular-nums">{total.toLocaleString('en-US')}</span>
		agent runs in the last year
	</p>
	<Heatmap data={days} unit="run" locale="en-US" label="Agent runs per day, last 53 weeks" />
</div>
