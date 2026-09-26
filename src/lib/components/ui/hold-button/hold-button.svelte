<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/** How long the press must last before it confirms, in milliseconds. */
		duration?: number;
		/** Called once each time a hold runs to completion. */
		onConfirm: () => void;
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
		/** The label, such as "Hold to delete". */
		children: Snippet;
	};

	let {
		duration = 1200,
		onConfirm,
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
	let phase = $state<'idle' | 'holding' | 'retracting' | 'done'>('idle');
	let frame = 0;
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let pointerId: number | null = null;
	let heldKey: string | null = null;

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
		// Resume from wherever a retracting fill currently is.
		const from = progress * duration;
		animate((elapsed) => {
			progress = Math.min(1, (from + elapsed) / duration);
			if (progress < 1) return true;
			phase = 'done';
			resetTimer = setTimeout(retract, confirmation);
			onConfirm();
			return false;
		});
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
			return;
		}
		const from = progress;
		const { duration: settle, easing } = springs.snappy;
		animate((elapsed) => {
			const t = Math.min(1, elapsed / settle);
			progress = Math.max(0, from * (1 - easing(t)));
			if (t < 1) return true;
			phase = 'idle';
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
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	{disabled}
	aria-describedby={[restProps['aria-describedby'], hintId].filter(Boolean).join(' ')}
	data-phase={phase}
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
	{onkeydown}
	{onkeyup}
	onblur={release}
	oncontextmenu={(event) => {
		// A long press on touch screens would otherwise open the context menu.
		if (phase === 'holding') event.preventDefault();
	}}
>
	<span class={cn('inline-flex items-center gap-2', phase === 'done' && 'invisible')}>
		{@render children()}
	</span>
	<span
		aria-hidden="true"
		class={cn(
			'absolute inset-0 flex items-center justify-center gap-2',
			tones[variant].fill,
			sizes[size]
		)}
		style:clip-path="inset(0 {(1 - progress) * 100}% 0 0 round 9999px)"
	>
		{#if phase === 'done'}
			<Check
				class="[transition:scale_var(--duration-spring-bouncy)_var(--ease-spring-bouncy),opacity_var(--duration-fast)_var(--ease-out)] starting:scale-50 starting:opacity-0"
			/>
		{:else}
			{@render children()}
		{/if}
	</span>
</button>
<span id={hintId} class="sr-only">Press and hold to confirm</span>
<span class="sr-only" aria-live="polite">{phase === 'done' ? 'Confirmed' : ''}</span>
