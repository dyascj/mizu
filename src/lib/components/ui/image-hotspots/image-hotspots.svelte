<script lang="ts" module>
	export type Hotspot = {
		/** Position across the image, from 0 at the left edge to 1 at the right. */
		x: number;
		/** Position down the image, from 0 at the top to 1 at the bottom. */
		y: number;
		/** Short name. Also the hotspot button's accessible name. */
		title: string;
		/** A sentence or two about this point. */
		body: string;
	};

	/** A rectangle on the image, as fractions of its width and height. */
	export type HotspotRegion = { x: number; y: number; w: number; h: number };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		SpringValue,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { MARGIN, place, type Side } from './placement.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The labeled points, in reading order. */
		hotspots: Hotspot[];
		/**
		 * The picture, drawn to fill a box of `aspect`. It is fitted inside the
		 * stage like `object-fit: contain` and pinned to the top, so on a tall
		 * narrow stage the free room collects below it for the card.
		 */
		image: Snippet;
		/** Accessible name for the whole figure. */
		label: string;
		/** The picture's width divided by its height. */
		aspect?: number;
		/** The part of the picture the card should keep clear of when it can. */
		subject?: HotspotRegion;
		/** The open hotspot's index, or null when the card is away. Bindable. */
		active?: number | null;
		/** Called when a hotspot opens or the card is put away. */
		onActiveChange?: (index: number | null) => void;
		/** The stage element. */
		ref?: HTMLDivElement | null;
		/** Classes for the stage. Give it its shape here, such as an aspect ratio. */
		class?: string;
	};

	let {
		hotspots,
		image,
		label,
		aspect = 3 / 4,
		subject,
		active = $bindable(null),
		onActiveChange,
		ref = $bindable(null),
		class: className,
		onkeydown,
		...restProps
	}: Props = $props();

	/** Below this stage width the card spans the stage instead of sitting beside the picture. */
	const narrowWidth = 520;
	const cardWidth = 188;
	// Before the words are measured, the card assumes a two-line body.
	const cardHeight = 136;
	const cardHeightNarrow = 124;
	/** The card grows with its words up to this height, then scrolls. */
	const cardMaxHeight = 280;
	/** The card's padding on each side, matching `p-3.5`. */
	const cardPadding = 14;
	/** The line starts just outside the hotspot's dot rather than at its center. */
	const dotRadius = 9;

	const uid = $props.id();
	const cardId = `${uid}-card`;

	let size = $state({ w: 0, h: 0 });
	// The last opened hotspot, so the roving tab stop and the card's content
	// survive closing, and a closing card keeps its side.
	let focused = $state(0);
	// Clamped, so a shorter list still leaves a hotspot to tab to.
	const focusIndex = $derived(Math.min(focused, Math.max(hotspots.length - 1, 0)));
	// Rings breathe a couple of times to show where to look, then hold still.
	let explored = $state(false);
	const buttons: HTMLButtonElement[] = [];

	const narrow = $derived(size.w > 0 && size.w < narrowWidth);
	const cardW = $derived(narrow ? size.w - MARGIN * 2 : cardWidth);
	// Sized to the words, so a longer body is never cut off. Past the cap, or
	// on a short stage, it scrolls instead.
	let contentHeight = $state(0);
	const maxCardH = $derived(
		Math.max(cardHeightNarrow, Math.min(cardMaxHeight, size.h - MARGIN * 2))
	);
	const naturalH = $derived(
		contentHeight ? contentHeight + cardPadding * 2 : narrow ? cardHeightNarrow : cardHeight
	);
	const cardH = $derived(Math.min(naturalH, maxCardH));
	const overflowing = $derived(naturalH > maxCardH);

	// Same geometry the CSS gives the picture: fitted, centered, and on top.
	const boxW = $derived(Math.min(size.w, size.h * aspect));
	const boxH = $derived(boxW / aspect);
	const boxX = $derived((size.w - boxW) / 2);
	const toStage = (point: { x: number; y: number }) => ({
		x: boxX + point.x * boxW,
		y: point.y * boxH
	});

	const shown = $derived(
		Math.min(Math.max(active ?? focusIndex, 0), Math.max(hotspots.length - 1, 0))
	);
	const isOpen = $derived(active !== null && size.w > 0 && hotspots.length > 0);
	const point = $derived(hotspots[shown] ? toStage(hotspots[shown]) : { x: 0, y: 0 });
	const target = $derived.by(() => {
		if (!size.w || !hotspots[shown]) return { side: 'right' as Side, x: 0, y: 0 };
		const others = hotspots.filter((_, index) => index !== shown).map(toStage);
		const region = subject
			? {
					x: boxX + subject.x * boxW,
					y: subject.y * boxH,
					w: subject.w * boxW,
					h: subject.h * boxH
				}
			: null;
		return place(point.x, point.y, size.w, size.h, cardW, cardH, others, region);
	});
	// The card grows out of, and closes toward, the edge facing its hotspot.
	const origin = $derived(
		{
			right: 'left center',
			left: 'right center',
			bottom: 'center top',
			top: 'center bottom'
		}[target.side]
	);

	let card: HTMLDivElement | null = null;
	let content = $state<HTMLDivElement | null>(null);

	// Measures the words at the card's width, whatever height the card has now.
	$effect(() => {
		const node = content;
		if (!node || typeof ResizeObserver === 'undefined') return;
		const measure = () => (contentHeight = node.offsetHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	});
	let lines: SVGPathElement[] = [];
	let end: SVGCircleElement | null = null;

	// A little give on the glide, so the card reads as carried, not teleported.
	const hx = new SpringValue(0, { preset: springPresets.smooth, onUpdate: draw });
	const hy = new SpringValue(0, { preset: springPresets.smooth, onUpdate: draw });
	const cx = new SpringValue(0, { preset: springPresets.smooth, onUpdate: draw });
	const cy = new SpringValue(0, { preset: springPresets.smooth, onUpdate: draw });

	/**
	 * The line runs from the hotspot to the closest point on the card, so it
	 * stays attached whichever side the card has moved to, and bends with the
	 * card as it travels instead of being redrawn.
	 */
	function draw() {
		const px = hx.current;
		const py = hy.current;
		const ex = Math.min(Math.max(px, cx.current), cx.current + cardW);
		const ey = Math.min(Math.max(py, cy.current), cy.current + cardH);
		const length = Math.hypot(ex - px, ey - py) || 1;
		const sx = px + ((ex - px) / length) * dotRadius;
		const sy = py + ((ey - py) / length) * dotRadius;
		const d = `M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
		for (const line of lines) line?.setAttribute('d', d);
		end?.setAttribute('cx', ex.toFixed(1));
		end?.setAttribute('cy', ey.toFixed(1));
		if (card) card.style.translate = `${cx.current.toFixed(1)}px ${cy.current.toFixed(1)}px`;
	}

	let wasOpen = false;
	// Opening jumps into place; switching glides and keeps its velocity.
	$effect(() => {
		const { x: px, y: py } = point;
		const { x: tx, y: ty } = target;
		void cardW;
		void cardH;
		if (!isOpen) {
			wasOpen = false;
			return;
		}
		if (!wasOpen) {
			hx.jump(px);
			hy.jump(py);
			cx.jump(tx);
			cy.jump(ty);
		} else {
			hx.set(px);
			hy.set(py);
			cx.set(tx);
			cy.set(ty);
		}
		wasOpen = true;
	});

	$effect(() => () => {
		for (const spring of [hx, hy, cx, cy]) spring.stop();
	});

	$effect(() => {
		if (!ref || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			size = { w: entry.contentRect.width, h: entry.contentRect.height };
		});
		observer.observe(ref);
		return () => observer.disconnect();
	});

	function open(index: number) {
		focused = index;
		explored = true;
		if (active === index) return;
		active = index;
		onActiveChange?.(index);
	}

	function close() {
		if (active === null) return;
		active = null;
		onActiveChange?.(null);
	}

	// A press anywhere outside the stage puts the card away.
	$effect(() => {
		if (active === null) return;
		const ondown = (event: PointerEvent) => {
			if (!ref?.contains(event.target as Node)) close();
		};
		document.addEventListener('pointerdown', ondown);
		return () => document.removeEventListener('pointerdown', ondown);
	});

	function handleKey(event: KeyboardEvent) {
		const count = hotspots.length;
		if (!count) return;
		const from = active ?? focusIndex;
		// The card takes focus only to be scrolled, so its own keys scroll it.
		const inCard = card !== null && card.contains(event.target as Node);
		let next: number | null = null;
		if (inCard && event.key !== 'Escape') return;
		// The points are in reading order, so right to left the side arrows swap.
		const rtl = ref !== null && getComputedStyle(ref).direction === 'rtl';
		const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
		const back = rtl ? 'ArrowRight' : 'ArrowLeft';
		if (event.key === forward || event.key === 'ArrowDown') next = (from + 1) % count;
		else if (event.key === back || event.key === 'ArrowUp') next = (from - 1 + count) % count;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = count - 1;
		else if (event.key === 'Escape' && active !== null) {
			event.preventDefault();
			close();
			buttons[from]?.focus();
			return;
		}
		if (next === null) return;
		event.preventDefault();
		open(next);
		buttons[next]?.focus();
	}

	// The card's words swap with a soft blur, the old ones leaving faster.
	function textIn(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * 4}px`
		};
	}

	function textOut(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 2}px)`
		};
	}

	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={label}
	data-slot="image-hotspots"
	data-open={isOpen ? '' : undefined}
	class={cn(
		'bg-secondary [container-type:size] relative aspect-[8/5] w-full overflow-hidden rounded-2xl select-none',
		className
	)}
	onkeydown={(event) => {
		onkeydown?.(event);
		if (!event.defaultPrevented) handleKey(event);
	}}
>
	<!-- Fitted like object-fit: contain and pinned to the top, so on a tall
	     narrow stage the free room collects below for the card. -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2"
		style:width="min(100cqw, {aspect * 100}cqh)"
		style:aspect-ratio={aspect}
	>
		<div class="absolute inset-0" aria-hidden="true">{@render image()}</div>
		{#each hotspots as hotspot, index (hotspot.title)}
			{@const current = active === index}
			<button
				bind:this={buttons[index]}
				type="button"
				aria-label={hotspot.title}
				aria-expanded={current}
				aria-controls={cardId}
				tabindex={index === focusIndex ? 0 : -1}
				class="group/spot focus-visible:ring-ring absolute z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full transition-[scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96]"
				style:left="{hotspot.x * 100}%"
				style:top="{hotspot.y * 100}%"
				style:--index={index}
				onclick={() => (current ? close() : open(index))}
				onfocus={() => (focused = index)}
			>
				{#if !explored && !current}
					<!-- Staggered, so the points breathe out of step, like a room of
					     people rather than a metronome. -->
					<span class="hotspot-ring bg-background absolute size-3.5 rounded-full"></span>
				{/if}
				<span
					class={cn(
						'border-background bg-foreground relative size-3.5 rounded-full border-2 shadow-md transition-[scale] duration-(--duration-base) ease-out',
						current ? 'scale-125' : 'group-hover/spot:scale-110'
					)}
				></span>
			</button>
		{/each}
	</div>

	<svg
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
	>
		<!-- A pale halo under the line keeps it readable where it crosses dark
		     parts of the picture. -->
		{#each ['stroke-background/70 [stroke-width:3.5]', 'stroke-foreground [stroke-width:1.25]'] as stroke, index (index)}
			<path
				bind:this={lines[index]}
				d="M0 0"
				fill="none"
				stroke-linecap="round"
				pathLength="1"
				stroke-dasharray="1"
				class={cn(
					stroke,
					'transition-[stroke-dashoffset,opacity]',
					isOpen
						? 'opacity-100 duration-(--duration-slow) ease-out [stroke-dashoffset:0]'
						: 'opacity-0 duration-(--duration-fast) ease-in [stroke-dashoffset:1] motion-reduce:[stroke-dashoffset:0]',
					'motion-reduce:transition-opacity'
				)}
			/>
		{/each}
		<circle
			bind:this={end}
			r="2.5"
			class={cn(
				'fill-foreground transition-opacity',
				isOpen
					? 'opacity-100 delay-(--duration-base) duration-(--duration-fast) ease-out motion-reduce:delay-0'
					: 'opacity-0 duration-(--duration-instant) ease-in'
			)}
		/>
	</svg>

	<!-- Focusable only while its words overflow, so the keyboard can scroll them. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={card}
		id={cardId}
		aria-live="polite"
		class={cn(
			'bg-popover text-popover-foreground focus-visible:ring-ring absolute top-0 left-0 z-20 overflow-hidden rounded-2xl p-3.5 shadow-lg transition-[opacity,scale,filter,height] outline-none focus-visible:ring-2',
			overflowing && 'overflow-y-auto overscroll-contain',
			isOpen
				? 'opacity-100 blur-none duration-(--duration-base) ease-out'
				: 'pointer-events-none scale-[0.97] opacity-0 blur-[2px] duration-(--duration-fast) ease-in motion-reduce:scale-100'
		)}
		style:width="{cardW}px"
		style:height="{cardH}px"
		style:transform-origin={origin}
		aria-hidden={!isOpen}
		tabindex={isOpen && overflowing ? 0 : undefined}
	>
		{#if size.w > 0 && hotspots[shown]}
			{@const spot = hotspots[shown]}
			<div bind:this={content} data-slot="image-hotspots-content" class="grid">
				{#key shown}
					<div class="col-start-1 row-start-1" in:textIn out:textOut>
						<p class="text-muted-foreground text-xs font-medium tabular-nums">
							{pad(shown + 1)} / {pad(hotspots.length)}
						</p>
						<p class="mt-1 text-[15px]/5 font-semibold">{spot.title}</p>
						<p class="text-muted-foreground mt-1 text-sm/5 text-pretty">{spot.body}</p>
					</div>
				{/key}
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes hotspot-breathe {
		0% {
			scale: 1;
			opacity: 0.7;
		}
		70%,
		100% {
			scale: 2.4;
			opacity: 0;
		}
	}
	/* Twice each, staggered, then still: a cue to look, not an idle loop. */
	.hotspot-ring {
		opacity: 0;
		animation: hotspot-breathe var(--duration-ambient) var(--ease-out) 2 both;
		animation-delay: calc(var(--index, 0) * var(--stagger) * 4);
	}
	@media (prefers-reduced-motion: reduce) {
		.hotspot-ring {
			animation: none;
		}
	}
</style>
