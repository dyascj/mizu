<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		duration,
		easeIn,
		prefersReducedMotion,
		SpringValue,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The reading, from 0 to 100. */
		value: number;
		/**
		 * `ring` fills a full circle. `ticks` is an instrument dial: a half circle
		 * of ticks that light up as the value sweeps in.
		 */
		variant?: 'ring' | 'ticks';
		/**
		 * Diameter in pixels for the ring, or the dial's width for ticks, clamped
		 * to the inclusive range 16 to 512. Defaults to 120 for the ring and 240
		 * for ticks.
		 */
		size?: number;
		/** Ring stroke width in pixels, clamped between 1 and half the resolved size. */
		strokeWidth?: number;
		/** Names the reading, such as "Context used". */
		label?: string;
		/** Shows the number, which counts along with the sweep. */
		showValue?: boolean;
		/**
		 * Readings above this turn destructive, and the word from `highLabel`
		 * joins the label so the state never rides on color alone. The dial tints
		 * its ticks past the limit even before the value gets there.
		 */
		threshold?: number;
		/** Said next to the label, and to screen readers, above `threshold`. */
		highLabel?: string;
		/**
		 * After a drop, a marker holds where the reading was, as on an audio
		 * meter, then falls to the new value.
		 */
		peak?: boolean;
		class?: string;
		/** The meter element. */
		ref?: HTMLDivElement | null;
		/** An icon or detail shown with the label. */
		children?: Snippet;
	};

	let {
		value,
		variant = 'ring',
		size,
		strokeWidth = 10,
		label,
		showValue = true,
		threshold,
		highLabel = 'High',
		peak = true,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	// Deterministic unique id for the gradient so multiple gauges don't collide.
	const uid = $props.id();
	const gradientId = `mizu-gauge-${uid}`;

	const isTicks = $derived(variant === 'ticks');
	const normalizedSize = $derived(
		Math.min(512, Math.max(16, Number.isFinite(size) ? (size as number) : isTicks ? 240 : 120))
	);
	const normalizedStroke = $derived(
		Math.min(normalizedSize / 2, Math.max(1, Number.isFinite(strokeWidth) ? strokeWidth : 10))
	);
	const clamped = $derived(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)));
	const high = $derived(threshold !== undefined && clamped > threshold);
	const radius = $derived((normalizedSize - normalizedStroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const center = $derived(normalizedSize / 2);
	const innerSize = $derived(Math.max(0, normalizedSize - normalizedStroke * 2));

	// Dial geometry in viewBox units: a half circle of ticks around (100, 100),
	// read left to right as 0 to 100. 41 ticks is one every 2.5%: dense enough
	// to read as a sweep, sparse enough that each tick is its own mark.
	const TICKS = 41;
	const R = 84;
	const tickPercents = Array.from({ length: TICKS }, (_, i) => (i / (TICKS - 1)) * 100);
	/** Rounded, so server and browser trig agree to the last digit. */
	const fixed = (n: number) => Math.round(n * 1000) / 1000;
	function dialPoint(percent: number, r: number) {
		const angle = Math.PI * (1 - percent / 100);
		return [fixed(100 + r * Math.cos(angle)), fixed(100 - r * Math.sin(angle))];
	}
	function ringPoint(percent: number, r: number) {
		const angle = (2 * Math.PI * percent) / 100;
		return [fixed(center + r * Math.cos(angle)), fixed(center + r * Math.sin(angle))];
	}

	let arc = $state<SVGCircleElement | null>(null);
	let marker = $state<SVGLineElement | null>(null);
	let number: HTMLElement | null = null;
	/** The counting number, written straight to its text so counting never re-renders. */
	function counting(el: HTMLElement) {
		number = el;
		paint();
		return () => {
			if (number === el) number = null;
		};
	}
	let dial = $state<SVGGElement | null>(null);

	// The server and a page without JavaScript show the real reading; the
	// browser takes over from zero and fills in once the gauge is seen.
	const initial = untrack(() => clamped);
	const initialLit = initial < 0.5 ? 0 : tickPercents.filter((p) => p <= initial + 0.5).length;

	let lit = 0;
	/** The dial the tick states were last written to; a new one is written in full. */
	let paintedDial: SVGGElement | null = null;
	let peakValue = 0;
	let fallFrame = 0;
	let holdTimer: ReturnType<typeof setTimeout> | undefined;

	// One spring drives the fill, the number, and the peak, so they never drift
	// apart. It never overshoots: an arc past the target would show a reading
	// that isn't true.
	const progress = new SpringValue(prefersReducedMotion() ? initial : 0, {
		preset: springPresets.smooth,
		onUpdate: paint
	});

	function paint() {
		const v = progress.current;
		if (v > peakValue) {
			cancelAnimationFrame(fallFrame);
			peakValue = v;
		}
		if (number) number.textContent = String(Math.round(v));
		if (arc) arc.setAttribute('stroke-dashoffset', String(circumference * (1 - v / 100)));
		if (dial) {
			// Writes only the ticks that changed. Half a percent of slack, so a
			// fill settling at 50 still lights 50.
			const count = v < 0.5 ? 0 : tickPercents.filter((p) => p <= v + 0.5).length;
			const ticks = dial.children;
			const fresh = dial !== paintedDial;
			const from = fresh ? 0 : Math.min(count, lit);
			const to = fresh ? ticks.length : Math.max(count, lit);
			for (let i = from; i < to; i++) {
				ticks[i]?.setAttribute('data-lit', String(i < count));
			}
			lit = count;
			paintedDial = dial;
		}
		if (marker) {
			const [inner, outer] = isTicks
				? [dialPoint(peakValue, R - 13), dialPoint(peakValue, R + 13)]
				: [
						ringPoint(peakValue, radius - normalizedStroke / 2 - 2),
						ringPoint(peakValue, radius + normalizedStroke / 2 + 2)
					];
			marker.setAttribute('x1', String(inner[0]));
			marker.setAttribute('y1', String(inner[1]));
			marker.setAttribute('x2', String(outer[0]));
			marker.setAttribute('y2', String(outer[1]));
			// Shows only once it has come apart from the fill, fading in over the
			// first few percent of separation instead of popping.
			marker.style.opacity = String(Math.min(Math.max((peakValue - v - 1) / 3, 0), 1));
		}
	}

	/** The marker is let go and drops under its own weight: slow, then fast. */
	function fall(to: number) {
		cancelAnimationFrame(fallFrame);
		if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
			peakValue = to;
			paint();
			return;
		}
		const from = peakValue;
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			const t = Math.min(1, (now - start) / duration.deliberate);
			peakValue = Math.max(to, from + (to - from) * easeIn(t));
			paint();
			if (t < 1) fallFrame = requestAnimationFrame(tick);
		};
		fallFrame = requestAnimationFrame(tick);
	}

	// Fills in when first seen, so a gauge below the fold still gets its
	// entrance instead of finishing offscreen.
	let seen = $state(false);
	$effect(() => {
		if (!ref || seen) return;
		if (typeof IntersectionObserver === 'undefined') {
			seen = true;
			return;
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) seen = true;
		});
		observer.observe(ref);
		return () => observer.disconnect();
	});

	$effect(() => {
		const target = clamped;
		if (!seen) return;
		progress.set(target);
		clearTimeout(holdTimer);
		if (target >= peakValue) return;
		if (!peak) {
			peakValue = target;
			return;
		}
		// Holds long enough to be seen once the fill has settled, then falls.
		holdTimer = setTimeout(() => fall(target), duration.ambient / 2);
	});

	// Geometry changes redraw from wherever the spring is.
	$effect(() => {
		void circumference;
		void isTicks;
		void arc;
		void dial;
		void marker;
		paint();
	});

	$effect(() => () => {
		progress.stop();
		cancelAnimationFrame(fallFrame);
		clearTimeout(holdTimer);
	});
</script>

<div
	bind:this={ref}
	role="meter"
	data-variant={variant}
	aria-valuenow={Math.round(clamped)}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuetext={high ? `${Math.round(clamped)}%, ${highLabel.toLowerCase()}` : undefined}
	aria-label={label ?? 'Progress'}
	class={cn(
		'relative inline-flex items-center justify-center',
		isTicks && 'max-w-full flex-col',
		className
	)}
	style={isTicks
		? `width: ${normalizedSize}px;`
		: `width: ${normalizedSize}px; height: ${normalizedSize}px;`}
	{...rest}
>
	{#if isTicks}
		<div class="relative w-full">
			<svg
				viewBox="0 0 200 110"
				class="block w-full overflow-visible"
				fill="none"
				aria-hidden="true"
			>
				<g bind:this={dial}>
					{#each tickPercents as p, i (i)}
						{@const [x1, y1] = dialPoint(p, R - 8)}
						{@const [x2, y2] = dialPoint(p, R + 8)}
						<!-- A short fade per tick turns the sweep into a smooth wave. Past
						     the limit the ticks are faintly tinted even when unlit, so the
						     limit shows before the value gets there. -->
						<line
							{x1}
							{y1}
							{x2}
							{y2}
							data-lit={String(i < initialLit)}
							stroke-width="2.5"
							stroke-linecap="round"
							class={cn(
								'transition-[stroke] duration-(--duration-fast) ease-out',
								threshold !== undefined && p > threshold
									? 'stroke-destructive/25 data-[lit=true]:stroke-destructive'
									: 'stroke-control data-[lit=true]:stroke-primary'
							)}
						/>
					{/each}
				</g>
				{#if peak}
					<line
						bind:this={marker}
						stroke-width="2"
						stroke-linecap="round"
						class="stroke-foreground"
						style:opacity="0"
					/>
				{/if}
			</svg>
			{#if showValue}
				<!-- Tabular, so the width holds steady while the number counts. -->
				<span
					aria-hidden="true"
					class="text-foreground absolute inset-x-0 bottom-0 flex items-baseline justify-center leading-none font-semibold tracking-tight tabular-nums"
					style:font-size="{Math.round(normalizedSize * 0.19)}px"
				>
					<span {@attach counting}>{Math.round(initial)}</span><span
						class="text-muted-foreground ml-1 font-medium"
						style:font-size="{Math.round(normalizedSize * 0.075)}px">%</span
					>
				</span>
			{/if}
		</div>
		{#if label || children}
			<div aria-hidden="true" class="relative mt-3 flex h-6 items-center gap-1.5 text-sm">
				{@render children?.()}
				{#if label}<span class="text-muted-foreground">{label}</span>{/if}
				<!-- Out of flow, so the label stays centered whether or not it shows. -->
				<span
					class={cn(
						'text-foreground absolute start-full ms-2 flex items-center gap-1.5 font-medium whitespace-nowrap',
						high
							? 'translate-y-0 opacity-100 blur-none transition-[opacity,filter,translate] duration-(--duration-base) ease-out'
							: 'translate-y-0.5 opacity-0 blur-[4px] transition-[opacity,filter,translate] duration-(--duration-fast) ease-in motion-reduce:translate-y-0 motion-reduce:blur-none'
					)}
				>
					<span class="bg-destructive size-2 rounded-full"></span>
					{highLabel}
				</span>
			</div>
		{/if}
	{:else}
		<svg
			width={normalizedSize}
			height={normalizedSize}
			viewBox="0 0 {normalizedSize} {normalizedSize}"
			class="-rotate-90 overflow-visible"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="color-mix(in oklab, var(--primary) 55%, white)" />
					<stop offset="100%" stop-color="var(--primary)" />
				</linearGradient>
			</defs>
			<circle
				cx={center}
				cy={center}
				r={radius}
				fill="none"
				stroke="currentColor"
				class="text-muted-foreground/15"
				stroke-width={normalizedStroke}
			/>
			<circle
				bind:this={arc}
				cx={center}
				cy={center}
				r={radius}
				fill="none"
				stroke={high ? 'var(--destructive)' : `url(#${gradientId})`}
				stroke-width={normalizedStroke}
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={circumference * (1 - initial / 100)}
			/>
			{#if peak}
				<line
					bind:this={marker}
					stroke-width={Math.max(1, Math.min(2, normalizedStroke / 4))}
					stroke-linecap="round"
					class="stroke-foreground"
					style:opacity="0"
				/>
			{/if}
		</svg>
		<div
			class="pointer-events-none absolute flex flex-col items-center justify-center gap-0.5 text-center"
			style:width="{innerSize * 0.8}px"
		>
			{#if innerSize >= 64}
				{@render children?.()}
			{/if}
			{#if showValue && innerSize >= 32}
				<span
					{@attach counting}
					class="font-display text-foreground leading-none font-semibold tabular-nums"
					style:font-size="{Math.min(24, innerSize * 0.4)}px"
				>
					{Math.round(initial)}
				</span>
			{/if}
			{#if label && innerSize >= 64}
				<span
					class="text-muted-foreground w-full truncate text-xs leading-tight font-medium"
					title={label}
				>
					{high ? `${label} · ${highLabel}` : label}
				</span>
			{/if}
		</div>
	{/if}
</div>
