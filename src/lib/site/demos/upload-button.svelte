<script lang="ts">
	import { UploadButton, type UploadStatus } from '$lib/components/ui/upload-button';
	import FileText from '@lucide/svelte/icons/file-text';

	let status = $state<UploadStatus>('idle');
	let progress = $state(0);
	let uploaded = $state(false);
	let timers: ReturnType<typeof setTimeout>[] = [];

	// A quick start, a stall near the middle, then a fast finish: roughly how a
	// real upload looks. [ms from start, progress]
	const steps: [number, number][] = [
		[120, 0.12],
		[260, 0.27],
		[420, 0.41],
		[580, 0.5],
		[1200, 0.54],
		[1500, 0.61],
		[1720, 0.74],
		[1900, 0.83],
		[2120, 0.92],
		[2450, 1]
	];

	function clear() {
		timers.forEach(clearTimeout);
		timers = [];
	}

	$effect(() => clear);

	function start() {
		clear();
		progress = 0;
		status = 'uploading';
		for (const [at, value] of steps) {
			timers.push(
				setTimeout(() => {
					progress = value;
					if (value === 1) {
						status = 'done';
						uploaded = true;
					}
				}, at)
			);
		}
	}

	function cancel() {
		clear();
		status = 'idle';
	}
</script>

<div class="bg-card flex w-full max-w-sm items-center gap-3 rounded-2xl p-4 shadow-sm">
	<span
		class="bg-secondary text-muted-foreground hidden size-10 shrink-0 place-items-center rounded-full sm:grid"
	>
		<FileText class="size-4" />
	</span>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">refund-policy-2026.pdf</p>
		<p class="text-muted-foreground truncate text-sm">
			{uploaded ? 'In the knowledge base' : '4.2 MB · Support assistant'}
		</p>
	</div>
	<UploadButton
		{status}
		{progress}
		onStart={start}
		onCancel={cancel}
		onReset={() => (status = 'idle')}
	/>
</div>
