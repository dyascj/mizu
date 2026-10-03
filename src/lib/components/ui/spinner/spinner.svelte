<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { buildPattern, pixelChecks, type PixelPattern } from './patterns.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/**
		 * Size in pixels. The ring's diameter and the pixel grid's side; the
		 * dots and the bar scale from it too.
		 */
		size?: number;
		/**
		 * Which loader. `ring` turns an arc, `dots` play leapfrog with one dot
		 * always in the air, `bar` is an inchworm that reaches and catches up,
		 * and `pixel` steps shapes across a small grid.
		 */
		variant?: 'ring' | 'dots' | 'bar' | 'pixel';
		/**
		 * Plays the loader's own finish instead of looping: the ring closes and
		 * draws a check, the dots gather into one, the bar stretches full, and
		 * the pixels lay a check. Set it back to false to load again.
		 */
		done?: boolean;
		/** Announced while loading. */
		label?: string;
		/** Announced once `done` turns true. */
		doneLabel?: string;
		/** Holds one still frame instead of moving, for loaders that are not actually waiting. */
		paused?: boolean;
		/** Pixel variant: cells per side. */
		grid?: 3 | 4;
		/** Pixel variant: the shapes to cycle through, in order. */
		patterns?: PixelPattern[];
		/** Pixel variant: square or round cells. */
		shape?: 'square' | 'round';
		/** The status element. */
		ref?: HTMLDivElement | null;
		class?: string;
	};

	let {
		size = 20,
		variant = 'ring',
		done = false,
		label = 'Loading',
		doneLabel = 'Done',
		paused = false,
		grid = 3,
		patterns = ['spiral', 'snake', 'pulse', 'checker'],
		shape = 'square',
		ref = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	/** The ring's circumference; a quarter of it is the turning arc. */
	const RING = 2 * Math.PI * 9;
	/** One stretch per pattern before it hands over, at the end of a loop. */
	const PATTERN_TIME = duration.ambient;

	const px = $derived(Number.isFinite(size) && size > 0 ? size : 20);
	const round = (n: number) => Math.round(n * 100) / 100;

	const sequence = $derived(patterns.map((pattern) => buildPattern(pattern, grid)));
	/** A frame from the middle of the first shape, so a still grid looks mid-thought. */
	const restFrame = $derived.by(() => {
		const frames = sequence[0] ?? [[]];
		return new Set(frames[Math.floor(frames.length / 3)]);
	});
	const cellSize = $derived(round(grid === 3 ? (3 * px) / 11 : px / 5));
	const cellGap = $derived(round(grid === 3 ? px / 11 : px / 15));

	let hopX = $state<HTMLElement[]>([]);
	let hopY = $state<HTMLElement[]>([]);
	let worm = $state<HTMLElement | null>(null);
	let pixels = $state<HTMLElement | null>(null);

	/**
	 * Freezes each element on the frame its CSS loop has reached, then carries
	 * it from there to `to`. Cancelling the loop outright would snap it back to
	 * its resting place first.
	 */
	function settle(elements: HTMLElement[], property: 'translate' | 'clip-path', to: string) {
		const restore = elements.map((el) => {
			const original = el.style.getPropertyValue(property);
			const from = getComputedStyle(el).getPropertyValue(property);
			el.style.animation = 'none';
			if (from) el.style.setProperty(property, from);
			// Commits the frozen frame, so the transition starts from it.
			el.getBoundingClientRect();
			el.style.transition = `${property} var(--duration-base) var(--ease-out)`;
			el.style.setProperty(property, to);
			return () => {
				el.style.animation = '';
				el.style.transition = '';
				el.style.setProperty(property, original);
			};
		});
		return () => restore.forEach((undo) => undo());
	}

	$effect(() => {
		if (!done) return;
		if (variant === 'dots') {
			// The middle slot, so the merged dot sits where the group was centered.
			const undoX = settle(hopX, 'translate', 'var(--spinner-pitch) 0');
			const undoY = settle(hopY, 'translate', '0 0');
			return () => {
				undoX();
				undoY();
			};
		}
		if (variant === 'bar' && worm) {
			return settle([worm], 'clip-path', 'inset(0 0 0 0 round 9999px)');
		}
	});

	$effect(() => {
		if (variant !== 'pixel' || !pixels) return;
		const el = pixels;
		const cells = Array.from(el.children) as HTMLElement[];
		const light = (lit: Set<number>) =>
			cells.forEach((cell, i) => (cell.dataset.on = String(lit.has(i))));

		if (done) {
			// Clears the grid, then lays the check pixel by pixel in stroke order.
			const check = pixelChecks[grid];
			cells.forEach((cell, i) => {
				const order = check.indexOf(i);
				cell.style.transitionDelay = order < 0 ? '0ms' : `${duration.instant + order * stagger}ms`;
			});
			light(new Set(check));
			return;
		}

		// A diagonal stagger: when one shape hands over to the next, the change
		// sweeps across the grid instead of every pixel flipping at once.
		cells.forEach((cell, i) => {
			cell.style.transitionDelay = `${(Math.floor(i / grid) + (i % grid)) * (stagger / 3)}ms`;
		});

		if (paused || prefersReducedMotion() || sequence.length === 0) {
			light(restFrame);
			return;
		}

		const shapes = sequence;
		let shape = 0;
		let frame = 0;
		let elapsed = 0;
		let timer: ReturnType<typeof setInterval> | undefined;
		const tick = () => {
			const frames = shapes[shape];
			light(new Set(frames[frame % frames.length]));
			frame++;
			elapsed += duration.instant;
			// Hands over only at the end of a loop, so no shape is cut off mid-draw.
			if (elapsed >= PATTERN_TIME && frame % frames.length === 0) {
				shape = (shape + 1) % shapes.length;
				frame = 0;
				elapsed = 0;
			}
		};
		const start = () => {
			if (timer) return;
			tick();
			timer = setInterval(tick, duration.instant);
		};
		const stop = () => {
			clearInterval(timer);
			timer = undefined;
		};

		// Sleeps while offscreen or in a hidden tab.
		if (typeof IntersectionObserver === 'undefined') {
			start();
			return stop;
		}
		let visible = false;
		const sync = () => (visible && !document.hidden ? start() : stop());
		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			sync();
		});
		observer.observe(el);
		document.addEventListener('visibilitychange', sync);
		return () => {
			stop();
			observer.disconnect();
			document.removeEventListener('visibilitychange', sync);
		};
	});

	const still = $derived(done || paused);
</script>

<div
	bind:this={ref}
	role="status"
	data-variant={variant}
	data-done={done ? '' : undefined}
	class={cn(
		'spinner text-primary inline-flex',
		variant === 'bar' && 'w-[calc(var(--spinner-size)*4.8)]',
		className
	)}
	style:--spinner-size="{px}px"
	style:--spinner-pitch="{round(px * 0.7)}px"
	style:--spinner-dot="{round(px * 0.5)}px"
	style:--spinner-hop="{round(px * 0.45)}px"
	{...rest}
>
	{#if variant === 'dots'}
		<!-- Mirrored right to left, so the leapfrog travels the way the line reads. -->
		<span
			aria-hidden="true"
			class="relative block shrink-0 rtl:-scale-x-100"
			style:width="calc(var(--spinner-pitch) * 2 + var(--spinner-dot))"
			style:height="var(--spinner-dot)"
		>
			{#each [0, 1, 2] as i (i)}
				<!-- Each dot runs the same loop a third of a cycle further along.
				     The inline translate is its slot, which shows only when the
				     loop is off. -->
				<span
					bind:this={hopX[i]}
					class={cn('spinner-hop-x absolute top-0 left-0', paused && 'spinner-still')}
					style:translate="calc(var(--spinner-pitch) * {i}) 0"
					style:animation-delay="calc(var(--spinner-cycle) / -3 * {i})"
				>
					<span
						bind:this={hopY[i]}
						class={cn('spinner-hop-y block rounded-full bg-current', paused && 'spinner-still')}
						style:width="var(--spinner-dot)"
						style:height="var(--spinner-dot)"
						style:animation-delay="calc(var(--spinner-cycle) / -3 * {i})"
					></span>
				</span>
			{/each}
		</span>
	{:else if variant === 'bar'}
		<!-- Mirrored right to left, so the worm crawls the way the line reads. -->
		<span
			aria-hidden="true"
			class="block w-full overflow-hidden rounded-full bg-current/15 rtl:-scale-x-100"
			style:height="{Math.max(2, round(px / 5))}px"
		>
			<span
				bind:this={worm}
				class={cn('spinner-worm block h-full w-full bg-current', paused && 'spinner-still')}
			></span>
		</span>
	{:else if variant === 'pixel'}
		<span
			bind:this={pixels}
			aria-hidden="true"
			class="grid shrink-0"
			style:grid-template-columns="repeat({grid}, {cellSize}px)"
			style:grid-auto-rows="{cellSize}px"
			style:gap="{cellGap}px"
		>
			{#each { length: grid * grid } as _, i (i)}
				<span
					data-on={String(restFrame.has(i))}
					class={cn(
						'scale-[0.8] bg-current opacity-[0.12] transition-[opacity,scale] duration-(--duration-slow) ease-out motion-reduce:scale-100',
						// On lands in a blink so each step reads crisply; off fades
						// slowly, and that fade is the trail.
						'data-[on=true]:scale-100 data-[on=true]:opacity-100 data-[on=true]:duration-(--duration-instant)',
						shape === 'round' ? 'rounded-full' : 'rounded-[1px]'
					)}
				></span>
			{/each}
		</span>
	{:else}
		<span class="grid shrink-0">
			<svg
				class={cn('col-start-1 row-start-1 animate-spin', still && '[animation-play-state:paused]')}
				width={px}
				height={px}
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<circle class="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
				<!-- The arc starts at twelve o'clock and, on finish, grows into the
				     whole ring. A full ring looks the same at any angle, so the turn
				     stops the moment it starts closing. -->
				<circle
					cx="12"
					cy="12"
					r="9"
					transform="rotate(-90 12 12)"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-dasharray="{done ? RING : RING / 4} {RING}"
					class="transition-[stroke-dasharray] duration-(--duration-base) ease-out"
				/>
			</svg>
			<svg
				class="col-start-1 row-start-1"
				width={px}
				height={px}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.25"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<!-- Starts drawing as the ring finishes closing, so the two read as
				     one gesture. -->
				<path
					d="m8.25 12.25 2.5 2.5 5-5.5"
					pathLength="1"
					stroke-dasharray="1 1"
					stroke-dashoffset={done ? 0 : 1}
					class={cn(
						'transition-[stroke-dashoffset] ease-out',
						done
							? 'delay-(--duration-fast) duration-(--duration-base)'
							: 'duration-(--duration-instant)'
					)}
				/>
			</svg>
		</span>
	{/if}
	<span class="sr-only">{done ? doneLabel : label}</span>
</div>

<style>
	/* Every loop is CSS on translate or clip-path, so it keeps moving while the
	   main thread is busy loading whatever the reader is waiting for. */
	.spinner {
		--spinner-cycle: calc(var(--duration-ambient) * 0.75);
	}

	/* Leapfrog: the back dot hops over the other two while they shuffle along
	   underneath. One cycle is three moves, and each dot runs a third of a
	   cycle apart, so exactly one dot is in the air. Horizontal and vertical
	   halves live on separate elements, so the hop is an arc, not a diagonal. */
	.spinner-hop-x {
		animation: spinner-hop-x var(--spinner-cycle) infinite;
	}
	.spinner-hop-y {
		animation: spinner-hop-y var(--spinner-cycle) infinite;
	}
	@keyframes spinner-hop-x {
		0% {
			translate: 0 0;
			animation-timing-function: var(--ease-in-out);
		}
		20%,
		33.3% {
			translate: var(--spinner-pitch) 0;
			animation-timing-function: var(--ease-in-out);
		}
		53.3%,
		66.7% {
			translate: calc(var(--spinner-pitch) * 2) 0;
			animation-timing-function: var(--ease-in-out);
		}
		86.7%,
		100% {
			translate: 0 0;
		}
	}
	@keyframes spinner-hop-y {
		0%,
		66.7% {
			translate: 0 0;
			animation-timing-function: var(--ease-out);
		}
		76.7% {
			translate: 0 calc(var(--spinner-hop) * -1);
			animation-timing-function: var(--ease-in);
		}
		86.7%,
		100% {
			translate: 0 0;
		}
	}

	/* Inchworm: the head reaches ahead while the tail holds, then the tail
	   catches up and the pair slips off the far end. Clipping a full-width bar
	   lets the segment stretch without squashing its round ends. */
	.spinner-worm {
		animation: spinner-worm calc(var(--duration-ambient) * 0.7) infinite;
	}
	@keyframes spinner-worm {
		0% {
			clip-path: inset(0 100% 0 0 round 9999px);
			animation-timing-function: var(--ease-out);
		}
		45% {
			clip-path: inset(0 30% 0 0 round 9999px);
			animation-timing-function: var(--ease-in-out);
		}
		100% {
			clip-path: inset(0 0 0 100% round 9999px);
		}
	}

	.spinner-still {
		animation-play-state: paused;
	}
	/* The worm's first frame is empty, so a still bar holds a segment instead. */
	.spinner-worm.spinner-still {
		animation: none;
		clip-path: inset(0 30% 0 0 round 9999px);
	}

	/* Reduced motion: nothing hops or crawls. The dots rest in their slots and
	   the bar holds a segment, while the label still says it is loading. */
	@media (prefers-reduced-motion: reduce) {
		.spinner-hop-x,
		.spinner-hop-y,
		.spinner-worm {
			animation: none;
		}
		.spinner-worm {
			clip-path: inset(0 30% 0 0 round 9999px);
		}
	}
</style>
