<script lang="ts" module>
	export type AudioChapter = {
		/** Where the chapter begins, in seconds. */
		start: number;
		/** The chapter's name. */
		title: string;
	};

	/** Seconds as a player clock, such as 4:05 or 1:02:09. */
	export function formatAudioTime(seconds: number): string {
		const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		const s = String(total % 60).padStart(2, '0');
		return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
	}

	function mulberry32(seed: number) {
		return () => {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	/**
	 * Stand-in peaks with the texture of speech: turns at different loudness,
	 * short breaths between them, a steady music bed at the top, and a real
	 * pause wherever a chapter begins. Seeded, so the server and the browser
	 * draw the same wave.
	 */
	export function speechPeaks(
		count: number,
		duration: number,
		chapters: AudioChapter[] = [],
		seed = 7
	): number[] {
		const rand = mulberry32(seed);
		const peaks: number[] = [];
		let level = 0.6;
		let run = 0;
		const breaks = new Set(
			chapters.slice(1).map((chapter) => Math.round((chapter.start / duration) * count))
		);
		for (let i = 0; i < count; i++) {
			if (i < 4) {
				peaks.push(0.72 + rand() * 0.08);
				continue;
			}
			if (breaks.has(i) || breaks.has(i + 1)) {
				peaks.push(0.08 + rand() * 0.06);
				run = 0;
				continue;
			}
			if (run <= 0) {
				if (rand() < 0.2) {
					level = 0.1 + rand() * 0.1;
					run = 1;
				} else {
					level = 0.4 + rand() * 0.55;
					run = 3 + Math.floor(rand() * 7);
				}
			}
			peaks.push(Math.min(1, level * (0.55 + rand() * 0.45)));
			run--;
		}
		return peaks;
	}
</script>

<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import { flushSync, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springPresets,
		SpringValue,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
		/** The recording's title. */
		title: string;
		/** A second line, such as the show or who recorded it. */
		subtitle?: string;
		/** The audio file. Without one, the player runs on a simulated clock. */
		src?: string;
		/** Length in seconds. Used until the audio reports its own. */
		duration: number;
		/** Chapter starts in seconds, in order. The first should start at 0. */
		chapters?: AudioChapter[];
		/** Loudness per bar from 0 to 1. Stand-in speech peaks are drawn when omitted. */
		peaks?: number[];
		/** Artwork beside the title. */
		cover?: Snippet;
		/** Classes for the card. */
		class?: string;
		/** The card element. */
		ref?: HTMLDivElement | null;
	};

	let {
		title,
		subtitle,
		src,
		duration: durationProp,
		chapters: chaptersProp,
		peaks: peaksProp,
		cover,
		class: className,
		ref = $bindable(null),
		...restProps
	}: Props = $props();

	const RATES = [1, 1.5, 2] as const;
	// Tighter while dragging, so the ink stays under the finger.
	const SCRUB = { stiffness: 0.5, damping: springPresets.snappy.damping };

	const uid = $props.id();

	let reported = $state<number>();
	const duration = $derived(Math.max(1, reported ?? durationProp));
	const chapters = $derived(chaptersProp?.length ? chaptersProp : [{ start: 0, title }]);
	const hasChapters = $derived((chaptersProp?.length ?? 0) > 1);
	const peaks = $derived(peaksProp ?? speechPeaks(112, durationProp, chaptersProp ?? []));

	function chapterAt(t: number) {
		let found = 0;
		chapters.forEach((chapter, index) => {
			if (t >= chapter.start) found = index;
		});
		return found;
	}

	const barChapter = $derived(
		peaks.map((_, i) => chapterAt(((i + 0.5) / peaks.length) * duration))
	);

	let playing = $state(false);
	let rate = $state<(typeof RATES)[number]>(1);
	let second = $state(0);
	const chapter = $derived(chapterAt(second));

	let audio = $state<HTMLAudioElement | null>(null);
	let wave = $state<HTMLDivElement | null>(null);
	/** Holds `--p`, the played share, which the ink clips and the playhead read. */
	let timeline = $state<HTMLDivElement | null>(null);
	let ghost = $state<HTMLDivElement | null>(null);
	let tip = $state<HTMLDivElement | null>(null);
	let tipTime = $state('');
	let tipLabel = $state('');

	// The clock. Simulated playback anchors to wall time, so a sleeping frame
	// loop (offscreen, background tab) catches up instead of drifting.
	let position = 0;
	let anchor = { t: 0, wall: 0 };
	let dragging = false;
	let seekingTo: number | null = null;

	// Where the ink is drawn. Playback sets it outright; seeks and scrubs ride
	// the spring, so every jump glides and a scrub that changes direction
	// keeps its momentum.
	const shown = new SpringValue(0, {
		preset: springPresets.snappy,
		onUpdate: (t) => draw(t),
		// Only the latest seek may hand the playhead back to playback.
		onRest: (t) => {
			if (seekingTo === t) seekingTo = null;
		}
	});

	function clock() {
		if (src && audio) return audio.currentTime;
		if (playing) return anchor.t + ((performance.now() - anchor.wall) / 1000) * rate;
		return position;
	}

	/** Every visual that follows the position, written straight to the page. */
	function draw(t: number) {
		const p = Math.min(Math.max(t / duration, 0), 1);
		timeline?.style.setProperty('--p', String(p));
		const whole = Math.floor(Math.min(t, duration));
		if (whole !== second) second = whole;
	}

	// Paint once the layers exist, and again whenever the duration changes.
	$effect(() => {
		if (!timeline) return;
		void duration;
		untrack(() => draw(shown.current));
	});

	function seek(t: number, spring: 'seek' | 'scrub' | 'instant' = 'seek') {
		const next = Math.min(Math.max(t, 0), duration);
		position = next;
		anchor = { t: next, wall: performance.now() };
		if (src && audio) audio.currentTime = next;
		if (spring === 'instant' || prefersReducedMotion()) {
			seekingTo = null;
			shown.set(next, { instant: true });
			return;
		}
		seekingTo = next;
		const options = spring === 'scrub' ? SCRUB : springPresets.snappy;
		shown.set(next, { preset: options });
	}

	// The playback loop: runs only while playing and on screen.
	let visible = true;
	let frame = 0;
	function loop() {
		frame = 0;
		if (!playing || !visible) return;
		let t = clock();
		if (!src && t >= duration) {
			t = duration;
			position = t;
			playing = false;
		}
		// A seek or scrub owns the playhead until its spring settles.
		if (seekingTo === null && !dragging) shown.set(t, { instant: true });
		if (playing) frame = requestAnimationFrame(loop);
	}
	function wake() {
		if (!frame && playing && visible) frame = requestAnimationFrame(loop);
	}

	$effect(() => {
		if (playing) untrack(wake);
	});

	$effect(() => {
		if (!ref || typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			wake();
		});
		observer.observe(ref);
		return () => observer.disconnect();
	});

	$effect(() => () => {
		cancelAnimationFrame(frame);
		shown.stop();
	});

	function toggle() {
		const next = !playing;
		if (next && position >= duration) position = 0;
		const t = next ? position : clock();
		position = t;
		anchor = { t, wall: performance.now() };
		playing = next;
		if (src && audio) {
			if (next) {
				audio.playbackRate = rate;
				audio.play().catch(() => (playing = false));
			} else audio.pause();
		}
	}

	function cycleRate() {
		const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
		// Re-anchor so the new speed applies from here, not from when play began.
		const t = clock();
		position = t;
		anchor = { t, wall: performance.now() };
		rate = next;
		if (audio) audio.playbackRate = next;
	}

	// Hover and scrub feedback: a ghost playhead, a time preview, and the
	// chapter under the pointer lifting out of the quiet wave.
	let hoverChapter = $state(-1);

	function showTip(x: number, t: number, label: string) {
		if (!wave || !tip) return;
		tipTime = formatAudioTime(t);
		tipLabel = hasChapters ? label : '';
		// Measure the preview with its new text before centering it.
		flushSync();
		const width = wave.offsetWidth;
		const half = tip.offsetWidth / 2;
		const cx = Math.min(Math.max(x, half), width - half);
		tip.style.insetInlineStart = `${cx}px`;
		tip.style.opacity = '1';
	}

	function hideTip() {
		if (tip) tip.style.opacity = '0';
		if (ghost) ghost.style.opacity = '0';
		hoverChapter = -1;
	}

	/** Distance from the start of the wave, which is its right edge when mirrored. */
	function timeAt(clientX: number) {
		const box = wave!.getBoundingClientRect();
		const rtl = getComputedStyle(wave!).direction === 'rtl';
		const x = Math.min(Math.max(rtl ? box.right - clientX : clientX - box.left, 0), box.width);
		return { x, t: (x / box.width) * duration };
	}

	function hover(clientX: number) {
		const { x, t } = timeAt(clientX);
		if (ghost) {
			ghost.style.insetInlineStart = `${x}px`;
			ghost.style.opacity = '1';
		}
		const index = chapterAt(t);
		hoverChapter = hasChapters ? index : -1;
		showTip(x, t, chapters[index].title);
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (event.button !== 0) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		dragging = true;
		seek(timeAt(event.clientX).t);
		hover(event.clientX);
	}

	function onpointermove(event: PointerEvent) {
		if (dragging) {
			seek(timeAt(event.clientX).t, 'scrub');
			hover(event.clientX);
		} else if (event.pointerType !== 'touch') hover(event.clientX);
	}

	function onpointerup(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		seek(timeAt(event.clientX).t, 'scrub');
		if (event.pointerType === 'touch') hideTip();
	}

	function onkeydown(event: KeyboardEvent) {
		const t = clock();
		position = t;
		// The timeline mirrors right to left, so the side arrows swap.
		const forward =
			getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -5 : 5;
		const steps: Record<string, number> = {
			ArrowRight: forward,
			ArrowUp: 5,
			ArrowLeft: -forward,
			ArrowDown: -5,
			PageUp: 30,
			PageDown: -30
		};
		const step = steps[event.key];
		if (step !== undefined) seek(t + step);
		else if (event.key === 'Home') seek(0);
		else if (event.key === 'End') seek(duration);
		else if (event.key === ' ' || event.key === 'k') toggle();
		else return;
		event.preventDefault();
	}

	function showChapter(index: number, event: FocusEvent | PointerEvent) {
		if (!wave) return;
		if (event instanceof PointerEvent && event.pointerType === 'touch') return;
		if (
			event instanceof FocusEvent &&
			!(event.currentTarget as HTMLElement).matches(':focus-visible')
		)
			return;
		const start = chapters[index].start;
		showTip((start / duration) * wave.offsetWidth, start, chapters[index].title);
		hoverChapter = index;
	}

	const segments = $derived(
		chapters.map((chapter, index) => {
			const end = chapters[index + 1]?.start ?? duration;
			return {
				left: (chapter.start / duration) * 100,
				width: ((end - chapter.start) / duration) * 100,
				last: index === chapters.length - 1
			};
		})
	);

	/** Text and icons resolve from a soft blur as they arrive. */
	function arrive(_node: Element, { y = 4 }: { y?: number } = {}): TransitionConfig {
		const lift = prefersReducedMotion() ? 0 : y;
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * lift}px`
		};
	}

	/** The old value lifts out of the flow and fades faster than the new one arrives. */
	function depart(node: Element, { y = 0 }: { y?: number } = {}): TransitionConfig {
		const element = node as HTMLElement;
		element.style.position = 'absolute';
		element.style.inset = '0';
		const lift = prefersReducedMotion() ? 0 : y;
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 2}px); translate: 0 ${u * lift}px`
		};
	}

	function iconIn(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		const spring = springs.snappy;
		return {
			duration: spring.duration,
			css: (t) =>
				`opacity: ${easeOut(t)}; scale: ${0.25 + 0.75 * spring.easing(t)}; filter: blur(${(1 - easeOut(t)) * 4}px)`
		};
	}

	function iconOut(node: Element): TransitionConfig {
		(node as HTMLElement).style.position = 'absolute';
		if (prefersReducedMotion()) return { duration: durations.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * 0.75}; filter: blur(${u * 4}px)`
		};
	}

	// Played ink: a clip from the far end, which is the left one when mirrored.
	const played =
		'[clip-path:inset(0_calc(100%_-_var(--p,0)_*_100%)_0_0)] rtl:[clip-path:inset(0_0_0_calc(100%_-_var(--p,0)_*_100%))]';

	const focusRing =
		'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card';
</script>

{#snippet bars(className: string, tint: boolean)}
	<!-- The gap is a share of the width, not a fixed 2px, so a hundred bars fit a phone. -->
	<div aria-hidden="true" class={cn('absolute inset-0 flex items-center gap-[0.45%]', className)}>
		{#each peaks as peak, i (i)}
			<span
				class={cn(
					'min-w-px flex-1 rounded-full bg-current transition-opacity duration-(--duration-fast) ease-out',
					tint &&
						(hoverChapter >= 0 && barChapter[i] === hoverChapter ? 'opacity-40' : 'opacity-20')
				)}
				style:height="max(3px, {Math.min(1, Math.max(0, peak)) * 100}%)"
			></span>
		{/each}
	</div>
{/snippet}

{#snippet track(className: string)}
	<div aria-hidden="true" class="pointer-events-none absolute inset-0">
		{#each segments as segment, i (i)}
			<span
				class={cn(
					'absolute top-2.5 h-1 rounded-full transition-[scale] duration-(--duration-fast) ease-out',
					className,
					hoverChapter === i && 'scale-y-200'
				)}
				style:inset-inline-start="{segment.left}%"
				style:width="calc({segment.width}% - {segment.last ? 0 : 3}px)"
			></span>
		{/each}
	</div>
{/snippet}

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={restProps['aria-label'] ?? title}
	data-playing={playing ? '' : undefined}
	class={cn('bg-card w-full max-w-lg rounded-2xl p-4 shadow-sm sm:p-5', className)}
>
	{#if src}
		<audio
			bind:this={audio}
			{src}
			preload="metadata"
			onloadedmetadata={(event) => {
				const reportedDuration = event.currentTarget.duration;
				if (Number.isFinite(reportedDuration)) reported = reportedDuration;
			}}
			onended={() => (playing = false)}
		></audio>
	{/if}

	<div class="flex items-center gap-4">
		{#if cover}
			<div class="size-14 shrink-0 overflow-hidden rounded-xl">{@render cover()}</div>
		{/if}
		<div class="min-w-0 flex-1">
			<p class="text-foreground truncate font-semibold tracking-tight">{title}</p>
			{#if subtitle}
				<p class="text-muted-foreground truncate text-sm">{subtitle}</p>
			{/if}
		</div>
	</div>

	{#if hasChapters}
		<div class="mt-5 flex h-5 items-center gap-2 text-sm">
			<span class="text-muted-foreground shrink-0 tabular-nums">
				<span class="sr-only">Chapter</span>
				{chapter + 1}/{chapters.length}
			</span>
			<div class="relative h-5 min-w-0 flex-1">
				{#key chapter}
					<p class="text-foreground truncate font-medium" in:arrive out:depart>
						{chapters[chapter].title}
					</p>
				{/key}
			</div>
		</div>
	{/if}

	<!-- Room above the wave for the time preview. -->
	<div bind:this={timeline} class={cn('relative', hasChapters ? 'mt-9' : 'mt-11')}>
		<div
			bind:this={tip}
			aria-hidden="true"
			class="bg-primary text-primary-foreground pointer-events-none absolute start-0 bottom-full mb-2 flex -translate-x-1/2 items-baseline gap-1.5 rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-(--duration-fast) ease-out rtl:translate-x-1/2"
		>
			<span class="font-medium tabular-nums">{tipTime}</span>
			{#if tipLabel}<span class="max-w-40 truncate opacity-70">{tipLabel}</span>{/if}
		</div>

		<div
			bind:this={wave}
			role="slider"
			tabindex="0"
			aria-label="Seek"
			aria-valuemin={0}
			aria-valuemax={Math.floor(duration)}
			aria-valuenow={second}
			aria-valuetext="{formatAudioTime(second)} of {formatAudioTime(duration)}{hasChapters
				? `, ${chapters[chapter].title}`
				: ''}"
			class={cn('relative h-14 cursor-pointer touch-none rounded-md select-none', focusRing)}
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			onpointercancel={onpointerup}
			onpointerleave={(event) => {
				if (!dragging && event.pointerType !== 'touch') hideTip();
			}}
			{onkeydown}
		>
			{@render bars('text-foreground', true)}
			<div class={cn('absolute inset-0', played)}>
				{@render bars('text-foreground', false)}
			</div>
			<div
				bind:this={ghost}
				aria-hidden="true"
				class="bg-foreground/35 pointer-events-none absolute inset-y-0 start-0 w-px opacity-0 transition-opacity duration-(--duration-fast) ease-out"
			></div>
			<div
				aria-hidden="true"
				class="bg-foreground pointer-events-none absolute -inset-y-1 start-[calc(var(--p,0)*100%)] w-0.5 -translate-x-1/2 rounded-full rtl:translate-x-1/2"
			></div>
		</div>

		{#if hasChapters}
			<!-- Chapters as a segmented track under the wave, inked by the same clip.
			     Each segment jumps to its chapter's start. -->
			<div class="relative mt-1 h-6">
				{#each chapters as item, i (i)}
					<button
						type="button"
						aria-label="Chapter {i + 1}: {item.title}, {formatAudioTime(item.start)}"
						class={cn('absolute top-0 h-6 rounded-sm', focusRing)}
						style:inset-inline-start="{segments[i].left}%"
						style:width="{segments[i].width}%"
						onclick={() => seek(item.start)}
						onpointerenter={(event) => showChapter(i, event)}
						onpointerleave={hideTip}
						onfocus={(event) => showChapter(i, event)}
						onblur={hideTip}
					></button>
				{/each}
				{@render track('bg-foreground/20')}
				<div class={cn('pointer-events-none absolute inset-0', played)}>
					{@render track('bg-foreground')}
				</div>
			</div>
		{/if}
	</div>

	<div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-2">
		<p class="text-muted-foreground text-sm tabular-nums">
			<span class="text-foreground">{formatAudioTime(second)}</span>
			<!-- Dropped on phones, where the controls need the width. -->
			<span class="max-sm:hidden"> / {formatAudioTime(duration)}</span>
		</p>
		<div class="flex items-center gap-0.5 sm:gap-1">
			<button
				type="button"
				aria-label="Back 15 seconds"
				class={cn(
					'text-muted-foreground hover:text-foreground flex h-10 touch-manipulation items-center justify-center gap-1 rounded-full px-1.5 transition-[scale,color] duration-(--duration-fast) ease-out active:scale-[0.96] sm:px-2',
					focusRing
				)}
				onclick={() => seek(clock() - 15)}
			>
				<RotateCcw aria-hidden="true" class="size-4 rtl:-scale-x-100" />
				<span aria-hidden="true" class="text-xs font-medium tabular-nums">15</span>
			</button>
			<button
				type="button"
				aria-label={playing ? 'Pause' : 'Play'}
				class={cn(
					'bg-primary text-primary-foreground hover:bg-primary-hover relative grid size-11 touch-manipulation place-items-center rounded-full shadow-sm transition-[scale,background-color] duration-(--duration-fast) ease-out active:scale-[0.96]',
					focusRing
				)}
				onclick={toggle}
			>
				{#key playing}
					<span class="grid place-items-center" in:iconIn out:iconOut>
						{#if playing}
							<Pause aria-hidden="true" class="size-4 fill-current" />
						{:else}
							<!-- Nudged right: a centered triangle looks off-center. -->
							<Play aria-hidden="true" class="size-4 translate-x-px fill-current" />
						{/if}
					</span>
				{/key}
			</button>
			<button
				type="button"
				aria-label="Forward 30 seconds"
				class={cn(
					'text-muted-foreground hover:text-foreground flex h-10 touch-manipulation items-center justify-center gap-1 rounded-full px-1.5 transition-[scale,color] duration-(--duration-fast) ease-out active:scale-[0.96] sm:px-2',
					focusRing
				)}
				onclick={() => seek(clock() + 30)}
			>
				<span aria-hidden="true" class="text-xs font-medium tabular-nums">30</span>
				<RotateCw aria-hidden="true" class="size-4 rtl:-scale-x-100" />
			</button>
		</div>
		<div class="flex justify-end">
			<button
				type="button"
				aria-label="Playback speed {rate}x"
				class={cn(
					'bg-secondary text-secondary-foreground hover:bg-control relative grid h-9 w-12 touch-manipulation place-items-center overflow-hidden rounded-full text-sm font-medium tabular-nums transition-[scale,background-color] duration-(--duration-fast) ease-out active:scale-[0.96] sm:w-14',
					focusRing
				)}
				onclick={cycleRate}
			>
				{#key rate}
					<span class="grid place-items-center" in:arrive={{ y: 10 }} out:depart={{ y: -8 }}
						>{rate}x</span
					>
				{/key}
			</button>
		</div>
	</div>
	<span id="{uid}-status" role="status" class="sr-only">
		{playing ? `Playing at ${rate}x` : 'Paused'}
	</span>
</div>
