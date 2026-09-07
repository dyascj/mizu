<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Square from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/ui/button';
	import { Plan, type PlanStep } from '$lib/components/ui/plan';
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { ToolCall } from '$lib/components/ui/tool-call';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';

	const steps: PlanStep[] = [
		{ label: 'Read the brief', state: 'done' },
		{ label: 'Research venues', detail: '14 sources', state: 'done' },
		{ label: 'Draft the shortlist', state: 'active' },
		{ label: 'Book the winner', state: 'pending' }
	];

	let run = $state(0);
	let paused = $state(false);
	let stopped = $state(false);
	let replayTimer: ReturnType<typeof setTimeout> | undefined;

	function replayStream() {
		if (paused || stopped || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (replayTimer) clearTimeout(replayTimer);
		replayTimer = setTimeout(() => (run += 1), 4000);
	}

	$effect(() => () => {
		if (replayTimer) clearTimeout(replayTimer);
	});
</script>

<div class="bg-card mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl p-6 shadow-md">
	<header
		class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
	>
		<VoiceOrb state={paused || stopped ? 'idle' : 'thinking'} size={36} />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold">
				{stopped ? 'Run stopped' : paused ? 'Run paused' : 'Era is working'}
			</p>
			<p class="text-muted-foreground text-xs">Venue shortlist for the offsite</p>
		</div>
		<div class="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
			<Button
				variant="ghost"
				size="icon"
				aria-label={paused ? 'Resume run' : 'Pause run'}
				disabled={stopped}
				onclick={() => {
					paused = !paused;
					clearTimeout(replayTimer);
				}}
			>
				<Pause class="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Stop run"
				disabled={stopped}
				onclick={() => {
					stopped = true;
					clearTimeout(replayTimer);
				}}
			>
				<Square class="size-4" />
			</Button>
		</div>
	</header>

	<Plan {steps} />

	{#if paused}<p role="status" class="text-muted-foreground text-sm">
			Comparison paused
		</p>{:else}<ToolCall
			name={stopped ? 'Comparison stopped' : 'Comparing availability'}
			detail="3 venues, Oct 12 to 14"
			state={stopped ? 'error' : 'running'}
		/>{/if}

	<div class="bg-secondary/60 rounded-2xl px-4 py-3 text-sm leading-relaxed">
		{#key run}
			<StreamingText
				paused={paused || stopped}
				text="Front-runner so far: the boathouse on the east shore. Fits twenty, has the quiet morning light you asked for, and comes in under budget with room for the dinner."
				speed={75}
				onComplete={replayStream}
			/>
		{/key}
	</div>
</div>
