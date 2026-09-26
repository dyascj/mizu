<script lang="ts">
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion, SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/**
		 * Loads what is new. The spinner holds until it settles. Resolve with a
		 * sentence such as "2 new runs" to announce it; otherwise `refreshedLabel`
		 * is announced. Items added at the top slide in from above.
		 */
		onRefresh: () => unknown;
		/** How far, in pixels after resistance, a pull must reach before letting go refreshes. */
		threshold?: number;
		/** Accessible name for the scrolling region. */
		label?: string;
		/**
		 * Name of the refresh button that keyboard and screen reader users get. It
		 * stays out of sight until focused.
		 */
		refreshLabel?: string;
		/** Announced after a refresh when `onRefresh` does not return its own sentence. */
		refreshedLabel?: string;
		/** Announced when `onRefresh` throws or rejects. */
		failedLabel?: string;
		/** Turns off pulling and the refresh button. */
		disabled?: boolean;
		/** True while a refresh is running. Bind to it to show your own status. */
		refreshing?: boolean;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/**
		 * Classes for the root. Give it a height. The content is painted with
		 * `--pull-to-refresh-surface`, the page background by default, so it
		 * covers the spinner until pulled; set it when the feed sits on another fill.
		 */
		class?: string;
		/** The scrolling content, such as a feed. */
		children: Snippet;
	};

	let {
		onRefresh,
		threshold = 64,
		label = 'Feed',
		refreshLabel = 'Refresh',
		refreshedLabel = 'Updated',
		failedLabel = 'Could not refresh',
		disabled = false,
		refreshing = $bindable(false),
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	/** Looser than the system scroll edge, so the threshold takes a comfortable pull. */
	const RUBBER = 0.7;
	/** Past this many pixels a mouse press becomes a pull rather than a click. */
	const DRAG_SLOP = 4;
	const TICKS = 8;

	let scroller: HTMLDivElement | null = $state(null);
	let content: HTMLDivElement | null = null;
	let indicator: HTMLDivElement | null = null;
	let spinner: HTMLDivElement | null = null;
	const ticks: (SVGLineElement | null)[] = [];

	/** Keeps a list of elements by index without making the list reactive. */
	function collect<T extends Element>(list: (T | null)[], index: number) {
		return (node: T) => {
			list[index] = node;
			return () => {
				if (list[index] === node) list[index] = null;
			};
		};
	}

	let announcement = $state('');
	let fading = $state(false);
	let pulling = $state(false);
	let busy = false;
	let destroyed = false;
	let reveal = 0;
	let dragged = false;
	let gesture: { base: number; samples: { y: number; t: number }[] } | null = null;
	let mouse: { y: number; pointerId: number } | null = null;

	// The band stiffens relative to the height of the screen it lives in.
	const dimension = () => scroller?.clientHeight || 480;

	/** Follows the hand 1:1 at first, then gives less and less. */
	function rubberband(distance: number) {
		const d = dimension();
		return (distance * d * RUBBER) / (d + RUBBER * distance);
	}

	/** Where the hand would have to be for the band to show this offset. */
	function unband(offset: number) {
		const d = dimension();
		return (offset * d) / (RUBBER * Math.max(1, d - offset));
	}

	function paint(y: number) {
		if (content) content.style.translate = y ? `0 ${y}px` : '';
		if (indicator) indicator.style.opacity = String(Math.min(Math.max(y / threshold, 0), 1));
		if (spinner) spinner.style.rotate = `${y * 3}deg`;
	}

	/** Graded like the system spinner and drawn in clockwise from the top as the pull grows. */
	function paintTicks() {
		ticks.forEach((line, i) => {
			const order = (TICKS - i) % TICKS;
			line?.style.setProperty('opacity', reveal * TICKS > order ? String(1 - i * 0.1) : '0');
		});
	}

	const y = new SpringValue(0, { onUpdate: paint });

	function begin() {
		y.stop();
		fading = false;
		pulling = true;
		// Catching the feed mid-spring continues from exactly where it is.
		gesture = { base: unband(Math.max(y.current, 0)), samples: [] };
		getSelection()?.removeAllRanges();
	}

	function pull(distance: number, t: number) {
		if (!gesture) return;
		const offset = rubberband(Math.max(gesture.base + distance, 0));
		y.jump(offset);
		reveal = Math.min(offset / threshold, 1);
		paintTicks();
		gesture.samples.push({ y: offset, t });
		// Only the last 100ms say how fast the feed is moving now.
		while (gesture.samples.length > 2 && t - gesture.samples[0].t > 100) gesture.samples.shift();
	}

	function end() {
		const g = gesture;
		gesture = null;
		pulling = false;
		if (!g) return;
		const first = g.samples[0];
		const last = g.samples[g.samples.length - 1];
		const seconds = first && last ? (last.t - first.t) / 1000 : 0;
		// Pixels per second, handed to the spring in pixels per frame.
		const velocity = seconds > 0 ? (last.y - first.y) / seconds / 60 : 0;
		if (y.current >= threshold) void start(velocity);
		else y.set(0, { preset: springPresets.snappy, velocity });
	}

	async function start(velocity = 0) {
		busy = true;
		refreshing = true;
		announcement = '';
		fading = false;
		reveal = 1;
		paintTicks();
		// Critically damped, so the indicator never bounces the feed.
		y.set(threshold, { preset: springPresets.snappy, velocity });
		const before = content?.offsetHeight ?? 0;

		let result: unknown;
		let failed = false;
		try {
			result = await onRefresh();
		} catch {
			failed = true;
		}
		await tick();
		if (destroyed) return;

		const added = (content?.offsetHeight ?? 0) - before;
		fading = true;
		refreshing = false;
		busy = false;
		announcement = failed
			? failedLabel
			: typeof result === 'string' && result
				? result
				: refreshedLabel;

		// New items land above the ones on screen. Shifting the feed up by their
		// height keeps everything still for a frame, then the feed springs down,
		// which slides the new items in from the top and retracts the indicator
		// in one motion.
		if (added > 0 && scroller?.scrollTop === 0 && !prefersReducedMotion()) {
			y.jump(y.current - added);
			y.set(0, { preset: springPresets.smooth });
		} else {
			y.set(0, { preset: springPresets.snappy });
		}
	}

	/** Runs a refresh as if the feed had been pulled, scrolling back to the top first. */
	export function refresh() {
		if (busy || disabled) return;
		scroller?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
		void start();
	}

	/** Only from the very top, and never while a refresh or the slide in is running. */
	const canPull = () =>
		!busy && !disabled && !!scroller && scroller.scrollTop <= 0 && y.current >= 0;

	// Touch listeners are attached by hand because the pull has to cancel the
	// browser's own scroll, which a passive listener cannot do.
	$effect(() => {
		const el = scroller;
		if (!el) return;
		let touch: { y: number; pulling: boolean } | null = null;

		const ontouchstart = (event: TouchEvent) => {
			touch = null;
			if (event.touches.length > 1 || !canPull()) return;
			touch = { y: event.touches[0].clientY, pulling: false };
		};
		const ontouchmove = (event: TouchEvent) => {
			if (!touch) return;
			const dy = event.touches[0].clientY - touch.y;
			if (!touch.pulling) {
				// Scrolling up the feed is a normal scroll; leave it alone.
				if (dy <= 0 || el.scrollTop > 0) {
					touch = null;
					return;
				}
				touch.pulling = true;
				touch.y = event.touches[0].clientY;
				begin();
			}
			event.preventDefault();
			pull(event.touches[0].clientY - touch.y, event.timeStamp);
		};
		const ontouchend = () => {
			if (touch?.pulling) end();
			touch = null;
		};

		el.addEventListener('touchstart', ontouchstart, { passive: true });
		el.addEventListener('touchmove', ontouchmove, { passive: false });
		el.addEventListener('touchend', ontouchend);
		el.addEventListener('touchcancel', ontouchend);
		return () => {
			el.removeEventListener('touchstart', ontouchstart);
			el.removeEventListener('touchmove', ontouchmove);
			el.removeEventListener('touchend', ontouchend);
			el.removeEventListener('touchcancel', ontouchend);
		};
	});

	$effect(() => () => {
		destroyed = true;
		y.stop();
	});

	function onpointerdown(event: PointerEvent) {
		dragged = false;
		if (event.pointerType !== 'mouse' || event.button !== 0 || !canPull()) return;
		mouse = { y: event.clientY, pointerId: event.pointerId };
	}

	function onpointermove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (!mouse || event.pointerId !== mouse.pointerId) return;
		const dy = event.clientY - mouse.y;
		if (!gesture) {
			// A press that heads up first is a scroll or a click, not a pull.
			if (dy < -DRAG_SLOP) {
				mouse = null;
				return;
			}
			if (dy <= DRAG_SLOP) return;
			// Counts from here, so crossing the slop never makes the feed jump.
			mouse.y = event.clientY;
			dragged = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);
			begin();
		}
		pull(event.clientY - mouse.y, event.timeStamp);
	}

	function onpointerend(event: PointerEvent) {
		if (!mouse || event.pointerId !== mouse.pointerId) return;
		mouse = null;
		if (gesture) end();
		// The click that follows the release is swallowed; nothing after it is.
		if (dragged) setTimeout(() => (dragged = false));
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn(
		'relative isolate flex min-h-0 flex-col overflow-hidden bg-[var(--pull-to-refresh-surface,var(--background))]',
		className
	)}
>
	<button
		type="button"
		{disabled}
		aria-disabled={refreshing}
		onclick={refresh}
		class="bg-card text-foreground focus-visible:ring-ring aria-disabled:text-muted-foreground pointer-events-none absolute top-2 left-1/2 z-20 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap opacity-0 shadow-md outline-none focus:pointer-events-auto focus:opacity-100 focus-visible:ring-2"
	>
		<RotateCw class="size-3.5" aria-hidden="true" />
		{refreshLabel}
	</button>

	<div
		aria-hidden="true"
		class={cn(
			'text-foreground absolute inset-x-0 top-0 flex h-16 items-center justify-center',
			fading ? 'opacity-0 transition-opacity duration-(--duration-fast) ease-out' : 'opacity-100'
		)}
	>
		<div bind:this={indicator} style:opacity="0">
			<div bind:this={spinner}>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					data-spinning={refreshing ? '' : undefined}
					class="pull-spin size-6"
				>
					{#each { length: TICKS }, i (i)}
						<line
							{@attach collect(ticks, i)}
							x1="12"
							y1="3"
							x2="12"
							y2="7"
							transform="rotate({-i * (360 / TICKS)} 12 12)"
							style:opacity="0"
						/>
					{/each}
				</svg>
			</div>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex (a scrolling region needs focus to scroll by keyboard) -->
	<div
		bind:this={scroller}
		role="region"
		aria-label={label}
		aria-busy={refreshing}
		tabindex="0"
		class="focus-visible:ring-ring relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset"
		{onpointerdown}
		{onpointermove}
		onpointerup={onpointerend}
		onpointercancel={onpointerend}
		onclickcapture={(event) => {
			// The press that ended a mouse pull is not a click on whatever sits under it.
			if (!dragged) return;
			dragged = false;
			event.preventDefault();
			event.stopPropagation();
		}}
	>
		<div
			bind:this={content}
			class={cn(
				'min-h-full bg-[var(--pull-to-refresh-surface,var(--background))]',
				pulling && 'select-none'
			)}
		>
			{@render children()}
		</div>
	</div>

	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
	/* The indeterminate spin is a stepped rotation of graded ticks, like the
	   system activity indicator, and it only runs while refreshing. */
	.pull-spin[data-spinning] {
		animation: pull-spin calc(var(--duration-slow) * 2) steps(8) infinite;
	}

	@keyframes pull-spin {
		to {
			rotate: 360deg;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pull-spin[data-spinning] {
			animation: none;
		}
	}
</style>
