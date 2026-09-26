<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** How many stories there are. */
		count: number;
		/** The story showing, from 0. */
		index?: number;
		/** How long each story shows before the next one, in milliseconds. */
		duration?: number;
		/**
		 * Stops the timer, as the pause button and Space do. Bind it to pause
		 * from outside, for example while a reply field has focus. Pressing and
		 * holding the card also pauses, without changing this.
		 */
		paused?: boolean;
		/** Start over after the last story. When false, the last one stays up once it runs out. */
		loop?: boolean;
		/** Called with the new index whenever the story changes. */
		onIndexChange?: (index: number) => void;
		/** Called when the last story runs out and `loop` is false. */
		onComplete?: () => void;
		/** Accessible name for the stories region. */
		label?: string;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root. Give it a height; the story fills the space under the bars. */
		class?: string;
		/**
		 * Renders a story from its index. Its text is announced when the reader
		 * moves to it, not when the timer advances on its own.
		 */
		children: Snippet<[number]>;
	};

	let {
		count,
		index = $bindable(0),
		duration = 4000,
		paused = $bindable(false),
		loop = true,
		onIndexChange,
		onComplete,
		label = 'Stories',
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	/** Shorter presses are taps that navigate; longer ones are holds that pause. */
	const HOLD_MS = 200;

	// Advancing on its own stays silent; only stories the reader moved to are announced.
	let manual = $state(false);
	let pressing = $state(false);
	let held = $state(false);
	let hidden = $state(false);
	let ended = $state(false);
	let holdTimer: ReturnType<typeof setTimeout> | undefined;
	let pointerId: number | null = null;
	const fills: (HTMLSpanElement | null)[] = [];

	/** Keeps a list of elements by index without making the list reactive. */
	function collect<T extends Element>(list: (T | null)[], index: number) {
		return (node: T) => {
			list[index] = node;
			return () => {
				if (list[index] === node) list[index] = null;
			};
		};
	}
	let timer: Animation | null = null;

	const stopped = $derived(pressing || paused || hidden || ended);
	const dimmed = $derived(held || paused);
	const shown = $derived(Math.min(Math.max(0, index), Math.max(0, count - 1)));

	function show(next: number, byReader: boolean) {
		manual = byReader;
		ended = false;
		index = next;
		onIndexChange?.(next);
	}

	function go(step: number) {
		if (count < 1) return;
		const next = shown + step;
		if (!loop && (next < 0 || next >= count)) return;
		show((next + count) % count, true);
	}

	// A compositor-driven animation on the fill is the timer itself: when it
	// finishes, the story advances, so the bar and the content never drift.
	$effect(() => {
		const i = shown;
		const length = duration;
		const fill = fills[i];
		if (!fill || typeof fill.animate !== 'function') return;
		const animation = fill.animate([{ scale: '0 1' }, { scale: '1 1' }], {
			duration: length,
			easing: 'linear',
			fill: 'forwards'
		});
		if (untrack(() => stopped)) animation.pause();
		animation.onfinish = () => {
			if (i === count - 1 && !loop) {
				ended = true;
				onComplete?.();
				return;
			}
			show((i + 1) % count, false);
		};
		timer = animation;
		return () => {
			animation.onfinish = null;
			animation.cancel();
			if (timer === animation) timer = null;
		};
	});

	// Pausing holds the running timer where it is instead of restarting it.
	$effect(() => {
		if (!timer) return;
		if (stopped) timer.pause();
		else if (timer.playState === 'paused') timer.play();
	});

	$effect(() => {
		const sync = () => (hidden = document.hidden);
		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
	});

	$effect(() => () => clearTimeout(holdTimer));

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (event.button !== 0 || pointerId !== null) return;
		pointerId = event.pointerId;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		// The fill freezes the moment you press; the dim waits until it is
		// clearly a hold, so quick taps never flicker.
		pressing = true;
		clearTimeout(holdTimer);
		holdTimer = setTimeout(() => (held = true), HOLD_MS);
	}

	function release(event: PointerEvent & { currentTarget: HTMLDivElement }, navigate: boolean) {
		if (event.pointerId !== pointerId) return;
		pointerId = null;
		clearTimeout(holdTimer);
		pressing = false;
		if (held) {
			held = false;
			return;
		}
		if (!navigate) return;
		const box = event.currentTarget.getBoundingClientRect();
		go(event.clientX < box.left + box.width / 2 ? -1 : 1);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') go(1);
		else if (event.key === 'ArrowLeft') go(-1);
		else if (event.key === ' ') {
			if (!event.repeat) paused = !paused;
		} else return;
		event.preventDefault();
	}

	// Arriving stories resolve out of a soft blur; leaving ones clear out faster.
	function story(node: Element, { leaving }: { leaving: boolean }): TransitionConfig {
		if (leaving) node.setAttribute('aria-hidden', 'true');
		const reduce = prefersReducedMotion();
		return {
			duration: leaving ? durations.fast : durations.base,
			easing: leaving ? easeIn : easeOut,
			css: (t, u) => (reduce ? `opacity: ${t}` : `opacity: ${t}; filter: blur(${u * 4}px)`)
		};
	}

	const iconShown =
		'scale-100 opacity-100 blur-none transition-[scale,opacity,filter] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)';
	const iconHidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region takes the arrow keys and Space) -->
<div
	{...restProps}
	bind:this={ref}
	role="region"
	aria-roledescription="stories"
	aria-label={label}
	tabindex="0"
	data-paused={dimmed ? '' : undefined}
	class={cn(
		'bg-card text-card-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative flex h-[30rem] w-full max-w-80 touch-manipulation flex-col overflow-hidden rounded-2xl shadow-md outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-offset-2',
		className
	)}
	{onpointerdown}
	onpointerup={(event) => release(event, true)}
	onpointercancel={(event) => release(event, false)}
	oncontextmenu={(event) => event.preventDefault()}
	{onkeydown}
>
	<div class="flex gap-1 px-3 pt-3" aria-hidden="true">
		{#each { length: count }, i (i)}
			<span class="bg-control h-[3px] flex-1 overflow-hidden rounded-full">
				<span
					{@attach collect(fills, i)}
					class="bg-primary block h-full origin-left rounded-full"
					style:scale="{i < shown ? 1 : 0} 1"
				></span>
			</span>
		{/each}
	</div>

	<div class="flex h-11 items-center justify-between px-4">
		<span class="text-muted-foreground text-xs tabular-nums">{shown + 1} / {count}</span>
		<!-- A static cue for the paused state, so the frozen bar is not the only signal. -->
		<button
			type="button"
			aria-label={paused ? 'Play stories' : 'Pause stories'}
			class="text-muted-foreground hover:text-foreground focus-visible:ring-ring relative z-10 -mr-2 grid size-10 place-items-center rounded-full transition-[scale,color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96] motion-reduce:transition-[color]"
			onpointerdown={(event) => event.stopPropagation()}
			onpointerup={(event) => event.stopPropagation()}
			onkeydown={(event) => {
				// Let Space and Enter reach the button's own click instead of toggling twice.
				if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
			}}
			onclick={() => (paused = !paused)}
		>
			<span class="grid size-4">
				<svg
					viewBox="0 0 16 16"
					fill="currentColor"
					aria-hidden="true"
					class={cn('col-start-1 row-start-1 size-4', dimmed ? iconHidden : iconShown)}
				>
					<rect x="4" y="3" width="2.5" height="10" rx="1" />
					<rect x="9.5" y="3" width="2.5" height="10" rx="1" />
				</svg>
				<svg
					viewBox="0 0 16 16"
					fill="currentColor"
					aria-hidden="true"
					class={cn('col-start-1 row-start-1 size-4', dimmed ? iconShown : iconHidden)}
				>
					<!-- Nudged right of center so the triangle looks optically centered. -->
					<path d="M5.5 3.4v9.2a.6.6 0 0 0 .9.5l7-4.6a.6.6 0 0 0 0-1L6.4 2.9a.6.6 0 0 0-.9.5Z" />
				</svg>
			</span>
		</button>
	</div>

	<!-- A persistent live region: one that mounts with its content is rarely read. -->
	<div
		aria-live={manual ? 'polite' : 'off'}
		class={cn(
			'relative grid min-h-0 flex-1 transition-[opacity] duration-(--duration-base) ease-out',
			dimmed && 'opacity-60'
		)}
	>
		{#key shown}
			<div
				class="col-start-1 row-start-1 min-h-0"
				in:story={{ leaving: false }}
				out:story={{ leaving: true }}
			>
				{#if count > 0}
					{@render children(shown)}
				{/if}
			</div>
		{/key}
	</div>

	<!-- Reachable by screen readers. Pointer taps are handled by the card, so a
	     real click (detail above 0) is ignored here to avoid a double step. -->
	<div class="absolute inset-x-0 top-[3.75rem] bottom-0 flex">
		<button
			type="button"
			tabindex="-1"
			aria-label="Previous story"
			class="flex-1 outline-none"
			onclick={(event) => event.detail === 0 && go(-1)}
		></button>
		<button
			type="button"
			tabindex="-1"
			aria-label="Next story"
			class="flex-1 outline-none"
			onclick={(event) => event.detail === 0 && go(1)}
		></button>
	</div>
</div>
