<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { confetti, confettiBursts, type ConfettiBurst } from './confetti.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/**
		 * Called on every celebration: `pop` for a click or a hold let go early,
		 * `blast` when a hold burns all the way down.
		 */
		onCelebrate?: (kind: 'pop' | 'blast') => void;
		/**
		 * Holding lights a fuse that burns across the button while it shakes and
		 * spits sparks, then goes off in a full-screen blast. Letting go early
		 * still pops, bigger the longer it burned. Off, every press just pops.
		 */
		hold?: boolean;
		/** How long the fuse burns before the blast, in milliseconds. */
		duration?: number;
		/**
		 * Colors for the confetti, as custom properties or CSS colors. Defaults to
		 * the neutral ink tones.
		 */
		colors?: string[];
		/** Announced, and shown as a check, after a blast or when motion is reduced. */
		celebratedLabel?: string;
		/** Blocks celebrating. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
		/** The label, such as "Celebrate". */
		children: Snippet;
	};

	let {
		onCelebrate,
		hold: holdable = true,
		duration = 1500,
		colors,
		celebratedLabel = 'Celebrated',
		disabled = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const hintId = `${uid}-hint`;

	/** A press shorter than this is a click and gets the small pop. */
	const clickFor = durations.fast;

	let fuse = $state<HTMLSpanElement | null>(null);
	let ring = $state<HTMLSpanElement | null>(null);
	let checked = $state(false);
	let checkTimer: ReturnType<typeof setTimeout> | undefined;
	let pointerId: number | null = null;
	let heldKey: string | null = null;
	let charge: { start: number; frame: number; buzzed: number } | null = null;
	/** Read when a press starts, so the fuse burns from the side reading starts on. */
	let rtl = false;
	let recoil: Animation | undefined;
	let shock: Animation | undefined;

	const between = (a: number, b: number) => a + Math.random() * (b - a);
	const vibrate = (pattern: number | number[]) =>
		typeof navigator !== 'undefined' && navigator.vibrate?.(pattern);

	/** A motion token as a Web Animations easing string. */
	const token = (name: string) =>
		(ref && getComputedStyle(ref).getPropertyValue(name).trim()) || 'ease-out';

	function burn(progress: number) {
		// Burns across the button from the start edge, like a lit fuse.
		const rest = `${(1 - progress) * 100}%`;
		if (fuse) fuse.style.clipPath = `inset(0 ${rtl ? 0 : rest} 0 ${rtl ? rest : 0} round 9999px)`;
	}

	function settle() {
		if (ref) {
			ref.style.transform = '';
			ref.removeAttribute('data-charging');
		}
		burn(0);
	}

	function confirm() {
		checked = true;
		clearTimeout(checkTimer);
		checkTimer = setTimeout(() => (checked = false), durations.ambient);
	}

	const burst = (base: ConfettiBurst): ConfettiBurst => (colors ? { ...base, colors } : base);

	function pop(progress = 0) {
		onCelebrate?.('pop');
		if (!ref || prefersReducedMotion()) return confirm();
		// A fuse let go early still counts for something: the pop grows with how
		// far it burned.
		confetti(
			ref,
			burst({
				...confettiBursts.pop,
				count: Math.round(confettiBursts.pop.count + 160 * progress),
				speed: [confettiBursts.pop.speed[0], confettiBursts.pop.speed[1] + 700 * progress],
				spread: confettiBursts.pop.spread + progress * 45
			})
		);
	}

	function blast() {
		onCelebrate?.('blast');
		confirm();
		vibrate([40, 30, 80]);
		if (!ref || prefersReducedMotion()) return;
		confetti(ref, burst(confettiBursts.blast));
		if (!ref.animate) return;
		// The button takes the recoil: it bursts outward, overshoots back, and
		// wobbles to rest, like something that just went off in your hand.
		recoil?.cancel();
		recoil = ref.animate(
			[
				{ transform: 'scale(0.88)' },
				{ transform: 'scale(1.18) rotate(-3deg)', offset: 0.18 },
				{ transform: 'scale(0.94) rotate(2deg)', offset: 0.42 },
				{ transform: 'scale(1.03) rotate(-1deg)', offset: 0.68 },
				{ transform: 'none' }
			],
			{ duration: durations.deliberate, easing: token('--ease-out') }
		);
		// The shockwave: one ring pushed out and faded.
		shock?.cancel();
		shock = ring?.animate(
			[
				{ scale: 0.6, opacity: 0.5 },
				{ scale: 5.5, opacity: 0 }
			],
			{ duration: durations.deliberate, easing: token('--ease-out') }
		);
	}

	function step(now: number) {
		const h = charge;
		if (!h || !ref) return;
		const held = now - h.start;
		if (held > clickFor) {
			const progress = Math.min((held - clickFor) / duration, 1);
			ref.setAttribute('data-charging', '');
			burn(progress);
			if (!prefersReducedMotion()) {
				// Shakes harder as it nears the end, squeezing down as if under
				// pressure. Fresh jitter every frame reads as vibration.
				const reach = 0.4 + 3.2 * progress * progress;
				const turn = between(-1, 1) * 2.5 * progress * progress;
				ref.style.transform = `translate(${between(-reach, reach)}px, ${between(-reach, reach) * 0.6}px) rotate(${turn}deg) scale(${0.96 - 0.08 * progress})`;
				// Sparks spit from the burning end, more as it grows.
				if (Math.random() < 0.15 + 0.6 * progress) {
					const box = ref.getBoundingClientRect();
					confetti(
						{
							x: rtl ? box.right - box.width * progress : box.left + box.width * progress,
							y: box.top + box.height / 2
						},
						burst({
							count: 1 + Math.round(progress * 2),
							spread: 52,
							speed: [120, 320 + 300 * progress],
							life: [0.35, 0.8],
							width: 0,
							size: 0.55
						}),
						{ theme: ref }
					);
				}
			}
			// Short buzzes that come closer together, where phones allow it.
			if (now - h.buzzed > 220 - 150 * progress) {
				vibrate(8);
				h.buzzed = now;
			}
			if (progress >= 1) {
				charge = null;
				settle();
				blast();
				return;
			}
		}
		h.frame = requestAnimationFrame(step);
	}

	function press() {
		if (disabled || charge) return;
		rtl = !!ref && getComputedStyle(ref).direction === 'rtl';
		if (!holdable || typeof requestAnimationFrame === 'undefined') {
			charge = { start: 0, frame: 0, buzzed: 0 };
			return;
		}
		charge = { start: performance.now(), frame: 0, buzzed: 0 };
		charge.frame = requestAnimationFrame(step);
	}

	function release() {
		const h = charge;
		if (!h) return;
		cancelAnimationFrame(h.frame);
		charge = null;
		const progress = holdable
			? Math.min(Math.max((performance.now() - h.start - clickFor) / duration, 0), 1)
			: 0;
		settle();
		pop(progress);
	}

	function cancel() {
		pointerId = null;
		heldKey = null;
		if (!charge) return;
		cancelAnimationFrame(charge.frame);
		charge = null;
		settle();
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLButtonElement }) {
		if (event.button !== 0 || pointerId !== null) return;
		pointerId = event.pointerId;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		press();
	}

	function onpointerup(event: PointerEvent) {
		if (event.pointerId !== pointerId) return;
		pointerId = null;
		release();
	}

	function onpointercancel(event: PointerEvent) {
		if (event.pointerId === pointerId) cancel();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== ' ' && event.key !== 'Enter') return;
		// Enter would otherwise click, and a held key repeats; neither may restart the fuse.
		event.preventDefault();
		if (event.repeat || heldKey !== null) return;
		heldKey = event.key;
		press();
	}

	function onkeyup(event: KeyboardEvent) {
		if (event.key !== heldKey) return;
		event.preventDefault();
		heldKey = null;
		release();
	}

	// Screen readers in browse mode, switch access, and voice control click
	// without a pointer or key behind it. They cannot hold, so they pop.
	function onclick(event: MouseEvent) {
		if (event.detail !== 0 || pointerId !== null || heldKey !== null || disabled) return;
		pop();
	}

	$effect(() => () => {
		if (charge) cancelAnimationFrame(charge.frame);
		clearTimeout(checkTimer);
		recoil?.cancel();
		shock?.cancel();
	});

	const shownIcon =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]';
	const hiddenIcon =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

<span class="relative inline-grid">
	<!-- Sized to the button, so the shockwave starts at its edge. -->
	<span
		bind:this={ring}
		aria-hidden="true"
		class="border-primary pointer-events-none col-start-1 row-start-1 rounded-full border-2 opacity-0"
	></span>
	<button
		{...restProps}
		bind:this={ref}
		type="button"
		{disabled}
		aria-describedby={[restProps['aria-describedby'], hintId].filter(Boolean).join(' ')}
		data-celebrated={checked ? '' : undefined}
		class={cn(
			'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background relative col-start-1 row-start-1 inline-flex h-10 touch-none items-center justify-center overflow-hidden rounded-full px-5 text-sm font-medium shadow-sm outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
			'transition-[background-color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] data-charging:transition-none motion-reduce:transition-[background-color]',
			className
		)}
		{onpointerdown}
		{onpointerup}
		{onpointercancel}
		onlostpointercapture={onpointercancel}
		{onkeydown}
		{onkeyup}
		{onclick}
		onblur={cancel}
		oncontextmenu={(event) => {
			// A long press on touch screens would otherwise open the context menu.
			if (charge) event.preventDefault();
		}}
	>
		<!-- The lit fuse: a lighter band burning across the button. -->
		<span
			bind:this={fuse}
			aria-hidden="true"
			data-slot="confetti-fuse"
			class="bg-primary-foreground/25 pointer-events-none absolute inset-0 rounded-full"
			style="clip-path: inset(0 100% 0 0 round 9999px)"
		></span>
		<!-- Both states share one grid cell, so the swap never resizes the button.
		     The label stays in the tree, so the button keeps its name. -->
		<span class="relative grid">
			<span
				class={cn(
					'col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-opacity ease-out',
					checked ? 'opacity-0 duration-(--duration-instant)' : 'duration-(--duration-base)'
				)}
			>
				{@render children()}
			</span>
			<span aria-hidden="true" class="col-start-1 row-start-1 flex items-center justify-center">
				<Check class={cn('size-4', checked ? shownIcon : hiddenIcon)} />
			</span>
		</span>
	</button>
</span>
<span id={hintId} class="sr-only">
	{holdable ? 'Click to celebrate, or hold for a bigger one' : 'Click to celebrate'}
</span>
<span class="sr-only" aria-live="polite">{checked ? celebratedLabel : ''}</span>
