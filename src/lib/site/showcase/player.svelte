<script lang="ts">
	import Play from 'phosphor-svelte/lib/Play';
	import Pause from 'phosphor-svelte/lib/Pause';
	import SkipBack from 'phosphor-svelte/lib/SkipBack';
	import SkipForward from 'phosphor-svelte/lib/SkipForward';
	import Shuffle from 'phosphor-svelte/lib/Shuffle';
	import Repeat from 'phosphor-svelte/lib/Repeat';
	import SpeakerHigh from 'phosphor-svelte/lib/SpeakerHigh';
	import MusicNotes from 'phosphor-svelte/lib/MusicNotes';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Slider } from '$lib/components/ui/slider';
	import { Toggle } from '$lib/components/ui/toggle';
	import { Separator } from '$lib/components/ui/separator';
	import * as ButtonGroup from '$lib/components/ui/button-group';

	let playing = $state(true);
	let scrub = $state(38);
	let volume = $state(70);
	let shuffle = $state(true);
	let repeat = $state(false);
	let eq = $state([62, 78, 50, 84, 40]);
	const bands = ['60', '250', '1k', '4k', '12k'];

	const playlist = [
		{ title: '真夜中のドライブ', sub: 'Midnight Drive', len: '3:42', now: true },
		{ title: 'ネオン', sub: 'Neon', len: '4:08', now: false },
		{ title: '水面', sub: 'Surface', len: '2:55', now: false }
	];
</script>

<div class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
	<!-- Now playing -->
	<section
		class="relative rounded-2xl border border-[color:var(--glass-border)] glass-strong gloss p-5"
	>
		<div class="flex items-center justify-between">
			<p class="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
				波 Wave
			</p>
			<Badge variant="secondary">city-pop</Badge>
		</div>

		<div class="mt-4 flex items-center gap-4">
			<div
				class="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-primary gloss shadow-aqua"
			>
				<MusicNotes weight="fill" class="size-8 text-primary-foreground/90" />
			</div>
			<div class="min-w-0">
				<h3 class="truncate font-display text-lg font-extrabold">真夜中のドライブ</h3>
				<p class="text-sm text-muted-foreground">Midnight Drive · Aoi Mizu</p>
				<div class="mt-1.5 flex gap-1.5">
					<Badge variant="outline" class="text-[0.65rem]">vaporwave</Badge>
					<Badge variant="outline" class="text-[0.65rem]">future-funk</Badge>
				</div>
			</div>
		</div>

		<div class="mt-4">
			<Slider type="single" bind:value={scrub} max={100} />
			<div
				class="mt-1.5 flex justify-between font-mono text-[0.7rem] tabular-nums text-muted-foreground"
			>
				<span>1:24</span><span>3:42</span>
			</div>
		</div>

		<div class="mt-3 flex items-center justify-between gap-3">
			<Toggle bind:pressed={shuffle} size="sm" aria-label="Shuffle"
				><Shuffle class="size-4" /></Toggle
			>
			<ButtonGroup.Root>
				<Button variant="secondary" size="icon" aria-label="Previous"
					><SkipBack weight="fill" class="size-4" /></Button
				>
				<Button
					size="icon"
					aria-label={playing ? 'Pause' : 'Play'}
					onclick={() => (playing = !playing)}
				>
					{#if playing}<Pause weight="fill" class="size-5" />{:else}<Play
							weight="fill"
							class="size-5"
						/>{/if}
				</Button>
				<Button variant="secondary" size="icon" aria-label="Next"
					><SkipForward weight="fill" class="size-4" /></Button
				>
			</ButtonGroup.Root>
			<Toggle bind:pressed={repeat} size="sm" aria-label="Repeat"><Repeat class="size-4" /></Toggle>
		</div>

		<div class="mt-4 flex items-center gap-3">
			<SpeakerHigh class="size-4 text-muted-foreground" />
			<Slider type="single" bind:value={volume} max={100} class="grow" />
			<span class="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground"
				>{volume}</span
			>
		</div>
	</section>

	<!-- EQ + playlist -->
	<div class="flex flex-col gap-4">
		<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
			<h4 class="mb-3 text-sm font-bold">Equalizer</h4>
			<div class="flex items-end justify-between gap-2">
				{#each eq as _, i (i)}
					<div class="flex flex-col items-center gap-2">
						<div class="h-24">
							<Slider
								type="single"
								orientation="vertical"
								bind:value={eq[i]}
								max={100}
								class="h-full min-h-0"
							/>
						</div>
						<span class="font-mono text-[0.65rem] tabular-nums text-muted-foreground"
							>{bands[i]}</span
						>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
			<h4 class="mb-3 text-sm font-bold">Up next</h4>
			<div class="flex flex-col gap-1">
				{#each playlist as t, i (i)}
					<div
						class="flex items-center gap-3 rounded-xl px-2 py-2 {t.now
							? 'bg-secondary'
							: 'hover:bg-secondary/50'} transition-colors"
					>
						{#if t.now}
							<div class="eq-bars flex h-4 w-4 items-end gap-0.5">
								<span></span><span></span><span></span>
							</div>
						{:else}
							<span class="w-4 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
						{/if}
						<div class="min-w-0 grow">
							<p class="truncate text-sm font-semibold">{t.title}</p>
							<p class="truncate text-[0.7rem] text-muted-foreground">{t.sub}</p>
						</div>
						<span class="font-mono text-[0.7rem] tabular-nums text-muted-foreground">{t.len}</span>
					</div>
				{/each}
			</div>
			<Separator class="my-3" />
			<p class="text-center text-xs text-muted-foreground">12 tracks · 47 min</p>
		</section>
	</div>
</div>

<style>
	.eq-bars span {
		width: 3px;
		background: var(--primary);
		border-radius: 2px;
		animation: eq-bounce 0.9s ease-in-out infinite;
	}
	.eq-bars span:nth-child(1) {
		height: 40%;
		animation-delay: -0.2s;
	}
	.eq-bars span:nth-child(2) {
		height: 90%;
		animation-delay: -0.5s;
	}
	.eq-bars span:nth-child(3) {
		height: 60%;
	}
	@keyframes eq-bounce {
		0%,
		100% {
			transform: scaleY(0.4);
		}
		50% {
			transform: scaleY(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.eq-bars span {
			animation: none;
		}
	}
</style>
