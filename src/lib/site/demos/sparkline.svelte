<script lang="ts">
	import { Sparkline, type SparklinePoint } from '$lib/components/ui/sparkline';

	// A seeded walk, so the server and the browser draw the same line.
	function seeded(seed: number) {
		return () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	const random = seeded(11);
	const data: SparklinePoint[] = [];
	let latency = 420;
	for (let i = 0; i < 30; i++) {
		const day = 28 + i;
		latency = Math.max(260, latency + (random() - 0.56) * 34);
		data.push({ label: day <= 31 ? `Aug ${day}` : `Sep ${day - 31}`, value: Math.round(latency) });
	}
</script>

<div class="flex w-full max-w-[520px] flex-col gap-2">
	<Sparkline {data} label="Time to first token, p50" format={(v) => `${v} ms`} />
	<p class="text-muted-foreground text-xs">Chat model · last 30 days</p>
</div>
