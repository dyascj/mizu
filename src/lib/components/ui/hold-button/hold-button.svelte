<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { setHoldButtonState, type HoldPhase } from './context.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/** How long the press must last before it confirms, in milliseconds. */
		duration?: number;
		/**
		 * Called once each time a hold runs to completion. Assistive technology
		 * that activates with a plain click, such as a screen reader in browse
		 * mode, confirms without holding.
		 */
		onConfirm: () => void;
		/**
		 * Words that join the check once the hold confirms, such as "Deleted".
		 * Also announced to screen readers. Without it the check shows alone and
		 * "Confirmed" is announced.
		 */
		confirmedLabel?: string;
		/** Colors for the resting pill and the fill that sweeps across it. */
		variant?: 'destructive' | 'primary';
		/** Pill height and label size. */
		size?: 'sm' | 'md' | 'lg';
		/** Blocks pressing and holding. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
		/**
		 * The label, such as "Hold to delete". Put a `HoldButtonTrash` first for
		 * a bin whose lid opens as the fill sweeps and slams shut on confirm.
		 */
		children: Snippet;
	};

	let {
		duration = 1200,
		onConfirm,
		confirmedLabel,
		variant = 'destructive',
		size = 'md',
		disabled = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	const tones = {
		destructive: {
			rest: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
			fill: 'bg-destructive text-destructive-foreground'
		},
		primary: {
			rest: 'bg-secondary text-secondary-foreground hover:bg-control',
			fill: 'bg-primary text-primary-foreground'
		}
	};
	const sizes = {
		sm: 'h-8 px-4 text-sm [&_svg]:size-4',
		md: 'h-10 px-5 text-sm [&_svg]:size-4',
		lg: 'h-12 px-6 text-base [&_svg]:size-5'
	};

	/** Long enough to read the check before the fill retracts. */
	const confirmation = durations.ambient;

	const uid = $props.id();
	const hintId = `${uid}-hint`;

	let progress = $state(0);
	let phase = $state<HoldPhase>('idle');
	/** True from confirmation until the fill is fully back, so a retracting fill never reopens a lid. */
	let confirmed = $state(false);
	/** Animated icons inside the label that the label swap waits for. */
	let lids = $state(0);
	let frame = 0;
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let pointerId: number | null = null;
	let heldKey: string | null = null;

	setHoldButtonState({
		get phase() {
			return phase;
		},
		get progress() {
			return progress;
		},
		get confirmed() {
			return confirmed;
		},
		register() {
			untrack(() => (lids += 1));
			return () => untrack(() => (lids -= 1));
		}
	});

	/** Runs `step` every frame until it returns false. Replaces any running loop. */
	function animate(step: (elapsed: number) => boolean) {
		cancelAnimationFrame(frame);
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			if (step(now - start)) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	}

	function press() {
		if (disabled || phase === 'holding' || phase === 'done') return;
		phase = 'holding';
		confirmed = false;
		// Resume from wherever a retracting fill currently is.
		const from = progress * duration;
		animate((elapsed) => {
			progress = Math.min(1, (from + elapsed) / duration);
			if (progress < 1) return true;
			complete();
			return false;
		});
	}

	function complete() {
		cancelAnimationFrame(frame);
		progress = 1;
		phase = 'done';
		confirmed = true;
		resetTimer = setTimeout(retract, confirmation);
		// A tap of haptics where the device has them, like a lid landing.
		if (typeof navigator !== 'undefined') navigator.vibrate?.(10);
		onConfirm();
	}

	// Screen readers in browse mode, switch access, and voice control activate
	// with a click that has no pointer or key press behind it. They cannot hold,
	// and the activation is already deliberate, so it confirms directly.
	function onclick(event: MouseEvent) {
		if (event.detail !== 0 || pointerId !== null || heldKey !== null) return;
		if (disabled || phase === 'done') return;
		complete();
	}

	function release() {
		pointerId = null;
		heldKey = null;
		if (phase === 'holding') retract();
	}

	function retract() {
		phase = 'retracting';
		// Progress still reads under reduced motion; only the spring back is decoration.
		if (progress === 0 || prefersReducedMotion()) {
			cancelAnimationFrame(frame);
			progress = 0;
			phase = 'idle';
			confirmed = false;
			return;
		}
		const from = progress;
		const { duration: settle, easing } = springs.snappy;
		animate((elapsed) => {
			const t = Math.min(1, elapsed / settle);
			progress = Math.max(0, from * (1 - easing(t)));
			if (t < 1) return true;
			phase = 'idle';
			confirmed = false;
			return false;
		});
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLButtonElement }) {
		if (event.button !== 0 || pointerId !== null) return;
		pointerId = event.pointerId;
		// Capture so the release is heard even when it happens off the button.
		event.currentTarget.setPointerCapture?.(event.pointerId);
		press();
	}

	function onpointermove(event: PointerEvent & { currentTarget: HTMLButtonElement }) {
		if (event.pointerId !== pointerId) return;
		const box = event.currentTarget.getBoundingClientRect();
		const inside =
			event.clientX >= box.left &&
			event.clientX <= box.right &&
			event.clientY >= box.top &&
			event.clientY <= box.bottom;
		if (!inside) release();
	}

	function onpointerend(event: PointerEvent) {
		if (event.pointerId === pointerId) release();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== ' ' && event.key !== 'Enter') return;
		// Enter would otherwise click, and a held key repeats; neither may restart the hold.
		event.preventDefault();
		if (event.repeat || heldKey !== null) return;
		heldKey = event.key;
		press();
	}

	function onkeyup(event: KeyboardEvent) {
		if (event.key !== heldKey) return;
		event.preventDefault();
		release();
	}

	$effect(() => {
		if (disabled) untrack(release);
	});

	$effect(() => () => {
		cancelAnimationFrame(frame);
		clearTimeout(resetTimer);
	});

	const done = $derived(phase === 'done');

	// Arriving layers resolve out of a blur; the confirmation waits for any lid
	// to land first. Leaving layers drop away faster, with no wait, so the way
	// back reads as instant.
	const textShown =
		'opacity-100 blur-none [transition:opacity_var(--duration-base)_var(--ease-out)_var(--hold-swap-delay),filter_var(--duration-base)_var(--ease-out)_var(--hold-swap-delay)]';
	const restShown =
		'opacity-100 blur-none transition-[opacity,filter] duration-(--duration-base) ease-out';
	const textHidden =
		'opacity-0 blur-[4px] transition-[opacity,filter] duration-(--duration-fast) ease-in';
	const iconShown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy)_var(--hold-swap-delay),opacity_var(--duration-base)_var(--ease-out)_var(--hold-swap-delay),filter_var(--duration-base)_var(--ease-out)_var(--hold-swap-delay)]';
	const iconHidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

{#snippet confirmedContent(shown: boolean)}
	<span class="col-start-1 row-start-1 inline-flex items-center justify-center gap-2">
		<Check class={cn('shrink-0', shown ? iconShown : iconHidden)} />
		{#if confirmedLabel}
			<span class={shown ? textShown : textHidden}>{confirmedLabel}</span>
		{/if}
	</span>
{/snippet}

<button
	{...restProps}
	bind:this={ref}
	type="button"
	{disabled}
	aria-describedby={[restProps['aria-describedby'], hintId].filter(Boolean).join(' ')}
	data-phase={phase}
	style:--hold-swap-delay={lids > 0 ? 'var(--duration-base)' : '0ms'}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background relative isolate inline-flex max-w-full shrink-0 touch-manipulation items-center justify-center overflow-hidden rounded-full font-medium whitespace-nowrap transition-[background-color,scale] duration-(--duration-fast) ease-out outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[phase=holding]:scale-[0.97]',
		tones[variant].rest,
		sizes[size],
		className
	)}
	{onpointerdown}
	{onpointermove}
	onpointerup={onpointerend}
	onpointercancel={onpointerend}
	onlostpointercapture={onpointerend}
	{onclick}
	{onkeydown}
	{onkeyup}
	onblur={release}
	oncontextmenu={(event) => {
		// A long press on touch screens would otherwise open the context menu.
		if (phase === 'holding') event.preventDefault();
	}}
>
	<!-- The fill: a second copy of the label in the fill colors, clipped to the
	     progress. Positioned, so it paints over the resting label. -->
	<span
		aria-hidden="true"
		class={cn(
			'absolute inset-0 flex items-center justify-center',
			tones[variant].fill,
			sizes[size]
		)}
		style:clip-path="inset(0 {(1 - progress) * 100}% 0 0 round 9999px)"
	>
		<span class="grid">
			<span
				class={cn(
					'col-start-1 row-start-1 inline-flex items-center justify-center gap-2',
					done ? cn(textHidden, 'delay-(--hold-swap-delay)') : restShown
				)}
			>
				{@render children()}
			</span>
			{@render confirmedContent(done)}
		</span>
	</span>
	<!-- Both states share one grid cell, so the pill keeps the wider one's width
	     and never jumps when they swap. The label is transparent rather than
	     invisible while done, so the button keeps its name. -->
	<span class="grid">
		<span
			class={cn(
				'col-start-1 row-start-1 inline-flex items-center justify-center gap-2',
				done && 'opacity-0'
			)}
		>
			{@render children()}
		</span>
		<!-- Only holds the width. -->
		<span aria-hidden="true" class="invisible col-start-1 row-start-1 grid">
			{@render confirmedContent(false)}
		</span>
	</span>
</button>
<span id={hintId} class="sr-only">Press and hold to confirm</span>
<span class="sr-only" aria-live="polite">{done ? (confirmedLabel ?? 'Confirmed') : ''}</span>

<style>
	/* A small gulp as the hold lands, the way a bin jolts when its lid drops. */
	button[data-phase='done'] {
		animation: hold-gulp var(--duration-slow) var(--ease-out) var(--duration-instant);
	}

	@keyframes hold-gulp {
		35% {
			scale: 0.97;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		button[data-phase='done'] {
			animation: none;
		}
	}
</style>
