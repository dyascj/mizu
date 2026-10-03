<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		prefersReducedMotion,
		springOptions,
		type SpringOptions
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Called once each time the knob reaches the end, or on a keyboard confirm. */
		onConfirm: () => void;
		/** The instruction on the track, and the knob's name. */
		label?: string;
		/** Shown on the filled track once confirmed. Also announced. */
		confirmedLabel?: string;
		/**
		 * How long the confirmation shows before the knob glides home, in
		 * milliseconds. Set 0 to stay confirmed until the component remounts.
		 */
		timeout?: number;
		/** Blocks sliding and confirming. */
		disabled?: boolean;
		/** The track element. */
		ref?: HTMLDivElement | null;
		/** Classes for the track. */
		class?: string;
	};

	let {
		onConfirm,
		label = 'Slide to confirm',
		confirmedLabel = 'Confirmed',
		timeout = 2000,
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Knob diameter and its inset from the track edge, in pixels. */
	const KNOB = 56;
	const INSET = 4;
	/** Past this share of the track, a fast enough release finishes the slide. */
	const FLICK_PROGRESS = 0.7;
	/** Release speed that counts as a flick, in pixels per second. */
	const FLICK_VELOCITY = 500;
	/** How far the knob gives when pulled back past the start, in pixels. */
	const MAX_STRETCH = 6;

	// Physical counterparts of the theme's springs, so a release can carry its
	// velocity into the settle. Snapping back is the smooth spring: its slight
	// bounce is earned by the throw. Finishing is the snappy one, with none.
	const SMOOTH = springOptions.smooth;
	const SNAPPY = springOptions.snappy;

	const uid = $props.id();
	const hintId = `${uid}-hint`;

	let done = $state(false);
	let knob = $state<HTMLButtonElement | null>(null);
	let fill = $state<HTMLElement | null>(null);
	let prompt = $state<HTMLElement | null>(null);
	let x = 0;
	/** -1 right to left, where the knob travels leftward. Read as each move starts. */
	let sign = 1;
	let frame = 0;
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let drag: {
		id: number;
		offset: number;
		max: number;
		samples: { x: number; t: number }[];
	} | null = null;

	const maxX = () => Math.max((ref?.clientWidth ?? 0) - KNOB - INSET * 2, 1);
	const readDirection = () => {
		sign = ref && getComputedStyle(ref).direction === 'rtl' ? -1 : 1;
	};

	function paint() {
		if (knob) knob.style.translate = `${sign * x}px 0`;
		// A track-wide pill whose far end rides just behind the knob. Moving it
		// is a transform, where growing a width would relayout every frame.
		if (fill) fill.style.translate = `calc((${x}px - 100% + ${KNOB}px) * ${sign}) 0`;
		// The instruction is gone by 60% of the way, so it never sits under the knob.
		if (prompt) prompt.style.opacity = `${Math.min(Math.max(1 - x / (maxX() * 0.6), 0), 1)}`;
	}

	/** Springs the knob to `target`, starting at `velocity` pixels per second. */
	function springTo(target: number, spring: SpringOptions, velocity = 0) {
		cancelAnimationFrame(frame);
		frame = 0;
		readDirection();
		if (prefersReducedMotion()) {
			x = target;
			paint();
			return;
		}
		const omega = (2 * Math.PI) / spring.duration;
		const zeta = 1 - spring.bounce;
		let v = velocity;
		let last: number | undefined;
		const tick = (now: number) => {
			let dt = Math.min(0.064, (now - (last ?? now)) / 1000);
			last = now;
			const step = 1 / 240;
			while (dt > 0) {
				const h = Math.min(step, dt);
				v += (-omega * omega * (x - target) - 2 * zeta * omega * v) * h;
				x += v * h;
				dt -= h;
			}
			const resting = Math.abs(x - target) < 0.5 && Math.abs(v) < 10;
			if (resting) x = target;
			paint();
			// Sleeps once at rest.
			frame = resting ? 0 : requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	}

	function confirm(velocity = 0) {
		if (done || disabled) return;
		drag = null;
		done = true;
		springTo(maxX(), SNAPPY, velocity);
		if (typeof navigator !== 'undefined') navigator.vibrate?.(10);
		onConfirm();
		clearTimeout(resetTimer);
		if (timeout > 0) resetTimer = setTimeout(reset, timeout);
	}

	function reset() {
		done = false;
		springTo(0, SMOOTH);
	}

	function velocityOf(samples: { x: number; t: number }[], now: { x: number; t: number }) {
		const first = samples[0];
		const dt = (now.t - first.t) / 1000;
		return dt > 0 ? (now.x - first.x) / dt : 0;
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLButtonElement }) {
		if (done || disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
		// Only the first finger drives; a second one mid-drag is ignored.
		if (drag) return;
		cancelAnimationFrame(frame);
		frame = 0;
		readDirection();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		// Pointer positions measured along the slide, so right to left mirrors them.
		const along = sign * event.clientX;
		drag = {
			id: event.pointerId,
			// Keeps the knob under the exact point it was grabbed, even mid-spring.
			offset: along - x,
			max: maxX(),
			samples: [{ x: along, t: event.timeStamp }]
		};
	}

	function onpointermove(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.id) return;
		const now = { x: sign * event.clientX, t: event.timeStamp };
		drag.samples.push(now);
		// Only the last 100ms say how fast the hand is moving now.
		while (drag.samples.length > 2 && now.t - drag.samples[0].t > 100) drag.samples.shift();
		const raw = now.x - drag.offset;
		if (raw >= drag.max) {
			confirm(velocityOf(drag.samples, now));
			return;
		}
		// Gives a little past the start, then stiffens.
		x = raw < 0 ? MAX_STRETCH * Math.tanh(raw / (MAX_STRETCH * 4)) : raw;
		paint();
	}

	function onpointerend(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.id) return;
		const { samples, max } = drag;
		drag = null;
		const velocity = velocityOf(samples, samples[samples.length - 1]);
		if (x / max >= FLICK_PROGRESS && velocity > FLICK_VELOCITY) confirm(velocity);
		else springTo(0, SMOOTH, velocity);
	}

	// Enter, Space, and screen reader activation arrive as clicks with no
	// pointer behind them. They slide exactly as a drag would.
	function onclick(event: MouseEvent) {
		if (event.detail === 0) confirm();
	}

	function onkeydown(event: KeyboardEvent) {
		// The arrow that points toward the end, which is left in right to left.
		const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
		if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || event.key === 'End') {
			event.preventDefault();
			confirm();
		}
	}

	// Disabling mid-drag lets go of the knob and sends it home.
	$effect(() => {
		if (disabled && drag) {
			drag = null;
			springTo(0, SMOOTH);
		}
	});

	// A confirmed knob stays pinned to the end when the track changes width,
	// such as a phone turning while `timeout` is 0.
	$effect(() => {
		const track = ref;
		if (!track || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => {
			if (!done || drag) return;
			cancelAnimationFrame(frame);
			frame = 0;
			readDirection();
			x = maxX();
			paint();
		});
		observer.observe(track);
		return () => observer.disconnect();
	});

	$effect(() => () => {
		cancelAnimationFrame(frame);
		clearTimeout(resetTimer);
	});
</script>

<div
	{...restProps}
	bind:this={ref}
	data-done={done}
	class={cn(
		'slide-track bg-secondary relative h-16 w-full max-w-90 touch-pan-y rounded-full select-none',
		disabled && 'opacity-50',
		className
	)}
>
	<div aria-hidden="true" class="absolute inset-1 overflow-hidden rounded-full">
		<div
			bind:this={fill}
			class={cn(
				'bg-primary h-full w-full -translate-x-[calc(100%-56px)] rounded-full transition-opacity duration-(--duration-base) ease-out rtl:translate-x-[calc(100%-56px)]',
				done ? 'opacity-100' : 'opacity-8'
			)}
		></div>
	</div>

	<span
		bind:this={prompt}
		aria-hidden="true"
		class="absolute inset-y-0 start-16 end-0 flex items-center justify-center pe-4 text-sm font-medium"
	>
		<span class="slide-prompt truncate">{label}</span>
	</span>

	<!-- Arrives over a longer beat than it leaves: the exit should never hold the eye. -->
	<span
		aria-hidden="true"
		class={cn(
			'text-primary-foreground absolute inset-y-0 start-0 end-16 flex items-center justify-center gap-2 ps-4 text-sm font-medium transition-[opacity,filter]',
			done
				? 'opacity-100 blur-none duration-(--duration-base) ease-out'
				: 'opacity-0 blur-[4px] duration-(--duration-fast) ease-in'
		)}
	>
		<Check
			class={cn(
				'size-4 shrink-0',
				done
					? 'scale-100 [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy)]'
					: 'scale-25 transition-[scale] duration-(--duration-fast) ease-in'
			)}
		/>
		<span class="truncate">{confirmedLabel}</span>
	</span>

	<button
		bind:this={knob}
		type="button"
		aria-label={label}
		aria-describedby={hintId}
		aria-disabled={done || disabled || undefined}
		class={cn(
			'bg-card text-foreground focus-visible:ring-ring focus-visible:ring-offset-background dark:bg-control absolute start-1 top-1 flex size-14 touch-none items-center justify-center rounded-full shadow-sm transition-[scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
			done || disabled ? 'cursor-default' : 'cursor-grab active:scale-[0.96] active:cursor-grabbing'
		)}
		{onpointerdown}
		{onpointermove}
		onpointerup={onpointerend}
		onpointercancel={onpointerend}
		{onclick}
		{onkeydown}
	>
		<ChevronRight
			aria-hidden="true"
			class="size-5 translate-x-px rtl:-translate-x-px rtl:rotate-180"
		/>
	</button>

	<span id={hintId} class="sr-only">Drag to the end, or press Enter</span>
	<span class="sr-only" aria-live="polite">{done ? confirmedLabel : ''}</span>
</div>

<style>
	/* A narrow highlight crosses the instruction once when the pointer arrives or
	   the knob takes focus: an invitation that then holds still. */
	.slide-prompt {
		background-image: linear-gradient(
			90deg,
			var(--muted-foreground) 0%,
			var(--muted-foreground) 40%,
			var(--foreground) 50%,
			var(--muted-foreground) 60%,
			var(--muted-foreground) 100%
		);
		background-size: 250% 100%;
		background-position: var(--sweep-from) 0;
		/* The highlight crosses the way the line reads. */
		--sweep-from: 100%;
		--sweep-to: 0%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.slide-track:not([data-done='true']):hover .slide-prompt,
	.slide-track:not([data-done='true']):has(:focus-visible) .slide-prompt {
		animation: slide-sweep var(--duration-ambient) var(--ease-in-out);
	}

	.slide-prompt:dir(rtl) {
		--sweep-from: 0%;
		--sweep-to: 100%;
	}

	@keyframes slide-sweep {
		to {
			background-position: var(--sweep-to) 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slide-prompt {
			animation: none !important;
		}
	}

	@media (forced-colors: active) {
		.slide-prompt {
			background: none;
			color: CanvasText;
		}
	}
</style>
