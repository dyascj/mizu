<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { duration, easeIn, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { DOCK_TILE, getDockContext } from './context.js';

	type Props = {
		/** Optional caption shown in a floating bubble above the tile on hover/focus. */
		label?: string;
		/** Render as a link instead of a button. */
		href?: string;
		/**
		 * Makes the tile an app with a running light under it. Clicking a tile
		 * that isn't running launches it: it bounces, like something thrown up
		 * and caught, and the light comes on as it first lands. Clicking a
		 * running tile just activates it. Leave it out for a plain tile.
		 */
		running?: boolean;
		/** Called when a tile that wasn't running is launched. */
		onLaunch?: () => void;
		class?: string;
		ref?: HTMLElement | null;
		children?: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes;

	let {
		label,
		href = undefined,
		running = $bindable(),
		onLaunch,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	const dock = getDockContext();
	const id = $props.id();

	// Resting tile size; the lens scales up from this, never the layout box.
	const BASE = DOCK_TILE;

	/**
	 * The launch: two hops, the second lower. Well past the usual UI budget on
	 * purpose, since it is the "starting up" signal itself, it plays once per
	 * launch, and input is never blocked while it runs.
	 */
	const HOP = duration.slow * 2;
	/** The light comes on as the tile first lands, not on click. */
	const FIRST_LANDING = 0.55;

	// The tile's resting horizontal center, in viewport px. Measured at rest (on
	// mount + resize) so every item, not just the hovered one, has a stable
	// center and the whole row swells together. Measuring while scaled would
	// drift the center, so we never sample mid-magnify.
	let center = $state<number | null>(null);

	function measure() {
		if (!ref || dock.pointerX !== null) return;
		const rect = ref.getBoundingClientRect();
		center = rect.left + rect.width / 2;
	}

	$effect(() => {
		// Runs only in the browser; SSR renders at rest (scale 1).
		measure();
		window.addEventListener('resize', measure);
		// Layout settles a tick after fonts/icons paint; catch that too.
		const frame = requestAnimationFrame(measure);
		return () => {
			window.removeEventListener('resize', measure);
			cancelAnimationFrame(frame);
		};
	});

	// Magnify factor in [1, magnification], falling off with a cosine curve so
	// neighbors ease up too and the row reads as one continuous swell, no jitter.
	const scale = $derived.by(() => {
		const x = dock.pointerX;
		if (x === null || center === null) return 1;
		const delta = Math.abs(x - center);
		if (delta >= dock.distance) return 1;
		// 1 at the cursor → 0 at the edge of the influence radius.
		const falloff = (Math.cos((delta / dock.distance) * Math.PI) + 1) / 2;
		return 1 + (dock.magnification - 1) * falloff;
	});

	// Lift the tile as it grows so the magnified row hugs the dock's top edge,
	// the way Aqua icons rise toward the cursor.
	const lift = $derived(-(scale - 1) * BASE * 0.45);

	/** How far the caption must rise to clear the grown, lifted tile. */
	const clearance = $derived((scale - 1) * BASE - lift);

	/**
	 * The hop's keyframes, sampled from the motion curves: up fast, down with
	 * gravity, each landing the quickest part, with a squash on every landing
	 * so the tile reads as having weight. Transform composes with the lens's
	 * own scale and translate, so a hovered tile hops from where it floats.
	 */
	function hopFrames(): { offset: number; transform: string }[] {
		const heights = [0, -22, 0, -9, 0];
		const heightTimes = [0, 0.3, 0.55, 0.78, 1];
		const squashTimes = [0, 0.3, 0.55, 0.7, 0.8, 1];
		const squashY = [1, 1.04, 0.9, 1.02, 0.96, 1];
		const squashX = [1, 0.97, 1.08, 0.99, 1.03, 1];

		const segment = (times: number[], t: number) => {
			let index = 0;
			while (index < times.length - 2 && t > times[index + 1]) index++;
			const local = (t - times[index]) / (times[index + 1] - times[index]);
			return { index, local: Math.min(1, Math.max(0, local)) };
		};
		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

		const frames: { offset: number; transform: string }[] = [];
		const steps = 48;
		for (let step = 0; step <= steps; step++) {
			const t = step / steps;
			const hop = segment(heightTimes, t);
			// Rising segments ease out; falling segments ease in.
			const curve = hop.index % 2 === 0 ? easeOut : easeIn;
			const y = lerp(heights[hop.index], heights[hop.index + 1], curve(hop.local));
			const squash = segment(squashTimes, t);
			const sx = lerp(squashX[squash.index], squashX[squash.index + 1], squash.local);
			const sy = lerp(squashY[squash.index], squashY[squash.index + 1], squash.local);
			frames.push({ offset: t, transform: `translateY(${y}px) scale(${sx}, ${sy})` });
		}
		return frames;
	}

	let hop: Animation | undefined;
	$effect(() => () => hop?.cancel());

	function launch() {
		// Already running: a click just brings it forward, no fanfare.
		if (running === undefined || running) return;
		running = true;
		onLaunch?.();
		if (!ref || prefersReducedMotion() || typeof ref.animate !== 'function') return;
		hop?.cancel();
		hop = ref.animate(hopFrames(), { duration: HOP });
	}

	type Handler<E extends Event> = ((event: E) => void) | null | undefined;
	/** The consumer's own listener for an event, run before the tile's. */
	const theirs = <E extends Event>(name: string) =>
		(rest as Record<string, unknown>)[name] as Handler<E>;

	const accessibleName = $derived(label && running ? `${label}, running` : label);
	const shown = $derived(dock.tip === id);

	const tileClass = $derived(
		cn(
			'mizu-dock-item group relative z-10 flex size-11 shrink-0 origin-bottom items-center justify-center rounded-xl text-foreground outline-none',
			// tile surface
			'bg-secondary shadow-lg',
			// springy settle when the pointer leaves; magnify itself stays pointer-reactive
			'transition-[scale,translate,box-shadow] duration-(--duration-spring) ease-spring',
			'hover:shadow-sm active:scale-[0.96]',
			'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
			className
		)
	);
	const tileStyle = $derived(
		[rest.style, `scale: ${scale}; translate: 0 ${lift}px;`].filter(Boolean).join('; ')
	);

	// Spread after the consumer's attributes, so each handler calls theirs first.
	const tileEvents = {
		onclick: (event: MouseEvent) => {
			theirs<MouseEvent>('onclick')?.(event);
			if (!event.defaultPrevented) launch();
		},
		onpointerenter: (event: PointerEvent) => {
			theirs<PointerEvent>('onpointerenter')?.(event);
			if (event.pointerType !== 'touch' && label) dock.showTip(id);
		},
		onfocus: (event: FocusEvent) => {
			theirs<FocusEvent>('onfocus')?.(event);
			measure();
			const target = event.currentTarget as HTMLElement;
			if (label && target.matches(':focus-visible')) dock.showTip(id, true);
		},
		onblur: (event: FocusEvent) => {
			theirs<FocusEvent>('onblur')?.(event);
			dock.hideTip();
		}
	};
</script>

{#snippet inner()}
	<!-- icon, above the sheen -->
	<span class="text-foreground relative z-10 flex items-center justify-center">
		{@render children?.()}
	</span>
{/snippet}

<!-- The slot grows with the tile, so neighbors move apart instead of the
     magnified icons overlapping. -->
<span
	class="mizu-dock-slot ease-spring relative flex shrink-0 items-end justify-center transition-[width] duration-(--duration-spring)"
	style:width="{BASE + BASE * (scale - 1) * dock.growth}px"
>
	{#if href}
		<a
			bind:this={ref}
			{href}
			aria-label={accessibleName}
			{...rest}
			class={tileClass}
			style={tileStyle}
			{...tileEvents}
		>
			{@render inner()}
		</a>
	{:else}
		<button
			bind:this={ref}
			type="button"
			aria-label={accessibleName}
			{...rest}
			class={tileClass}
			style={tileStyle}
			{...tileEvents}
		>
			{@render inner()}
		</button>
	{/if}

	{#if label}
		<!-- Outside the tile, so the caption holds still while the tile hops up
		     in front of it. -->
		<span
			aria-hidden="true"
			data-state={shown ? 'visible' : 'hidden'}
			class={cn(
				'mizu-dock-label bg-popover text-popover-foreground pointer-events-none absolute left-1/2 z-0 mb-2 -translate-x-1/2 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-lg',
				'transition-[opacity,scale,translate,bottom] duration-(--duration-base) ease-out',
				shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-95 opacity-0',
				shown && dock.tipInstant && 'transition-[bottom]'
			)}
			style:bottom="calc(100% + {clearance}px)"
		>
			{label}
		</span>
	{/if}

	{#if running !== undefined}
		<!-- The running light stays on the shelf while the tile hops. -->
		<span
			aria-hidden="true"
			class={cn(
				'bg-foreground pointer-events-none absolute top-full left-1/2 mt-1 size-1 -translate-x-1/2 rounded-full transition-[opacity,scale]',
				running
					? 'scale-100 opacity-100 delay-(--dock-first-landing) duration-(--duration-base) ease-out motion-reduce:delay-0'
					: 'scale-50 opacity-0 duration-(--duration-fast) ease-in'
			)}
			style:--dock-first-landing="{Math.round(HOP * FIRST_LANDING)}ms"
		></span>
	{/if}
</span>

<style>
	/* Self-contained reduced-motion guard: freeze the lens and bubble so the
	   dock is a static row, even when copied out without app.css. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-dock-item {
			scale: 1 !important;
			translate: none !important;
			transition: none;
		}
		.mizu-dock-slot {
			width: 2.75rem !important;
			transition: none;
		}
		.mizu-dock-label {
			transition: opacity 0.001ms;
			bottom: 100% !important;
		}
	}
</style>
