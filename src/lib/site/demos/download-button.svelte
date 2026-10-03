<script lang="ts">
	import { DownloadButton, type DownloadStatus } from '$lib/components/ui/download-button';

	let status = $state<DownloadStatus>('idle');
	let progress = $state(0);
	let timers: ReturnType<typeof setTimeout>[] = [];

	// A quick start, a long stall around 60% while the server packs the export,
	// then a fast finish. [ms from start, progress]
	const steps: [number, number][] = [
		[150, 0.08],
		[340, 0.19],
		[560, 0.31],
		[800, 0.44],
		[1050, 0.56],
		[1300, 0.61],
		[1900, 0.64],
		[2300, 0.7],
		[2550, 0.81],
		[2780, 0.9],
		[2980, 0.96],
		[3200, 1]
	];

	function clear() {
		timers.forEach(clearTimeout);
		timers = [];
	}

	$effect(() => clear);

	function start() {
		clear();
		progress = 0;
		status = 'downloading';
		for (const [at, value] of steps) {
			timers.push(
				setTimeout(() => {
					progress = value;
					if (value === 1) status = 'done';
				}, at)
			);
		}
	}

	function cancel() {
		clear();
		status = 'idle';
	}
</script>

<div class="bg-card flex w-full max-w-md items-center gap-3 rounded-full p-1.5 ps-5 shadow-sm">
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">eval-run-0412.jsonl</p>
		<p class="text-muted-foreground truncate text-xs tabular-nums">1,200 answers · 24.8 MB</p>
	</div>
	<DownloadButton
		{status}
		{progress}
		onStart={start}
		onCancel={cancel}
		onReset={() => (status = 'idle')}
		class="shrink-0 [&>button]:w-30 sm:[&>button]:w-36"
	/>
</div>
