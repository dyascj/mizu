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
</script>

<div class="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl bg-card p-6 shadow-md">
	<header class="flex items-center gap-3">
		<VoiceOrb state="thinking" size={36} />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold">Era is working</p>
			<p class="text-xs text-muted-foreground">Venue shortlist for the offsite</p>
		</div>
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="icon" aria-label="Pause run">
				<Pause class="size-4" />
			</Button>
			<Button variant="ghost" size="icon" aria-label="Stop run">
				<Square class="size-4" />
			</Button>
		</div>
	</header>

	<Plan {steps} />

	<ToolCall name="Comparing availability" detail="3 venues, Oct 12 to 14" state="running" />

	<div class="rounded-2xl bg-secondary/60 px-4 py-3 text-sm leading-relaxed">
		{#key run}
			<StreamingText
				text="Front-runner so far: the boathouse on the east shore. Fits twenty, has the quiet morning light you asked for, and comes in under budget with room for the dinner."
				speed={75}
				onComplete={() => setTimeout(() => (run += 1), 4000)}
			/>
		{/key}
	</div>
</div>
