<script lang="ts" module>
	export type MeterSegment = {
		/** Stable key for the slice. */
		id: string;
		/** Names the slice in the legend and the readout. */
		label: string;
		/** The slice's share of the range. Setting it to 0 clears the slice. */
		value: number;
		/** Fill classes for the slice and its legend dot, such as `bg-info`. */
		class?: string;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		blurIn,
		duration,
		easeIn,
		prefersReducedMotion,
		SpringValue,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { flip } from 'svelte/animate';
	import { shatter, type ShatterOptions } from './shatter.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** The reading. With `segments`, the segments' sum is used instead. */
		value?: number;
		min?: number;
		max?: number;
		low?: number;
		high?: number;
		optimum?: number;
		/** Names the reading. With `segments`, it heads the readout. */
		label?: string;
		/** Shows the formatted value beside the label. */
		showValue?: boolean;
		/** Formats values for display, such as `(v) => \`${v} GB\``. */
		format?: (v: number) => string;
		/**
		 * Splits the bar into slices that add up to the reading, such as usage by
		 * model. Hovering a slice, or hovering or focusing its legend entry,
		 * lights it and shows its value in the readout. When a slice drops to 0
		 * it squashes and breaks apart, its gap closes, and the total counts down.
		 */
		segments?: MeterSegment[];
		/**
		 * The segment pinned in the readout. Clicking a legend entry pins or
		 * unpins it; hover and focus preview others meanwhile.
		 */
		active?: string | null;
		class?: string;
	};

	let {
		value = 0,
		min = 0,
		max = 100,
		low,
		high,
		optimum,
		label,
		showValue = false,
		format,
		segments,
		active = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const normalizedMin = $derived(Number.isFinite(min) ? min : 0);
	const normalizedMax = $derived(
		Number.isFinite(max) && max > normalizedMin ? max : normalizedMin + 1
	);
	const range = $derived(normalizedMax - normalizedMin);
	const segmentTotal = $derived(
		segments?.reduce((sum, s) => sum + (Number.isFinite(s.value) ? Math.max(0, s.value) : 0), 0)
	);
	const normalizedValue = $derived(
		segmentTotal !== undefined
			? normalizedMin + segmentTotal
			: Number.isFinite(value)
				? value
				: normalizedMin
	);
	const clamped = $derived(Math.max(normalizedMin, Math.min(normalizedMax, normalizedValue)));
	const pct = $derived(((clamped - normalizedMin) / range) * 100);

	/* HTML <meter> zone algorithm. `low`/`high` carve the range into three bands;
	   `optimum` says which band is "good", which is sub-optimal, which is poor. */
	const zone = $derived.by(() => {
		const lo = low ?? normalizedMin;
		const hi = high ?? normalizedMax;
		if (optimum == null) return 'primary';

		if (optimum < lo) {
			// optimum sits in the low band: lower is better
			if (clamped <= lo) return 'success';
			if (clamped <= hi) return 'warning';
			return 'destructive';
		}
		if (optimum > hi) {
			// optimum sits in the high band: higher is better
			if (clamped >= hi) return 'success';
			if (clamped >= lo) return 'warning';
			return 'destructive';
		}
		// optimum sits in the middle band: the extremes are sub-optimal
		if (clamped >= lo && clamped <= hi) return 'success';
		return 'warning';
	});

	const fillGradient = $derived(
		{
			success: 'bg-success',
			warning: 'bg-warning',
			destructive: 'bg-destructive',
			primary: 'bg-primary'
		}[zone]
	);

	const formatted = $derived(format ? format(clamped) : String(clamped));

	// Segmented mode. Neutral tones step down from the primary, so slices read
	// as parts of one reading rather than competing categories.
	const tones = ['bg-primary', 'bg-primary/70', 'bg-primary/50', 'bg-primary/30', 'bg-primary/20'];
	const toneOf = (segment: MeterSegment, i: number) => segment.class ?? tones[i % tones.length];
	const amount = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0);

	/** Enough decimals to show every segment exactly, so counting never shows noise. */
	const decimals = $derived(
		Math.min(
			2,
			Math.max(0, ...(segments ?? []).map((s) => (String(s.value).split('.')[1] ?? '').length))
		)
	);
	/** Rounded first, so a `format` sees the same clean numbers while the total counts. */
	const show = (v: number) => (format ? format(Number(v.toFixed(decimals))) : v.toFixed(decimals));

	let preview = $state<string | null>(null);
	const visible = $derived((segments ?? []).filter((s) => amount(s.value) > 0));
	// Only a slice still on the bar can hold focus, so clearing a pinned or
	// hovered slice never leaves the rest dimmed around a gap.
	const focus = $derived(
		[preview, active].find((id) => id != null && visible.some((s) => s.id === id)) ?? null
	);
	const focused = $derived(visible.find((s) => s.id === focus));
	const count = $derived(segments?.length ?? 0);
	const legendRows = $derived(Math.ceil(count / 2));

	// The total counts to its new value instead of jumping, written straight to
	// the text so counting never re-renders anything.
	let totalText: HTMLElement | null = null;
	function counting(el: HTMLElement) {
		totalText = el;
		el.textContent = show(counter.current);
		return () => {
			if (totalText === el) totalText = null;
		};
	}
	const counter = new SpringValue(untrackedTotal(), {
		preset: springPresets.smooth,
		onUpdate: (v) => {
			if (totalText) totalText.textContent = show(v);
		}
	});
	function untrackedTotal() {
		return segments ? amount(segmentTotal ?? 0) : 0;
	}
	$effect(() => {
		const target = clamped - normalizedMin;
		if (segments) counter.set(target);
	});
	$effect(() => () => counter.stop());

	// Each clear gets its own burst of pieces, from where the slice sat.
	let previous = new Map<string, number>();
	let burst = $state<(ShatterOptions & { key: number }) | null>(null);
	let bursts = 0;
	let slices = $state<Record<string, HTMLElement>>({});
	let announcement = $state('');
	$effect.pre(() => {
		if (!segments) return;
		const before = previous;
		const next = new Map(segments.map((s) => [s.id, amount(s.value)]));
		previous = next;
		for (const [i, segment] of segments.entries()) {
			const was = before.get(segment.id) ?? 0;
			if (was <= 0 || amount(segment.value) > 0) continue;
			const offset = segments.slice(0, i).reduce((sum, s) => sum + (before.get(s.id) ?? 0), 0);
			announcement = `${segment.label} cleared, ${show(clamped - normalizedMin)} of ${show(range)} used`;
			if (prefersReducedMotion()) continue;
			const fill = slices[segment.id]?.firstElementChild;
			burst = {
				key: ++bursts,
				start: (offset / range) * 100,
				width: (was / range) * 100,
				color: fill ? getComputedStyle(fill).backgroundColor : 'currentColor',
				above: 48,
				bar: 12,
				shelf: 18
			};
		}
	});

	/** The readout swap: arriving words rise out of a blur, leaving ones drop away faster. */
	function leave(_node: Element) {
		if (prefersReducedMotion()) return { duration: 0 };
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t: number, u: number) =>
				`opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * -4}px`
		};
	}
	function fadeOut(_node: Element) {
		return {
			duration: prefersReducedMotion() ? 0 : duration.fast,
			easing: easeIn,
			css: (t: number, u: number) => `opacity: ${t}; filter: blur(${u * 4}px)`
		};
	}
	function fadeIn(_node: Element) {
		return { duration: duration.base, css: (t: number) => `opacity: ${t}` };
	}
</script>

{#if segments}
	<div class={cn('@container w-full', className)} {...rest}>
		<!-- The readout: the total, or whichever slice you point at. -->
		<div class="grid h-12">
			{#key focused?.id ?? ''}
				<div
					class="col-start-1 row-start-1"
					in:blurIn={{ duration: duration.base, blur: 4, y: 4 }}
					out:leave
				>
					<p class="text-muted-foreground text-xs font-medium">
						{focused ? focused.label : (label ?? 'Usage')}
					</p>
					<p class="text-muted-foreground mt-1 text-sm">
						{#if focused}
							<span class="text-foreground text-2xl font-semibold tracking-tight tabular-nums"
								>{show(amount(focused.value))}</span
							>
						{:else}
							<span
								{@attach counting}
								class="text-foreground text-2xl font-semibold tracking-tight tabular-nums"
								>{show(clamped - normalizedMin)}</span
							>
							of {show(range)} used
						{/if}
					</p>
				</div>
			{/key}
		</div>

		<div class="relative mt-4">
			<div
				role="meter"
				aria-valuenow={Number(clamped.toFixed(decimals))}
				aria-valuemin={normalizedMin}
				aria-valuemax={normalizedMax}
				aria-valuetext="{show(clamped - normalizedMin)} of {show(range)}"
				aria-label={label ?? 'Meter'}
				class="bg-secondary flex h-3 w-full overflow-hidden rounded-full"
				onpointerleave={() => (preview = null)}
			>
				{#each segments as segment, i (segment.id)}
					{@const cleared = amount(segment.value) <= 0}
					<!-- The slice carries its 2px gap inside its width, so a slice
					     shrinking to nothing takes its gap along. A cleared slice holds
					     its width a beat, squashed, then the gap closes behind it. -->
					<div
						bind:this={slices[segment.id]}
						aria-hidden="true"
						class={cn(
							'relative h-full shrink-0 overflow-hidden [transition:width_var(--duration-spring-snappy)_var(--ease-spring-snappy)_var(--slice-delay),opacity_var(--duration-fast)_var(--ease-out)] motion-reduce:[--slice-delay:0ms]!'
						)}
						style:--slice-delay={cleared ? 'var(--duration-base)' : '0ms'}
						style:width="{(amount(segment.value) / range) * 100}%"
						style:opacity={focus && focus !== segment.id ? 0.3 : 1}
						onpointerenter={() => (preview = segment.id)}
					>
						<span
							class={cn(
								'absolute inset-y-0 start-0 end-[2px] origin-center',
								toneOf(segment, i),
								cleared
									? 'scale-x-[1.04] scale-y-[0.45] opacity-0 [transition:scale_var(--duration-instant)_var(--ease-in),opacity_0ms_linear_var(--duration-instant)] motion-reduce:scale-100'
									: 'scale-100 opacity-100 [transition:scale_var(--duration-base)_var(--ease-out),opacity_var(--duration-base)_var(--ease-out)]'
							)}
						></span>
					</div>
				{/each}
			</div>
			{#if burst}
				{#key burst.key}
					<canvas
						aria-hidden="true"
						class="pointer-events-none absolute start-0 w-full"
						style:top="-{burst.above}px"
						style:height="{burst.above + burst.bar + burst.shelf + 16}px"
						{@attach shatter(burst)}
					></canvas>
				{/key}
			{/if}
		</div>

		<!-- Holds its rows even when a slice goes, so clearing never shrinks the
		     block and moves whatever sits below it. -->
		<ul
			class="mt-5 grid min-h-(--legend-narrow) auto-rows-min grid-cols-1 gap-x-4 gap-y-1 @[18rem]:min-h-(--legend-wide) @[18rem]:grid-cols-2"
			style:--legend-narrow="calc({count} * 2rem + {Math.max(0, count - 1)} * 0.25rem)"
			style:--legend-wide="calc({legendRows} * 2rem + {Math.max(0, legendRows - 1)} * 0.25rem)"
		>
			{#each visible as segment (segment.id)}
				{@const i = segments.indexOf(segment)}
				<li animate:flip={{ duration: duration.base }} in:fadeIn out:fadeOut>
					<button
						type="button"
						aria-pressed={active === segment.id}
						onpointerenter={() => (preview = segment.id)}
						onpointerleave={() => (preview = null)}
						onfocus={() => (preview = segment.id)}
						onblur={() => (preview = null)}
						onclick={() => (active = active === segment.id ? null : segment.id)}
						class={cn(
							'focus-visible:ring-ring flex h-8 w-full items-center gap-2 rounded-full px-2.5 text-start text-sm transition-[background-color,opacity] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2',
							focus === segment.id && 'bg-secondary',
							focus && focus !== segment.id && 'opacity-60'
						)}
					>
						<span aria-hidden="true" class={cn('size-2 shrink-0 rounded-full', toneOf(segment, i))}
						></span>
						<span class="text-foreground min-w-0 flex-1 truncate">{segment.label}</span>
						<span class="text-muted-foreground shrink-0 whitespace-nowrap tabular-nums"
							>{show(amount(segment.value))}</span
						>
					</button>
				</li>
			{/each}
		</ul>
		<span class="sr-only" aria-live="polite">{announcement}</span>
	</div>
{:else}
	<div class={cn('w-full', className)} {...rest}>
		{#if label || showValue}
			<div class="mb-1.5 flex items-center justify-between text-sm">
				{#if label}
					<span class="text-muted-foreground">{label}</span>
				{/if}
				{#if showValue}
					<span class="text-foreground font-semibold tabular-nums">{formatted}</span>
				{/if}
			</div>
		{/if}

		<div
			role="meter"
			aria-valuenow={clamped}
			aria-valuemin={normalizedMin}
			aria-valuemax={normalizedMax}
			aria-label={label ?? 'Meter'}
			class="bg-secondary relative h-2.5 w-full overflow-hidden rounded-full"
		>
			<div
				class={cn(
					' relative h-full overflow-hidden rounded-full transition-[width] duration-(--duration-slow) ease-out',
					fillGradient
				)}
				style="width: {pct}%"
			></div>
		</div>
	</div>
{/if}
