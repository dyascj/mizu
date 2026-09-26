<script lang="ts" module>
	export type Carousel3dItem = {
		/** The card's heading, also read out when it comes to the front. */
		title: string;
		/** A short line under the heading. */
		description?: string;
	};
</script>

<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { Button } from '$lib/components/ui/button';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The cards around the ring. Three or more read as a ring. */
		items: Carousel3dItem[];
		/** Accessible name for the carousel, such as "Models". */
		label: string;
		/** The card at the front. Bind to follow or steer the ring. */
		index?: number;
		/** Called when a new card is chosen, as soon as the ring heads for it. */
		onIndexChange?: (index: number) => void;
		/** Name of the button that turns to the previous card. */
		previousLabel?: string;
		/** Name of the button that turns to the next card. */
		nextLabel?: string;
		/** The outer element, holding the ring and its controls. */
		ref?: HTMLDivElement | null;
		/** Classes for the outer element. */
		class?: string;
	};

	let {
		items,
		label,
		index = $bindable(0),
		onIndexChange,
		previousLabel = 'Previous card',
		nextLabel = 'Next card',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const CARD_W = 168;
	const CARD_H = 208;
	/** Space between neighbouring cards along the ring. */
	const GAP = 24;
	const PERSPECTIVE = 1100;
	/**
	 * Dragging this far turns the ring by one card: close to the arc a front
	 * card travels, so the card under the finger stays under it.
	 */
	const PX_PER_CARD = 180;
	/**
	 * Scroll-view deceleration per millisecond. Projecting the release velocity
	 * picks the card a flick is heading for, not the one nearest the release.
	 */
	const DECELERATION = 0.998;
	/** Past this the pointer is dragging, not clicking a card. */
	const CLICK_SLOP = 6;
	/** Velocity is read over this window, so a pause before letting go reads as still. */
	const SAMPLE_WINDOW = 100;
	/** How much a card shrinks and dims by the time it reaches the back. */
	const BACK_SCALE = 0.9;
	const BACK_OPACITY = 0.35;
	/** Reduced motion lays the ring out flat; neighbours sit at half strength, blank. */
	const ROW_OPACITY = 0.5;

	const count = $derived(items.length);
	const radius = $derived(count > 2 ? (CARD_W + GAP) / 2 / Math.tan(Math.PI / count) : 0);

	let stage = $state<HTMLDivElement | null>(null);
	let reduce = $state(false);
	/** Where the ring is heading, counted in cards and never wrapped. */
	let target = untrack(() => index);
	let drag: {
		id: number;
		x: number;
		from: number;
		card: number | null;
		moved: boolean;
		samples: { t: number; value: number }[];
	} | null = null;

	/** The ring's turn, counted in cards and never wrapped, so a spin can pass any number of turns. */
	const rotation: SpringValue = new SpringValue(
		untrack(() => index),
		{
			preset: springPresets.smooth,
			onUpdate: paint
		}
	);

	const wrap = (value: number) => ((Math.round(value) % count) + count) % count;

	/** The copy of `i` nearest the current rotation, so a jump always turns the short way round. */
	const nearestTurn = (i: number, r: number) => i + Math.round((r - i) / count) * count;

	/** A card's transform, opacity, and text opacity at rotation `r`. */
	function place(i: number, r: number) {
		const d = (((i - r) % count) + count) % count;
		// Signed distance from the front in cards, wrapped the short way round.
		const o = d > count / 2 ? d - count : d;
		if (reduce) {
			return {
				transform: `translateX(${(o * (CARD_W + GAP)).toFixed(2)}px)`,
				opacity: Math.abs(o) < 0.5 ? 1 : ROW_OPACITY,
				// Neighbours peek in blank, like the back of the ring.
				text: Math.abs(o) < 0.5 ? 1 : 0
			};
		}
		// 1 facing you, -1 facing away. Every depth cue reads from this one number.
		const facing = Math.cos((o / count) * Math.PI * 2);
		const near = (facing + 1) / 2;
		return {
			transform: `rotateY(${((o / count) * 360).toFixed(3)}deg) translateZ(${radius.toFixed(2)}px) scale(${(BACK_SCALE + (1 - BACK_SCALE) * near).toFixed(4)})`,
			opacity: BACK_OPACITY + (1 - BACK_OPACITY) * near,
			// Text is gone before a card turns side on, so nobody reads a card
			// mirrored through the ring; the back half shows blank faces.
			text: Math.min(Math.max((facing - 0.1) / 0.5, 0), 1)
		};
	}

	function paint(r: number = rotation.current) {
		if (!stage || count === 0) return;
		const cards = stage.querySelectorAll<HTMLElement>('[data-carousel-card]');
		cards.forEach((card, i) => {
			const { transform, opacity, text } = place(i, r);
			card.style.transform = transform;
			card.style.opacity = opacity.toFixed(3);
			card.style.setProperty('--carousel-text', text.toFixed(3));
		});
	}

	function goTo(next: number, velocity?: number) {
		target = next;
		const i = wrap(next);
		if (i !== index) {
			index = i;
			onIndexChange?.(i);
		}
		rotation.set(next, { velocity });
	}

	/** Presses stack: two quick presses aim two cards ahead instead of restarting mid-turn. */
	const step = (direction: 1 | -1) => goTo(target + direction);

	const settle = () => goTo(Math.round(rotation.current));

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		step(event.key === 'ArrowLeft' ? -1 : 1);
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		// A second finger mid-drag would make the ring jump to it.
		if (event.button !== 0 || drag) return;
		// Grabbing a spinning ring stops it exactly where it is.
		rotation.stop();
		const card = (event.target as HTMLElement).closest<HTMLElement>('[data-carousel-card]');
		drag = {
			id: event.pointerId,
			x: event.clientX,
			from: rotation.current,
			card: card ? Number(card.dataset.carouselCard) : null,
			moved: false,
			samples: []
		};
		event.currentTarget.setPointerCapture?.(event.pointerId);
	}

	function onpointermove(event: PointerEvent) {
		if (!drag || drag.id !== event.pointerId) return;
		const dx = event.clientX - drag.x;
		if (!drag.moved) {
			if (Math.abs(dx) < CLICK_SLOP) return;
			drag.moved = true;
			// Start from the finger, not from where the slop ran out.
			drag.x = event.clientX;
			return;
		}
		// Dragging right brings the card on the left forward.
		const value = drag.from - dx / PX_PER_CARD;
		const now = performance.now();
		drag.samples = [...drag.samples.filter((s) => now - s.t < SAMPLE_WINDOW), { t: now, value }];
		rotation.jump(value);
	}

	/** Cards per second over the last few moves. */
	function releaseVelocity(samples: { t: number; value: number }[]) {
		const now = performance.now();
		const recent = samples.filter((s) => now - s.t < SAMPLE_WINDOW);
		if (recent.length < 2) return 0;
		const first = recent[0];
		const last = recent[recent.length - 1];
		return last.t > first.t ? ((last.value - first.value) / (last.t - first.t)) * 1000 : 0;
	}

	function onpointerup(event: PointerEvent) {
		if (!drag || drag.id !== event.pointerId) return;
		const { moved, card, samples } = drag;
		drag = null;
		if (moved) {
			const velocity = releaseVelocity(samples);
			const projected = ((velocity / 1000) * DECELERATION) / (1 - DECELERATION);
			// Capped at one full turn, so a wild flick never loses your place.
			const reach = Math.max(-count, Math.min(projected, count));
			goTo(Math.round(rotation.current + reach), velocity / 60);
		} else if (card !== null) {
			goTo(nearestTurn(card, rotation.current));
		} else {
			settle();
		}
	}

	function onpointercancel(event: PointerEvent) {
		if (drag?.id !== event.pointerId) return;
		drag = null;
		settle();
	}

	// Reduced motion lays the ring out flat, and follows the setting live.
	$effect(() => {
		if (typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reduce = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	// Repaint whenever the layout inputs change.
	$effect(() => {
		void [stage, reduce, count, radius];
		untrack(() => paint());
	});

	// Follow an index set from outside.
	$effect(() => {
		const next = index;
		untrack(() => {
			if (count > 0 && next !== wrap(target)) goTo(nearestTurn(next, rotation.current));
		});
	});

	$effect(() => () => rotation.stop());

	const initial = untrack(() => index);
	const active = $derived(items[index]);
	/** Reduced motion cross-fades which card is lit instead of turning the ring. */
	const fadeClass = 'transition-opacity duration-(--duration-base) ease-out';
	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn('flex w-[min(520px,100%)] flex-col items-center gap-5', className)}
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={stage}
		role="group"
		aria-roledescription="carousel"
		aria-label={label}
		tabindex="0"
		class="focus-visible:ring-ring focus-visible:ring-offset-background relative h-[260px] w-full cursor-grab touch-pan-y overflow-hidden rounded-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:cursor-grabbing"
		{onkeydown}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		{onpointercancel}
	>
		<!-- The edges feather out, so cards drift away rather than hit a wall. The
		     mask lives here, not on the stage, so the focus ring stays whole. -->
		<div
			class="absolute inset-0 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
			style:perspective="{PERSPECTIVE}px"
		>
			<!-- Pushed back by the radius, so the front card sits on the perspective
			     plane and renders at exactly its own size. -->
			<div
				class="absolute top-1/2 left-1/2 transform-3d"
				style:transform={reduce ? 'none' : `translateZ(${-radius}px)`}
			>
				{#each items as item, i (i)}
					{@const start = untrack(() => place(i, initial))}
					<div
						data-carousel-card={i}
						aria-hidden={i !== index}
						class={cn(
							'bg-card absolute flex flex-col justify-between rounded-2xl p-5 shadow-md',
							// Reduced motion: the row cross-fades which card is lit instead.
							reduce && fadeClass
						)}
						style:width="{CARD_W}px"
						style:height="{CARD_H}px"
						style:left="{-CARD_W / 2}px"
						style:top="{-CARD_H / 2}px"
						style:transform={start.transform}
						style:opacity={start.opacity}
						style:--carousel-text={start.text}
					>
						<span
							class={cn(
								'text-muted-foreground font-mono text-xs tabular-nums opacity-(--carousel-text)',
								reduce && fadeClass
							)}
						>
							{pad(i + 1)}
						</span>
						<p
							class={cn(
								'text-foreground text-lg leading-snug font-medium tracking-tight text-balance opacity-(--carousel-text)',
								reduce && fadeClass
							)}
						>
							{item.title}
							{#if item.description}
								<span
									class="text-muted-foreground mt-1.5 block text-sm leading-normal font-normal tracking-normal text-pretty"
								>
									{item.description}
								</span>
							{/if}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<Button variant="secondary" size="icon" aria-label={previousLabel} onclick={() => step(-1)}>
			<ChevronLeft class="size-4" />
		</Button>
		<p
			class="text-muted-foreground w-16 text-center font-mono text-sm tabular-nums"
			aria-live="polite"
			aria-atomic="true"
		>
			<span class="sr-only">{active?.title}, card {index + 1} of {count}</span>
			<span aria-hidden="true">{pad(index + 1)} / {pad(count)}</span>
		</p>
		<Button variant="secondary" size="icon" aria-label={nextLabel} onclick={() => step(1)}>
			<ChevronRight class="size-4" />
		</Button>
	</div>
</div>
