<script lang="ts">
	import * as DynamicIsland from '$lib/components/ui/dynamic-island';
	import * as SegmentedControl from '$lib/components/ui/segmented-control';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Mic from '@lucide/svelte/icons/mic';
	import MicOff from '@lucide/svelte/icons/mic-off';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import { cn } from '$lib/utils.js';

	let activity = $state('agent');
	// Start partway in so the run and the countdown read as already going.
	let elapsed = $state(42);
	let remaining = $state(252);
	let muted = $state(false);

	$effect(() => {
		const id = setInterval(() => {
			elapsed += 1;
			remaining = remaining > 0 ? remaining - 1 : 300;
		}, 1000);
		return () => clearInterval(id);
	});

	const clock = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

	// Uneven paces and offsets, as multiples of --duration-deliberate, so the
	// bars never fall into step. `rest` is the height held under reduced motion.
	const bars = [
		{ pace: 0.93, offset: -0.21, rest: 0.55 },
		{ pace: 1.36, offset: -0.71, rest: 0.9 },
		{ pace: 1.09, offset: -0.45, rest: 0.4 },
		{ pace: 1.5, offset: -1.07, rest: 0.7 }
	];

	const iconShown =
		'scale-100 opacity-100 blur-none transition-[scale,opacity,filter] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)';
	const iconHidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

<div class="flex w-full max-w-md flex-col items-center gap-8">
	<DynamicIsland.Root {activity} paused={activity === 'voice' && muted}>
		<DynamicIsland.Activity name="idle" label="No live activity" class="w-36 justify-end">
			<!-- A faint lens, like the camera sitting in the real cutout. -->
			<span class="bg-background/15 size-3 rounded-full"></span>
		</DynamicIsland.Activity>

		<DynamicIsland.Activity
			name="agent"
			label="Research agent running, step 3 of 5"
			class="h-11 w-64 gap-2.5 px-4"
		>
			<LoaderCircle class="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
			<span class="min-w-0 flex-1 truncate font-medium">Researching</span>
			<span class="text-background/60 shrink-0 tabular-nums">3/5 · {clock(elapsed)}</span>
		</DynamicIsland.Activity>

		<DynamicIsland.Activity
			name="voice"
			shape="card"
			label="Voice session with Aria, {muted ? 'muted' : 'listening'}"
			class="h-24 w-[22rem] gap-3 px-4 sm:gap-4 sm:px-5"
		>
			<span class="orb-blue size-11 shrink-0 rounded-full"></span>
			<span class="flex min-w-0 flex-1 flex-col">
				<span class="truncate text-[0.9375rem] font-semibold tracking-tight">Aria</span>
				<span class="text-background/60 truncate">{muted ? 'Muted' : 'Listening'}</span>
			</span>
			<span aria-hidden="true" class="voice-bars flex h-5 shrink-0 items-end gap-1">
				{#each bars as bar, i (i)}
					<span
						class="bg-background h-full w-1 rounded-full"
						style:scale="1 {bar.rest}"
						style:animation-duration="calc(var(--duration-deliberate) * {bar.pace})"
						style:animation-delay="calc(var(--duration-deliberate) * {bar.offset})"
					></span>
				{/each}
			</span>
			<button
				type="button"
				aria-label="Mute"
				aria-pressed={muted}
				onclick={() => (muted = !muted)}
				class="hover:bg-background/10 focus-visible:ring-background -mr-1.5 grid size-11 shrink-0 touch-manipulation place-items-center rounded-full transition-[scale,background-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96] motion-reduce:transition-[background-color]"
			>
				<Mic class={cn('col-start-1 row-start-1 size-5', muted ? iconHidden : iconShown)} />
				<MicOff class={cn('col-start-1 row-start-1 size-5', muted ? iconShown : iconHidden)} />
			</button>
		</DynamicIsland.Activity>

		<DynamicIsland.Activity
			name="timer"
			label="Usage resets in {Math.ceil(remaining / 60)} minutes"
			class="h-11 w-60 gap-2.5 px-4"
		>
			<Hourglass class="size-4 shrink-0" />
			<span class="min-w-0 flex-1 truncate font-medium">Usage resets</span>
			<span class="shrink-0 text-[0.9375rem] font-semibold tabular-nums">{clock(remaining)}</span>
		</DynamicIsland.Activity>
	</DynamicIsland.Root>

	<SegmentedControl.Root bind:value={activity} aria-label="Live activity">
		<SegmentedControl.Item value="idle">Idle</SegmentedControl.Item>
		<SegmentedControl.Item value="agent">Agent</SegmentedControl.Item>
		<SegmentedControl.Item value="voice">Voice</SegmentedControl.Item>
		<SegmentedControl.Item value="timer">Timer</SegmentedControl.Item>
	</SegmentedControl.Root>
</div>

<style>
	/* The bars loop only while the voice session is live; the island's paused
	   state freezes them in place rather than snapping them back. */
	.voice-bars > span {
		transform-origin: bottom;
		animation: voice-bar ease-in-out infinite alternate;
	}

	@keyframes voice-bar {
		from {
			scale: 1 0.3;
		}
		to {
			scale: 1 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.voice-bars > span {
			animation: none;
		}
	}
</style>
