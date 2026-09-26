<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** How many pages there are. */
		count: number;
		/** The current page, counted from 0. The pill inches over when it changes. */
		index?: number;
		/**
		 * A continuous page position that overrides `index` for drawing, such as a
		 * scroll offset: 1.5 is halfway between the second and third page. Pass
		 * it to have the pill follow a scroll or drag frame by frame.
		 */
		progress?: number;
		/** Called with the page a reader picks, by clicking a dot or with the arrow keys. */
		onIndexChange?: (index: number) => void;
		/**
		 * Autoplay interval in milliseconds. When set, the pill becomes a countdown
		 * that fills while `playing` and calls `onElapsed` when full.
		 */
		duration?: number;
		/** Runs the countdown. Pause it on hover, focus, and while the reader scrolls. */
		playing?: boolean;
		/** Called when a countdown fills. Advance to the next page here. */
		onElapsed?: () => void;
		/** Accessible name for the group of dots. */
		label?: string;
		/** The group element. */
		ref?: HTMLDivElement | null;
		/** Classes for the group. */
		class?: string;
	};

	let {
		count,
		index = $bindable(0),
		progress,
		onIndexChange,
		duration,
		playing = false,
		onElapsed,
		label = 'Pages',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const dot = 6;
	const pill = 20;
	const gap = 6;
	// How far each edge of the pill travels between two pages.
	const step = dot + gap;

	const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
	const smooth = (value: number) => value * value * (3 - 2 * value);
	// The leading edge travels in the first 60% of a move and the trailing edge
	// in the last 60%, so the pill stretches toward the next dot, then pulls its
	// tail in after it.
	const lead = (t: number) => smooth(clamp01(t / 0.6));
	const trail = (t: number) => smooth(clamp01((t - 0.4) / 0.6));

	// Where the pill is drawn when no `progress` is given: a velocity-preserving
	// spring toward `index`, stepped like svelte/motion's Spring so the house
	// preset reads the same. Position only, and the loop sleeps at rest.
	let shown = $state(index);
	let goal = index;
	let previous = index;
	let frame = 0;
	let then = 0;

	function tick(now: number) {
		const dt = (Math.min(now - then, 1000 / 30) * 60) / 1000;
		then = now;
		const { stiffness, damping } = springPresets.smooth;
		const velocity = (shown - previous) / (dt || 1 / 60);
		const delta = (velocity + stiffness * (goal - shown) - damping * velocity) * dt;
		previous = shown;
		if (Math.abs(delta) < 0.001 && Math.abs(goal - shown) < 0.001) {
			shown = previous = goal;
			frame = 0;
			return;
		}
		shown += delta;
		frame = requestAnimationFrame(tick);
	}

	$effect(() => {
		goal = index;
		if (prefersReducedMotion()) {
			cancelAnimationFrame(frame);
			frame = 0;
			shown = previous = goal;
		} else if (!frame) {
			then = performance.now();
			frame = requestAnimationFrame(tick);
		}
	});

	$effect(() => () => cancelAnimationFrame(frame));

	const last = $derived(Math.max(count - 1, 0));
	const at = $derived(Math.min(Math.max(progress ?? shown, 0), last));
	// Only crossing the halfway point changes which page is current.
	const current = $derived(Math.round(at));

	const bar = $derived.by(() => {
		const k = Math.min(Math.floor(at), Math.max(count - 2, 0));
		const t = clamp01(at - k);
		const left = k * step + step * trail(t);
		const right = k * step + pill + step * lead(t);
		return { left, width: right - left };
	});

	// A dot swells toward pill width as its page approaches, so the gray row
	// makes room for the pill and every gap stays even mid-move.
	const dotWidth = (i: number) => dot + (pill - dot) * clamp01(1 - Math.abs(at - i));
	// Plain dots before this one, plus however much extra pill width sits behind it.
	const dotLeft = (i: number) => i * step + (pill - dot) * clamp01(i - at);

	function select(next: number) {
		const target = Math.min(Math.max(next, 0), last);
		// With `progress` driving the pill, `index` only knows the last pick, so
		// the page on screen decides whether this is a change.
		if (target !== (progress === undefined ? index : current)) {
			index = target;
			onIndexChange?.(target);
		}
		return target;
	}

	function onkeydown(event: KeyboardEvent) {
		const target = {
			ArrowRight: current + 1,
			ArrowLeft: current - 1,
			Home: 0,
			End: last
		}[event.key];
		if (target === undefined) return;
		event.preventDefault();
		const picked = select(target);
		ref?.querySelectorAll<HTMLElement>('button')[picked]?.focus();
	}

	let fill = $state<HTMLSpanElement | null>(null);

	// The countdown is the timer: when the fill completes, the page advances.
	// It restarts on every page and every resume, so a resume starts over.
	$effect(() => {
		const el = fill;
		if (!el || !playing || !duration) return;
		void current;
		const total = duration;

		if (typeof el.animate !== 'function') {
			const timer = setTimeout(() => onElapsed?.(), total);
			return () => clearTimeout(timer);
		}

		const countdown = el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
			duration: total,
			easing: 'linear'
		});
		countdown.onfinish = () => onElapsed?.();
		return () => {
			countdown.onfinish = null;
			if (countdown.playState !== 'running') return;
			// Paused partway: ease the fill back to full rather than snapping, so a
			// paused pill reads as solid, not half done.
			const from = getComputedStyle(el).transform;
			countdown.cancel();
			el.style.transition = 'none';
			el.style.transform = from;
			void el.offsetWidth;
			el.style.transition = '';
			el.style.transform = '';
		};
	});
</script>

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={label}
	class={cn('relative h-8 shrink-0 [contain:layout]', className)}
	style:width="{last * step + pill}px"
	{onkeydown}
>
	{#each { length: count }, i (i)}
		<button
			type="button"
			aria-label="Page {i + 1} of {count}"
			aria-current={i === current ? 'page' : undefined}
			tabindex={i === current ? 0 : -1}
			onclick={() => select(i)}
			class="group/dot focus-visible:ring-ring absolute inset-y-0 -ml-[3px] box-content flex touch-manipulation items-center rounded-full px-[3px] outline-none focus-visible:ring-2"
			style:left="{dotLeft(i)}px"
			style:width="{dotWidth(i)}px"
		>
			<span
				class="bg-foreground/20 group-hover/dot:bg-foreground/35 h-1.5 w-full rounded-full transition-[background-color,scale] duration-(--duration-fast) ease-out group-active/dot:scale-[0.96]"
			></span>
		</button>
	{/each}
	<span
		aria-hidden="true"
		class={cn(
			'pointer-events-none absolute top-1/2 left-0 h-1.5 overflow-hidden rounded-full',
			// With a countdown the resting track is a lighter tint, still clearly the
			// current slot before it fills.
			duration ? 'bg-primary/40' : 'bg-primary'
		)}
		style:transform="translate({bar.left}px, -50%)"
		style:width="{bar.width}px"
	>
		{#if duration}
			<!-- Rests full, so a paused pill looks exactly like a plain one. -->
			<span
				bind:this={fill}
				data-slot="countdown"
				class="bg-primary absolute inset-0 origin-left transition-transform duration-(--duration-base) ease-out"
			></span>
		{/if}
	</span>
</div>
